import { test, expect } from "@playwright/test";

test.describe("Personal Account E2E Flow", () => {
  const timestamp = Date.now();
  const testEmail = `test_playwright_personal_${timestamp}@example.com`;
  const testPassword = "Password123!";

  test("User can register, setup profile, use inbox, and view pricing", async ({ page }) => {
    // 1. Sign up
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    
    // Choose Personal Account
    await page.locator("button", { hasText: /Cá nhân|Personal/i }).click();

    // Fill form
    await page.fill('input[id="name"]', "Test Personal User");
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    
    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to /me
    await page.waitForURL("**/me", { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/me/);
    
    // 2. My Profile (Card Management)
    // Check if the personal dashboard loaded
    await expect(page.locator("body")).toContainText(/Personal Card|Hồ sơ cá nhân/i);

    // 3. Messages / Inbox
    await page.locator("a", { hasText: /Hộp thư|Inbox/i }).first().click();
    await expect(page.locator("body")).toContainText(/Hộp thư kết nối|Inbox/i);

    // 4. Contacts / Following
    await page.locator("a", { hasText: /Danh bạ|Following|Contacts/i }).first().click();
    await expect(page.locator("body")).toContainText(/Danh bạ|Following|Contacts/i);

    // 5. Upgrades / Pricing
    await page.locator("a", { hasText: /Bảng giá|Pricing/i }).first().click();
    await expect(page.locator("body")).toContainText(/Gói|Pricing|Bảng giá/i);
    
    // Click upgrade button (Personal Addon)
    const upgradeBtn = page.locator("button", { hasText: /Nâng cấp|Mua ngay|Buy/i }).first();
    if (await upgradeBtn.isVisible()) {
      await upgradeBtn.click();
      // Should show payment modal
      await expect(page.locator("body")).toContainText(/Thanh toán|Payment/i);
    }
  });
});
