import { test, expect } from "@playwright/test";

test.describe("Business Account E2E Flow", () => {
  const timestamp = Date.now();
  const testEmail = `test_playwright_business_${timestamp}@example.com`;
  const testPassword = "Password123!";
  const businessName = `Playwright Biz ${timestamp}`;

  test("User can register as business, setup profile, and access business features", async ({ page }) => {
    // 1. Sign up
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    
    // Choose Business Account
    await page.locator("button", { hasText: /Doanh nghiệp|Business/i }).click();

    // Fill form
    await page.fill('input[id="name"]', businessName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    
    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to /dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // 2. Business Profile Dashboard
    // Check if the dashboard loaded and biz name is visible
    const usernamePrefix = testEmail.split('@')[0];
    await expect(page.locator("body")).toContainText(usernamePrefix);

    // Navigate to Edit Profile
    await page.locator("a", { hasText: /Chỉnh sửa DN|Edit/i }).first().click();
    await expect(page.locator("body")).toContainText(/Tạo danh thiếp mới|Quản lý thông tin|Edit/i);
    // The edit page has multiple steps. We are on step 1 (Overview).
    // Let's just find the save draft button and click it to test saving.
    const saveBtn = page.locator("button", { hasText: /Lưu nháp|Save/i }).first();
    await saveBtn.click();
    
    // 3. Upgrades / Pricing from Dashboard
    await page.locator("a", { hasText: /Bảng giá|Pricing/i }).first().click();
    await expect(page.locator("body")).toContainText(/Gói|Pricing|Bảng giá/i);
    
    // Test clicking a business upgrade
    const upgradeBizBtn = page.locator("button", { hasText: /Nâng cấp|Mua ngay|Buy/i }).nth(1);
    if (await upgradeBizBtn.isVisible()) {
      await upgradeBizBtn.click();
      await expect(page.locator("body")).toContainText(/Thanh toán|Payment/i);
      
      // Attempt to confirm manual payment
      const confirmBtn = page.locator("button", { hasText: /Đã chuyển khoản|Confirm/i }).first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        // Look for success toast or pending status
        await expect(page.locator("body")).toContainText(/thành công|success/i, { timeout: 10000 });
      }
    }
  });
});
