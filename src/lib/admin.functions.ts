import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function generateStrongPassword(length = 20): string {
  // URL-safe random string, mixed case + digits, no ambiguous chars
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  // Guarantee complexity requirements
  return `${out}!A9`;
}



const BizRow = z.object({
  owner_email: z.string().email(),
  owner_password: z.string().min(8).max(72).optional().nullable(),
  owner_display_name: z.string().max(120).optional().nullable(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  short_intro: z.string().max(500).optional().default(""),
  address: z.string().max(500).optional().default(""),
  country_code: z.string().length(2).optional().nullable(),
  province: z.string().max(120).optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  industry_slug: z.string().optional().nullable(),
  status: z.enum(["draft", "public"]).optional().default("draft"),
  icon_tier: z.enum(["standard", "premium"]).optional().default("standard"),
});

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}

// No shared default password — every account gets a unique random password.

export const bulkImportBusinesses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      rows: z.array(z.record(z.string(), z.any())).max(2000),
      create_missing_owners: z.boolean().optional().default(true),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load industry map
    const { data: industries } = await supabaseAdmin.from("industries").select("id, slug");
    const indMap = new Map((industries ?? []).map((i: any) => [i.slug, i.id]));

    // Cache existing users by email (single fetch)
    const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const userByEmail = new Map<string, string>(
      (listed?.users ?? []).map((u) => [(u.email ?? "").toLowerCase(), u.id]),
    );

    const results = {
      ok: 0,
      created_users: 0,
      failed: [] as { row: number; error: string; slug?: string }[],
      credentials: [] as { row: number; email: string; password: string; slug: string; created: boolean }[],
    };

    for (let i = 0; i < data.rows.length; i++) {
      try {
        const parsed = BizRow.parse(data.rows[i]);
        const emailKey = parsed.owner_email.toLowerCase();
        let ownerId = userByEmail.get(emailKey);
        let createdNow = false;
        const password = parsed.owner_password || generateStrongPassword();

        if (!ownerId) {
          if (!data.create_missing_owners) {
            throw new Error(`No user with email ${parsed.owner_email}`);
          }
          const { data: newUser, error: cErr } = await supabaseAdmin.auth.admin.createUser({
            email: parsed.owner_email,
            password,
            email_confirm: true,
            user_metadata: {
              display_name: parsed.owner_display_name ?? parsed.name,
              bulk_import: true,
            },
          });
          if (cErr || !newUser?.user) throw cErr ?? new Error("Không tạo được tài khoản chủ sở hữu");
          ownerId = newUser.user.id;
          userByEmail.set(emailKey, ownerId);
          createdNow = true;
          results.created_users++;
        }

        const industry_id = parsed.industry_slug ? indMap.get(parsed.industry_slug) ?? null : null;
        const { error } = await supabaseAdmin.from("businesses").upsert({
          owner_id: ownerId,
          name: parsed.name,
          slug: parsed.slug,
          short_intro: parsed.short_intro,
          address: parsed.address,
          country_code: parsed.country_code,
          province: parsed.province,
          lat: parsed.lat,
          lng: parsed.lng,
          phone: parsed.phone,
          email: parsed.email,
          website: parsed.website,
          logo_url: parsed.logo_url,
          banner_url: parsed.banner_url,
          industry_id,
          status: parsed.status,
          icon_tier: parsed.icon_tier,
        }, { onConflict: "slug" });
        if (error) throw error;
        results.ok++;
        results.credentials.push({
          row: i + 1,
          email: parsed.owner_email,
          password: createdNow ? password : "(đã tồn tại)",
          slug: parsed.slug,
          created: createdNow,
        });
      } catch (e: any) {
        results.failed.push({ row: i + 2, error: e.message ?? String(e), slug: data.rows[i]?.slug });
      }
    }
    return results;
  });


export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    return { isAdmin: !!data };
  });

// === List ALL businesses for admin management ===
export const adminListBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug, status, owner_id, country_code, views_count, followers_count, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    // Resolve owner emails
    const ownerIds = Array.from(new Set((data ?? []).map((b) => b.owner_id)));
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    return {
      businesses: (data ?? []).map((b) => ({ ...b, owner_email: (b.owner_id ? emailMap.get(b.owner_id) : "") ?? "" })),
    };
  });

// === Seed demo accounts: create 1 auth user per demo business and reassign owner ===
// Demo businesses are identified by slug prefix in DEMO_SLUGS.
const DEMO_SLUGS = [
  "nova-tech-vn", "sakura-trading", "lion-finance-sg", "stellar-design-nyc",
  "alpine-luxury-ch", "thames-legal", "kanga-build-au", "samba-coffee-br",
  "desert-pearl-ae", "kimchi-fashion-kr",
];

export const seedDemoAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const results: { slug: string; email: string; password: string; created: boolean; ok: boolean; error?: string }[] = [];

    // Cache existing users
    const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingByEmail = new Map((listed?.users ?? []).map((u) => [u.email?.toLowerCase() ?? "", u.id]));

    for (const slug of DEMO_SLUGS) {
      const email = `${slug}@demo.bizconnect.test`;
      // Every run generates a fresh unique password — never a shared constant.
      const password = generateStrongPassword();
      try {
        let uid = existingByEmail.get(email);
        let created = false;
        if (!uid) {
          const { data: newUser, error: cErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { display_name: `Demo · ${slug}`, demo_owner_for: slug },
          });
          if (cErr || !newUser?.user) throw cErr ?? new Error("createUser failed");
          uid = newUser.user.id;
          created = true;
        } else {
          // Rotate password on existing demo account so previously hardcoded credentials no longer work.
          const { error: pErr } = await supabaseAdmin.auth.admin.updateUserById(uid, { password });
          if (pErr) throw pErr;
        }
        // Reassign business owner
        const { error: uErr } = await supabaseAdmin
          .from("businesses").update({ owner_id: uid }).eq("slug", slug);
        if (uErr) throw uErr;
        results.push({ slug, email, password, created, ok: true });
      } catch (e: any) {
        results.push({ slug, email, password: "", created: false, ok: false, error: e.message ?? String(e) });
      }
    }
    return { results };
  });


// === Reset password for any user (admin only) ===
export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid(), new_password: z.string().min(8).max(72) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password: data.new_password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// === List pending manual payments (admin only) ===
export const adminListPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { data, error } = await supabase
      .from("payments_log")
      .select("*, businesses(name, slug, owner_id)")
      .eq("provider", "manual")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { payments: data ?? [] };
  });

// === Update manual payment status (admin only) ===
export const adminUpdatePaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    payment_id: z.string().uuid(),
    status: z.enum(["verified", "rejected"]),
    business_id: z.string().uuid().optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch full payment row
    const { data: payment, error: pErr } = await supabaseAdmin
      .from("payments_log")
      .select("*, businesses(owner_id)")
      .eq("id", data.payment_id)
      .single();
    if (pErr || !payment) throw new Error(pErr?.message ?? "Payment not found");

    // Update payment status
    const { error } = await supabaseAdmin
      .from("payments_log")
      .update({ status: data.status })
      .eq("id", data.payment_id);
    if (error) throw new Error(error.message);

    const ownerId: string | null = payment.user_id ?? (payment.businesses as any)?.owner_id ?? null;
    const bizId: string | null = data.business_id ?? payment.business_id ?? null;
    
    // Map payment_log type back to exact subscription plan ID
    const paymentLogType = payment.type;
    let subType = "b2b_block_500"; // default fallback
    if (paymentLogType === "membership") subType = "b2b_block_500";
    else if (paymentLogType === "icon_premium") subType = "icon_premium";
    else if (paymentLogType === "extra_quota") subType = "contact_block_addon"; 

    if (data.status === "verified" && ownerId) {
      const now = new Date();

      if (subType === "b2b_block_500" || subType === "icon_premium") {
        // Trải nghiệm nhanh đã được cấp trong bảng subscriptions ở frontend.
        // Ở đây admin duyệt chỉ mang tính chất ghi nhận hoặc cập nhật thêm icon_tier.
        
        // For icon_premium: also update icon_tier on the business
        if (subType === "icon_premium" && bizId) {
          await supabaseAdmin
            .from("businesses")
            .update({ icon_tier: "premium", premium_until: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString() })
            .eq("id", bizId);
        }
      }
      // Note: Nếu là contact_block_addon, subscription cũng đã được tạo ở frontend nên wallet_limits tự động tăng thông qua logic tính tổng active blocks!
      // Không cần phải upsert wallet_limits thủ công ở đây nữa, vì get_my_wallet_limits quét bảng subscriptions.
    }

    if (data.status === "rejected" && bizId) {
      // Revoke icon premium if that's what was rejected
      if (subType === "icon_premium") {
        await supabaseAdmin
          .from("businesses")
          .update({ premium_until: null, icon_tier: "standard" })
          .eq("id", bizId);
      }
      
      // Deactivate matching pending subscriptions
      const { data: latestSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("business_id", bizId)
        .eq("sub_type", subType)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSub) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" as const })
          .eq("id", latestSub.id);
      }
    } else if (data.status === "rejected" && ownerId) {
      // Revert the instantly granted subscription block (Personal or Business via Owner)
      const { data: latestSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", ownerId)
        .eq("sub_type", subType)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSub) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" as const })
          .eq("id", latestSub.id);
      }
    }

    return { ok: true };
  });

// === Admin: list all subscriptions ===
export const adminListSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*, businesses(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    // Resolve user emails
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map((users?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));

    return {
      subscriptions: (data ?? []).map((s: any) => ({
        ...s,
        owner_email: emailMap.get(s.user_id) ?? "",
      })),
    };
  });

// === Admin: manually grant a subscription ===
export const adminGrantSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    business_id: z.string().uuid().optional().nullable(),
    sub_type: z.enum(["b2b_premium", "icon_premium", "contact_block_addon"]),
    months: z.number().int().min(1).max(120).default(12),
    notes: z.string().max(500).optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + data.months);

    const { error } = await supabaseAdmin.from("subscriptions").insert({
      user_id: data.user_id,
      business_id: data.business_id ?? null,
      status: "active" as const,
      sub_type: data.sub_type,
      provider: "manual" as const,
      current_period_end: periodEnd.toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// === User: get own subscription status ===
export const getMySubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, sub_type, status, current_period_start, current_period_end, business_id, businesses(name, slug)")
      .eq("user_id", userId)
      .order("current_period_end", { ascending: false });

    const { data: wallet } = await supabase
      .rpc("my_wallet_limits");

    return {
      subscriptions: ((subs ?? []) as unknown) as Array<{
        id: string;
        sub_type: string;
        status: string;
        current_period_start: string | null;
        current_period_end: string | null;
        business_id: string | null;
        businesses: { name: string; slug: string } | null;
      }>,
      wallet: wallet as { max_saved_allowed: number; current_saved_count: number; blocks_purchased: number } | null,
    };
  });
