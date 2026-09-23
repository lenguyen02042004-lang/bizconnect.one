import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "../../src/integrations/supabase/types";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
  throw new Error("Missing Supabase credentials for messaging E2E test.");
}

const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = "Password123!";

test.describe("Messaging delivery and quota", () => {
  let senderId = "";
  let receiverId = "";
  let senderEmail = "";
  let receiverEmail = "";
  let receiverBusinessId = "";
  let receiverBusinessSlug = "";
  let receiverPersonalSlug = "";
  let senderClient: SupabaseClient<Database>;
  let initialQuota = 0;

  test.beforeAll(async () => {
    const suffix = Date.now();
    senderEmail = `e2e_sender_${suffix}@example.com`;
    receiverEmail = `e2e_receiver_${suffix}@example.com`;

    const { data: sender, error: senderError } = await admin.auth.admin.createUser({
      email: senderEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: `E2E Sender ${suffix}`, account_type: "personal" },
    });
    if (senderError || !sender.user) throw senderError ?? new Error("Could not create sender");
    senderId = sender.user.id;

    const { data: receiver, error: receiverError } = await admin.auth.admin.createUser({
      email: receiverEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: `E2E Receiver ${suffix}`, account_type: "business" },
    });
    if (receiverError || !receiver.user)
      throw receiverError ?? new Error("Could not create receiver");
    receiverId = receiver.user.id;

    receiverPersonalSlug = `e2e-receiver-${suffix}`;
    const { error: personalError } = await admin.from("personal_profiles").insert({
      user_id: receiverId,
      slug: receiverPersonalSlug,
      full_name: `E2E Receiver ${suffix}`,
      email: receiverEmail,
      is_public: true,
    });
    if (personalError) throw personalError;

    receiverBusinessSlug = `e2e-business-${suffix}`;
    const { data: business, error: businessError } = await admin
      .from("businesses")
      .insert({
        owner_id: receiverId,
        name: `E2E Receiver Business ${suffix}`,
        slug: receiverBusinessSlug,
        short_intro: "Messaging E2E recipient",
        status: "public",
      })
      .select("id")
      .single();
    if (businessError || !business) throw businessError ?? new Error("Could not create business");
    receiverBusinessId = business.id;

    senderClient = createClient<Database>(supabaseUrl!, publishableKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: session, error: loginError } = await senderClient.auth.signInWithPassword({
      email: senderEmail,
      password,
    });
    if (loginError || !session.user) throw loginError ?? new Error("Could not sign in sender");

    const { data: quota } = await admin
      .from("message_quotas")
      .select("used_count")
      .eq("user_id", senderId)
      .eq("period_year", new Date().getFullYear())
      .maybeSingle();
    initialQuota = quota?.used_count ?? 0;
  });

  test.afterAll(async () => {
    if (receiverBusinessId) await admin.from("businesses").delete().eq("id", receiverBusinessId);
    if (senderId) await admin.auth.admin.deleteUser(senderId);
    if (receiverId) await admin.auth.admin.deleteUser(receiverId);
  });

  test("delivers business and personal card messages to the receiver inbox", async ({ browser }) => {
    const senderContext = await browser.newContext();
    const senderPage = await senderContext.newPage();

    await senderPage.goto("/login");
    await senderPage.getByLabel("Email").fill(senderEmail);
    await senderPage.getByLabel("Mật khẩu").fill(password);
    await senderPage.getByRole("button", { name: /Đăng nhập|Sign in/i }).click();
    await senderPage.waitForURL("**/dashboard");

    await senderPage.goto(`/business/${receiverBusinessSlug}`);
    await expect(senderPage.getByRole("button", { name: /Gửi card|Send Card/i })).toBeVisible();
    await senderPage.getByRole("button", { name: /Gửi card|Send Card/i }).click();
    const sendDialog = senderPage.getByRole("heading", { name: "Gửi danh thiếp đến" }).locator("..");
    await sendDialog.locator("input").first().fill("Business message E2E");
    await sendDialog.locator("textarea").fill("Business card delivery check");
    await senderPage.getByRole("button", { name: "Gửi danh thiếp" }).click();
    await expect(senderPage.getByText("Đã gửi danh thiếp thành công!")).toBeVisible();

    await senderPage.goto(`/p/${receiverPersonalSlug}`);
    await senderPage.getByRole("button", { name: /Gửi card|Send Card/i }).click();
    const personalSendDialog = senderPage
      .getByRole("heading", { name: "Gửi danh thiếp đến" })
      .locator("..");
    await personalSendDialog.locator("input").first().fill("Personal message E2E");
    await personalSendDialog.locator("textarea").fill("Personal card delivery check");
    await senderPage.getByRole("button", { name: "Gửi danh thiếp" }).click();
    await expect(senderPage.getByText("Đã gửi danh thiếp thành công!")).toBeVisible();
    await senderContext.close();

    const receiverContext = await browser.newContext();
    const receiverPage = await receiverContext.newPage();
    await receiverPage.goto("/login");
    await receiverPage.getByLabel("Email").fill(receiverEmail);
    await receiverPage.getByLabel("Mật khẩu").fill(password);
    await receiverPage.getByRole("button", { name: /Đăng nhập|Sign in/i }).click();
    await receiverPage.waitForURL("**/dashboard");
    await receiverPage.goto("/inbox");
    await expect(receiverPage.getByText("Business message E2E")).toBeVisible();
    await expect(receiverPage.getByText("Personal message E2E")).toBeVisible();
    await expect(receiverPage.getByText("Business card delivery check")).toBeVisible();
    await expect(receiverPage.getByText("Personal card delivery check")).toBeVisible();

    const { data: quota } = await admin
      .from("message_quotas")
      .select("used_count")
      .eq("user_id", senderId)
      .eq("period_year", new Date().getFullYear())
      .single();
    expect(quota?.used_count).toBe(initialQuota + 2);
    await receiverContext.close();
  });
});
