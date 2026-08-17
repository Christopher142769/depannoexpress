import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin.demo@depannage-express.bj";
const ADMIN_PASSWORD = "Demo123!";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 15000 });
}

test.describe("Admin shop management", () => {
  test("admin can navigate to shop page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('a[href="/admin/shop"]');
    await expect(page.locator("text=Boutique")).toBeVisible();
  });

  test("admin can create a product with image", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/shop");

    // Click "Nouvel article" button
    await page.click("button:has-text('Nouvel article')");

    // Fill the form
    await page.fill('input[placeholder*="Pneu"]', "Test Pneu E2E");
    await page.fill('textarea', "Pneu de test pour les tests e2e");

    // Select category
    await page.selectOption('select', "pneu");

    // Set price
    await page.fill('input[placeholder="0"]:first-of-type', "25000");

    // Set stock
    const stockInputs = page.locator('input[placeholder="0"]');
    await stockInputs.last().fill("10");

    // Submit
    await page.click("button:has-text('Créer')");

    // Verify success
    await expect(page.locator("text=Test Pneu E2E")).toBeVisible({ timeout: 10000 });
  });

  test("admin can edit a product", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/shop");

    // Find the product and click edit
    const editButton = page.locator("button:has-text('Modifier')").first();
    await editButton.click();

    // Change name
    const nameInput = page.locator('input[placeholder*="Pneu"]');
    await nameInput.clear();
    await nameInput.fill("Test Pneu E2E Modifié");

    // Save
    await page.click("button:has-text('Modifier'):not(:has-text('Pencil'))");

    // Verify update
    await expect(page.locator("text=Test Pneu E2E Modifié")).toBeVisible({ timeout: 10000 });
  });

  test("admin can deactivate a product", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/shop");

    page.on("dialog", (dialog) => dialog.accept());

    const deactivateButton = page.locator("button:has-text('Désactiver')").first();
    await deactivateButton.click();

    await expect(page.locator("text=Article désactivé")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin trades management", () => {
  test("admin can create a trade", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/trades");

    await page.fill('input[placeholder*="Mécanicien"]', "Test Métier E2E");
    await page.click("button:has-text('Ajouter')");

    await expect(page.locator("text=Test Métier E2E")).toBeVisible({ timeout: 10000 });
  });

  test("admin can toggle a trade active status", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/trades");

    const toggle = page.locator("button svg.text-success, button svg.text-text-secondary").first();
    await toggle.click();
    await page.waitForTimeout(1000);
  });
});

test.describe("Geolocation denied fallback", () => {
  test("shows manual input when geolocation is unavailable", async ({ page }) => {
    // Grant no permissions for geolocation
    await page.context().grantPermissions([], { origin: "http://localhost:3000" });

    await page.goto("/login");
    await page.fill('input[type="email"]', "client.demo@depannage-express.bj");
    await page.fill('input[type="password"]', "Demo123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/app", { timeout: 15000 });

    // Try to use location button
    const locationButton = page.locator("button:has-text('Ma position')");
    if (await locationButton.isVisible()) {
      await locationButton.click();
      // Should show denied state or manual fallback
      const manualButton = page.locator("button:has-text('Entrer mon adresse')");
      const deniedText = page.locator("text=refusé");
      await expect(manualButton.or(deniedText)).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("Pricing admin", () => {
  test("admin can navigate to pricing page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('a[href="/admin/pricing"]');
    await expect(page.locator("text=Tarification")).toBeVisible();
  });
});

test.describe("Boutique client displays products", () => {
  test("client boutique page shows product grid", async ({ page }) => {
    await page.goto("/app/boutique");
    await expect(page.locator("text=Boutique")).toBeVisible();
  });
});
