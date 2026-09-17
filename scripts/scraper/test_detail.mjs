import { chromium } from "playwright";
import fs from "fs";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://vietnamplas.chanchao.com.tw/VisitorExhibitor/Detail?regNo=221485", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2000);

  const html = await page.evaluate(() => {
    return document.body.innerHTML;
  });

  fs.writeFileSync("detail_page.html", html);

  console.log("Saved to detail_page.html");
  await browser.close();
})();
