import { test, expect } from "@playwright/test";

test("homepage has correct title and visible call-to-action", async ({ page }) => {
  await page.goto("/");

  // Expect the title to contain BizConnect
  await expect(page).toHaveTitle(/BizConnect/i);

  // Expect a heading or logo text with BizConnect
  const logo = page.locator("text=BizConnect").first();
  await expect(logo).toBeVisible();

  // Expect the explore or login link to be in the document
  const exploreLink = page.locator('a[href="/explore"]').first();
  await expect(exploreLink).toBeVisible();
});
