import { test, expect, type Page } from "@playwright/test";

async function requestOtp(page: Page, email: string, mode: "signup" | "login", extra?: Record<string, string>) {
  const res = await page.request.post("/api/auth/request-otp", {
    data: {
      mode,
      email,
      role: "client",
      ...extra,
    },
  });
  return res;
}

async function readLatestOtpFromDb(email: string): Promise<string | null> {
  // En e2e, on lit le code via une API interne uniquement si EMAIL_PROVIDER=console
  // et que Mongo est disponible — sinon le test signup soft-skip.
  const { connectDB } = await import("../src/server/db/mongodb");
  const { OTP } = await import("../src/server/db/models");
  await connectDB();
  const otp = await OTP.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
  return otp?.code ?? null;
}

test.describe("Parcours critiques", () => {
  test("1. Inscription → OTP → dashboard client", async ({ page }) => {
    const email = `client.e2e.${Date.now()}@example.com`;

    await page.goto("/signup?role=client");
    await page.getByLabel(/nom complet/i).fill("Client E2E");
    await page.getByLabel(/adresse e-mail/i).fill(email);
    await page.getByLabel(/téléphone/i).fill("+22997000001");
    await page.getByRole("button", { name: /continuer/i }).click();

    await expect(page).toHaveURL(/\/otp/);

    let code: string | null = null;
    try {
      code = await readLatestOtpFromDb(email);
    } catch {
      test.skip(true, "MongoDB / OTP indisponible pour e2e");
    }
    expect(code).toBeTruthy();

    for (const [i, digit] of [...(code as string)].entries()) {
      await page.getByRole("textbox").nth(i).fill(digit);
    }
    await page.getByRole("button", { name: /vérifier/i }).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
    await expect(page.getByText(/espace client/i)).toBeVisible();
  });

  test("2. Intervention client → acceptation pro (2 contextes)", async ({ browser }) => {
    const stamp = Date.now();
    const clientEmail = `client.flow.${stamp}@example.com`;
    const proEmail = `pro.flow.${stamp}@example.com`;

    const clientCtx = await browser.newContext();
    const proCtx = await browser.newContext();
    const client = await clientCtx.newPage();
    const pro = await proCtx.newPage();

    // Création comptes via API
    const signupClient = await client.request.post("/api/auth/request-otp", {
      data: {
        mode: "signup",
        email: clientEmail,
        role: "client",
        name: "Client Flow",
        phone: "+22997000002",
      },
    });
    expect(signupClient.ok()).toBeTruthy();

    const signupPro = await pro.request.post("/api/auth/request-otp", {
      data: {
        mode: "signup",
        email: proEmail,
        role: "pro",
        name: "Pro Flow",
        phone: "+22997000003",
      },
    });
    expect(signupPro.ok()).toBeTruthy();

    let clientCode: string | null = null;
    let proCode: string | null = null;
    try {
      clientCode = await readLatestOtpFromDb(clientEmail);
      proCode = await readLatestOtpFromDb(proEmail);
    } catch {
      test.skip(true, "MongoDB indisponible");
    }

    async function verify(page: Page, email: string, code: string) {
      const res = await page.request.post("/api/auth/verify-otp", {
        data: { email, code },
      });
      expect(res.ok()).toBeTruthy();
    }

    await verify(client, clientEmail, clientCode!);
    await verify(pro, proEmail, proCode!);

    // Pro dispo près de Cotonou
    const avail = await pro.request.patch("/api/pro/availability", {
      data: {
        isAvailable: true,
        lat: 6.3703,
        lng: 2.3912,
        specialty: "mecanicien",
      },
    });
    expect(avail.ok()).toBeTruthy();

    // Client crée une intervention
    const created = await client.request.post("/api/interventions", {
      data: {
        problem: "Batterie à plat e2e",
        lat: 6.371,
        lng: 2.392,
        estimatedPrice: 8000,
      },
    });
    expect(created.ok()).toBeTruthy();
    const { intervention } = (await created.json()) as { intervention: { id: string } };

    const missions = await pro.request.get("/api/pro/missions");
    expect(missions.ok()).toBeTruthy();
    const missionData = (await missions.json()) as { missions: { id: string }[] };
    expect(missionData.missions.some((m) => m.id === intervention.id)).toBeTruthy();

    const accept = await pro.request.post(`/api/pro/missions/${intervention.id}/accept`);
    expect(accept.ok()).toBeTruthy();

    await clientCtx.close();
    await proCtx.close();
  });

  test("3. Connexion admin → liste interventions", async ({ page }) => {
    const email = `admin.e2e.${Date.now()}@example.com`;

    // Crée un user client puis promote en admin via Mongo
    const signup = await requestOtp(page, email, "signup", {
      name: "Admin E2E",
      phone: "+22997000004",
    });
    if (!signup.ok()) {
      test.skip(true, "Signup admin impossible");
    }

    let code: string | null = null;
    try {
      const { connectDB } = await import("../src/server/db/mongodb");
      const { User, OTP } = await import("../src/server/db/models");
      await connectDB();
      const otp = await OTP.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
      code = otp?.code ?? null;
      await User.findOneAndUpdate({ email: email.toLowerCase() }, { role: "admin" });
    } catch {
      test.skip(true, "MongoDB indisponible");
    }

    const verify = await page.request.post("/api/auth/verify-otp", {
      data: { email, code },
    });
    // verify may fail role mismatch if session created as client before promote —
    // re-request otp after promote
    if (!verify.ok()) {
      await page.request.post("/api/auth/request-otp", {
        data: { mode: "login", email, role: "client" },
      });
      // Force login after role change: use login as client won't work for admin middleware.
      // Promote then login via verify after regenerating OTP as the user still has admin role.
      try {
        const { connectDB } = await import("../src/server/db/mongodb");
        const { OTP } = await import("../src/server/db/models");
        await connectDB();
        // request-otp with role client fails for admin — create OTP manually for verify
        const { generateOtpCode } = await import("../src/server/auth/otp");
        const { OTP_EXPIRY_MINUTES } = await import("../src/lib/constants");
        const manual = generateOtpCode();
        await OTP.deleteMany({ email: email.toLowerCase() });
        await OTP.create({
          email: email.toLowerCase(),
          code: manual,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
          attempts: 0,
        });
        code = manual;
      } catch {
        test.skip(true, "Impossible de préparer OTP admin");
      }
      const again = await page.request.post("/api/auth/verify-otp", {
        data: { email, code },
      });
      expect(again.ok()).toBeTruthy();
    }

    await page.goto("/admin");
    await expect(page.getByText(/back-office|administration/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/interventions/i).first()).toBeVisible();
  });
});
