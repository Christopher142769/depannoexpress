import { test, expect, type Page } from "@playwright/test";
import { DEMO_PASSWORD } from "../src/lib/demo-accounts";

async function signupViaApi(
  page: Page,
  data: {
    email: string;
    password: string;
    role: "client" | "pro";
    name: string;
    phone?: string;
  }
) {
  return page.request.post("/api/auth/signup", { data });
}

async function loginViaApi(
  page: Page,
  data: { email: string; password: string; role: "client" | "pro" | "admin" }
) {
  return page.request.post("/api/auth/login", { data });
}

test.describe("Parcours critiques", () => {
  test("1. Inscription → dashboard client", async ({ page }) => {
    const email = `client.e2e.${Date.now()}@example.com`;

    await page.goto("/signup");
    await page.getByLabel(/nom complet/i).fill("Client E2E");
    await page.getByLabel(/adresse email/i).fill(email);
    await page.getByLabel(/téléphone/i).fill("+22997000001");
    await page.getByLabel(/mot de passe/i).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /créer mon compte/i }).click();

    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
    await expect(page.getByText(/bonjour|signaler une panne|espace utilisateur/i).first()).toBeVisible();
  });

  test("2. Intervention client → acceptation pro (2 contextes)", async ({ browser }) => {
    const stamp = Date.now();
    const clientEmail = `client.flow.${stamp}@example.com`;
    const proEmail = `pro.flow.${stamp}@example.com`;

    const clientCtx = await browser.newContext();
    const proCtx = await browser.newContext();
    const client = await clientCtx.newPage();
    const pro = await proCtx.newPage();

    const signupClient = await signupViaApi(client, {
      email: clientEmail,
      password: DEMO_PASSWORD,
      role: "client",
      name: "Client Flow",
      phone: "+22997000002",
    });
    expect(signupClient.ok()).toBeTruthy();

    const signupPro = await signupViaApi(pro, {
      email: proEmail,
      password: DEMO_PASSWORD,
      role: "pro",
      name: "Pro Flow",
      phone: "+22997000003",
    });
    expect(signupPro.ok()).toBeTruthy();

    const avail = await pro.request.patch("/api/pro/availability", {
      data: {
        isAvailable: true,
        lat: 6.3703,
        lng: 2.3912,
        specialty: "mecanicien",
      },
    });
    expect(avail.ok()).toBeTruthy();

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
    const password = DEMO_PASSWORD;

    const signup = await signupViaApi(page, {
      email,
      password,
      role: "client",
      name: "Admin E2E",
      phone: "+22997000004",
    });
    if (!signup.ok()) {
      test.skip(true, "Signup impossible");
    }

    try {
      const { connectDB } = await import("../src/server/db/mongodb");
      const { User } = await import("../src/server/db/models");
      await connectDB();
      await User.findOneAndUpdate({ email: email.toLowerCase() }, { role: "admin" });
    } catch {
      test.skip(true, "MongoDB indisponible");
    }

    await page.request.post("/api/auth/logout");
    const login = await loginViaApi(page, { email, password, role: "admin" });
    expect(login.ok()).toBeTruthy();

    await page.goto("/admin");
    await expect(page.getByText(/back-office|administration|tableau de bord/i).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/interventions/i).first()).toBeVisible();
  });
});
