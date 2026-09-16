import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables for the test environment
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env for 360 testing.");
}

// Create a Supabase admin client to bypass RLS and assert DB state
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

test.describe("360-Degree E2E Master Logic Test", () => {
  const timestamp = Date.now();
  const testEmail = `bizmaster${timestamp}@example.com`;
  const testPassword = "Password123!";
  const testBusinessName = `Biz Master Test ${timestamp}`;
  const testPhone = "0987654321";
  
  let businessId: string;
  let ownerId: string;

  // Setup: Use a single browser context to maintain session
  test.describe.configure({ mode: 'serial' });

  test("A. Register Business & Verify Data Rendering + DB Sync", async ({ page }) => {
    // 1. Sign up as Business
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: /Doanh nghiệp|Business/i }).click();

    await page.fill('input[id="name"]', testBusinessName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    
    // Check DB that user and business exist
    const { data: users, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
    if (userErr) throw userErr;
    const user = users.users.find(u => u.email === testEmail);
    expect(user).toBeDefined();
    ownerId = user!.id;

    // 2. Navigate to Edit Profile to trigger business creation
    await page.locator("a", { hasText: /Chỉnh sửa DN|Edit/i }).first().click();
    await expect(page.locator("body")).toContainText(/Tạo danh thiếp|Quản lý/i);
    
    // Fill required name field for the new business
    await page.fill('input[name="name"]', testBusinessName);
    
    // Click Save Draft to insert the business record
    const saveBtn = page.locator("button", { hasText: /Lưu nháp|Save/i }).first();
    await saveBtn.click();
    
    // Wait for auto-redirect after save which appends ?id=...
    await page.waitForURL("**/business/edit?id=*", { timeout: 10000 });

    // A small delay to let DB triggers settle
    let businesses = null;
    for (let i = 0; i < 10; i++) {
      const { data } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (data) {
        businesses = data;
        break;
      }
      await page.waitForTimeout(1000);
    }
      
    expect(businesses).not.toBeNull();
    businessId = businesses!.id;

    // Navigate away to stop any pending React Hook Form auto-saves from overwriting our admin updates
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // We will just directly update DB for deep info to test Rendering logic
    // because interacting with complex 8-step form takes too long and might be brittle
    const { error: updateErr } = await supabaseAdmin.from("businesses").update({
      phone: testPhone,
      short_intro: "360 Degree Testing Intro",
      address: "123 Test St",
      website: "https://example.com",
      status: "public"
    }).eq("id", businessId);
    if (updateErr) throw updateErr;

    // 3. Mark as public
    const { error: updateError } = await supabaseAdmin.from("businesses").update({ status: "public" }).eq("id", businessId);
    expect(updateError).toBeNull();
    expect(businesses).toBeDefined();

    // Verify DB status
    const { data: dbBiz } = await supabaseAdmin.from("businesses").select("*").eq("id", businessId).single();
    console.log("DB BIZ STATUS:", dbBiz?.status, "SLUG:", dbBiz?.slug);

    // 4. Poll until business is visible (handles DB propagation delay)
    await expect(async () => {
      await page.goto(`/business/${businesses!.slug}`);
      await page.waitForLoadState("networkidle");
      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toMatch(/Business not found|Không tìm thấy doanh nghiệp/i);
      expect(bodyText).toContain(testBusinessName);
    }).toPass({ timeout: 15000, intervals: [1000, 2000, 3000] });

    // Assert Strict Render Match
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain(testBusinessName);
    expect(bodyText).toContain("360 Degree Testing Intro");
    expect(bodyText).toContain("123 Test St");
  });

  test("B. Test Billing & Quota Stacking Logic (DB Check)", async ({ page }) => {
    // 1. Initial Quota Check for Wallet (Saved Contacts)
    // We must ensure the wallet limit row exists first since it's lazily created
    await supabaseAdmin.rpc("ensure_wallet_limits", { _user: ownerId });

    let initialWallet = null;
    for (let i = 0; i < 5; i++) {
      const { data } = await supabaseAdmin
        .from("wallet_limits")
        .select("*")
        .eq("user_id", ownerId)
        .maybeSingle();
      if (data) {
        initialWallet = data;
        break;
      }
      await page.waitForTimeout(1000);
    }
    
    expect(initialWallet).not.toBeNull();
    const initialSavedLimit = initialWallet!.max_saved_allowed;
    
    // Initial Quota Check for Messages (Send Card)
    // By default, free tier is 100, and there is no active B2B Premium subscription.
    const { data: initialSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", ownerId)
      .eq("status", "active")
      .eq("sub_type", "b2b_premium");
    
    expect(initialSubs).toHaveLength(0); // No premium subscription initially

    // Create an authenticated client since submit_manual_payment requires auth.uid()
    const authClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!);
    await authClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    // 2. Simulate First Upgrade: B2B Premium (increases message limit)
    const { error: b2bError } = await authClient.rpc("submit_manual_payment", {
      p_plan_id: "b2b_premium",
      p_receipt_url: "https://test.com/receipt1.png",
      p_business_id: businessId
    });
    if (b2bError) throw b2bError;

    // Wait and verify B2B Premium subscription exists
    let hasPremium = false;
    for (let i = 0; i < 10; i++) {
      const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", ownerId)
        .eq("status", "active")
        .eq("sub_type", "b2b_premium");
      
      if (data && data.length > 0) {
        hasPremium = true;
        break;
      }
      await page.waitForTimeout(1000);
    }
    expect(hasPremium).toBeTruthy();

    // 3. Simulate Contact Add-on (increases wallet limit)
    const { error: addonError } = await authClient.rpc("submit_manual_payment", {
      p_plan_id: "contact_block_addon",
      p_receipt_url: "https://test.com/receipt2.png",
      p_business_id: businessId
    });
    if (addonError) throw addonError;

    // Wait and verify Wallet Limit Stacking
    let stackedSavedLimit = 0;
    for (let i = 0; i < 10; i++) {
      const { data } = await supabaseAdmin
        .from("wallet_limits")
        .select("*")
        .eq("user_id", ownerId)
        .maybeSingle();
      if (data && data.max_saved_allowed > initialSavedLimit) {
        stackedSavedLimit = data.max_saved_allowed;
        break;
      }
      await page.waitForTimeout(1000);
    }
    
    // Each contact_block_addon gives +500
    expect(stackedSavedLimit).toBe(initialSavedLimit + 500);
  });

  test("C. Follow & Save Contact Logic on Mobile", async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error("PAGE ERROR:", msg.text());
      }
    });
    page.on('response', async (response) => {
      if (response.url().includes('_server')) {
        try {
          const body = await response.text();
          console.log(`RPC [${response.url()}] ${response.status()}:`, body.substring(0, 200));
        } catch(e) {}
      }
    });

    // 1. Navigate to signup and clear session
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.reload(); // Reload to apply cleared session
    await page.waitForLoadState("networkidle");

    // 2. Create a consumer account and log in
    const consumerEmail = `consumer_${Date.now()}@test.com`;
    
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning" || msg.type() === "log") {
        console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });

    await page.fill('input[id="name"]', "Test Consumer");
    await page.fill('input[id="email"]', consumerEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/me**", { timeout: 15000 });
    
    // Fetch the consumer user ID from DB
    const { data: consumerUsers } = await supabaseAdmin.auth.admin.listUsers();
    const consumerUser = consumerUsers.users.find(u => u.email === consumerEmail);
    expect(consumerUser).toBeDefined();

    // 2. Navigate to Explore and poll until business appears in search (cache/sync delay)
    await expect(async () => {
      await page.goto(`/explore`);
      await page.reload();
      await page.waitForLoadState("networkidle");
      const searchInput = page.locator('aside input').first();
      await searchInput.waitFor({ state: 'visible' });
      await searchInput.fill(testBusinessName);
      // Wait for search debounce
      await page.waitForTimeout(1500);
      // Check that search works via RPC
      const asideText = await page.locator("aside").innerText();
      console.log("ASIDE TEXT AFTER SEARCH:", asideText);
      await expect(page.locator("body")).toContainText(testBusinessName, { timeout: 2000 });
    }).toPass({ timeout: 25000, intervals: [2000, 3000] });
    
    // Click it to go to profile (opens modal)
    await page.locator(`text=${testBusinessName}`).first().click();
    await page.waitForTimeout(1500);
    
    // Get initial follower count from DB
    const { data: bizBefore } = await supabaseAdmin.from("businesses").select("followers_count").eq("id", businessId).single();
    const initialFollowers = bizBefore?.followers_count || 0;

    page.on("console", (msg) => console.log(`BROWSER CONSOLE: ${msg.text()}`));

    // Click Save Contact
    const saveBtn = page.locator("button", { hasText: /Lưu danh bạ|Save/i }).first();
    await saveBtn.click();
    
    // Add a screenshot to see what happened after click
    await page.waitForTimeout(1000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("BODY TEXT AFTER CLICKING SAVE:", bodyText);
    await page.screenshot({ path: "test-results/c-after-save.png" });

    
    // Check DB for Saved Contact (Polled because DB insert takes time)
    await expect(async () => {
      const { data: saved } = await supabaseAdmin
        .from("saved_contacts")
        .select("*")
        .eq("user_id", consumerUser!.id)
        .eq("business_id", businessId);
      expect(saved?.length).toBeGreaterThanOrEqual(1);
    }).toPass({ timeout: 10000, intervals: [1000, 2000] });

    // Click Follow
    const followBtn = page.locator("button", { hasText: /Theo dõi|Follow/i }).first();
    await followBtn.click();

    // Check DB for Follow (Polled)
    await expect(async () => {
      const { data: followed } = await supabaseAdmin
        .from("follows")
        .select("*")
        .eq("follower_id", consumerUser!.id)
        .eq("business_id", businessId);
      expect(followed?.length).toBeGreaterThanOrEqual(1);
    }).toPass({ timeout: 10000, intervals: [1000, 2000] });

    // Check DB: businesses.followers_count
    const { data: bizAfter } = await supabaseAdmin.from("businesses").select("followers_count").eq("id", businessId).single();
    expect(bizAfter?.followers_count).toBe(initialFollowers + 1);
  });
});
