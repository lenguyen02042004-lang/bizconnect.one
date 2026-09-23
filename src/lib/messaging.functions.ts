import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Permissive UUID format (any 8-4-4-4-12 hex). Postgres accepts these; Zod's
// built-in .uuid() rejects v0/nil-style ids which our demo seed uses.
const uuidLike = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid id");

export const sendCardVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        from_business: uuidLike.optional(),
        to_business: uuidLike.optional(),
        from_user: uuidLike.optional(),
        to_user: uuidLike.optional(),
        subject: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(2000),
      })
      .refine((data) => data.from_business || data.from_user, { message: "Phải chọn người gửi" })
      .refine((data) => data.to_business || data.to_user, { message: "Phải chọn người nhận" })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: msgId, error } = await supabase.rpc("send_card_visit", {
      _from_business: data.from_business || undefined,
      _to_business: data.to_business || undefined,
      _from_user: data.from_user || undefined,
      _to_user: data.to_user || undefined,
      _subject: data.subject,
      _body: data.body,
    });
    if (error) throw new Error(error.message);
    return { id: msgId };
  });

export const getInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ business_id: uuidLike.optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // We fetch all messages the user has access to (personal + all their businesses)
    // The RLS policy guarantees we only see our own messages.
    const { data: messages, error } = await supabase
      .from("connect_messages")
      .select(
        "id, subject, body, created_at, read_at, from_business_id, to_business_id, from_user_id, to_user_id",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const bIds = Array.from(
      new Set(
        messages
          ?.flatMap((m) => [m.from_business_id, m.to_business_id])
          .filter(Boolean) as string[],
      ),
    );
    const uIds = Array.from(
      new Set(messages?.flatMap((m) => [m.from_user_id, m.to_user_id]).filter(Boolean) as string[]),
    );

    const { data: bizes } = bIds.length
      ? await supabase
          .from("businesses")
          .select(
            "id, name, logo_url, slug, phone, email, website, address, province, country_code",
          )
          .in("id", bIds)
      : { data: [] };

    const { data: users } = uIds.length
      ? await supabase
          .from("personal_profiles")
          .select("id, user_id, full_name, avatar_url, slug, job_title, company_name")
          .in("user_id", uIds)
      : { data: [] };

    const bMap = new Map((bizes ?? []).map((b) => [b.id, b]));
    const uMap = new Map((users ?? []).map((u) => [u.user_id, u]));

    return {
      messages: (messages ?? []).map((m) => ({
        ...m,
        from_business: m.from_business_id ? bMap.get(m.from_business_id) : null,
        to_business: m.to_business_id ? bMap.get(m.to_business_id) : null,
        from_user: m.from_user_id ? uMap.get(m.from_user_id) : null,
        to_user: m.to_user_id ? uMap.get(m.to_user_id) : null,
      })),
    };
  });

export const markMessageRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: uuidLike }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("connect_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // We always calculate manually in TS to avoid outdated RPC definitions on the server
    const year = new Date().getFullYear();
    const { data: row } = await context.supabase
      .from("message_quotas")
      .select("used_count, bonus_credits")
      .eq("period_year", year)
      .maybeSingle();

    // Only B2B blocks increase the send-card quota. Contact blocks belong to the saved-contact wallet.
    const { data: subs } = await context.supabase
      .from("subscriptions")
      .select("status, sub_type, current_period_end")
      .eq("user_id", context.userId)
      .eq("status", "active")
      .eq("sub_type", "b2b_block_500");

    let activeBlocks = 0;
    if (subs) {
      for (const sub of subs) {
        if (!sub.current_period_end || new Date(sub.current_period_end) > new Date()) {
          activeBlocks++;
        }
      }
    }

    const base = 200;
    const used = row?.used_count ?? 0;
    const bonus = row?.bonus_credits ?? 0;
    const limit = base + activeBlocks * 500;
    return { used_count: used, bonus_credits: bonus, limit };
  });

export const getMyBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("businesses")
      .select("id, name, slug, logo_url, status, icon_tier")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { businesses: data ?? [] };
  });

export const getBusinessStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ business_id: uuidLike }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const businessId = data.business_id;

    // Verify ownership
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, slug, logo_url, views_count, followers_count, owner_id")
      .eq("id", businessId)
      .single();
    if (bizErr || !biz || biz.owner_id !== context.userId) {
      throw new Error("Not authorized");
    }

    const [{ count: sentCount }, { count: receivedCount }, { count: unreadCount }] =
      await Promise.all([
        supabase
          .from("connect_messages")
          .select("*", { count: "exact", head: true })
          .eq("from_business_id", businessId),
        supabase
          .from("connect_messages")
          .select("*", { count: "exact", head: true })
          .eq("to_business_id", businessId),
        supabase
          .from("connect_messages")
          .select("*", { count: "exact", head: true })
          .eq("to_business_id", businessId)
          .is("read_at", null),
      ]);

    // Recent history (last 50 connections, both directions)
    const { data: history } = await supabase
      .from("connect_messages")
      .select("id, subject, created_at, read_at, from_business_id, to_business_id")
      .or(`from_business_id.eq.${businessId},to_business_id.eq.${businessId}`)
      .order("created_at", { ascending: false })
      .limit(50);

    const partnerIds = Array.from(
      new Set(
        (history ?? [])
          .map((m) => (m.from_business_id === businessId ? m.to_business_id : m.from_business_id))
          .filter((id): id is string => id !== null),
      ),
    );
    const { data: partners } = partnerIds.length
      ? await supabase.from("businesses").select("id, name, slug, logo_url").in("id", partnerIds)
      : { data: [] as Array<{ id: string; name: string; slug: string; logo_url: string | null }> };
    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]));

    // Aggregate by day for last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const { data: recent } = await supabase
      .from("connect_messages")
      .select("created_at, from_business_id")
      .or(`from_business_id.eq.${businessId},to_business_id.eq.${businessId}`)
      .gte("created_at", since.toISOString());

    const byDay: Record<string, { sent: number; received: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      byDay[d.toISOString().slice(0, 10)] = { sent: 0, received: 0 };
    }
    for (const m of recent ?? []) {
      const key = m.created_at.slice(0, 10);
      if (!byDay[key]) continue;
      if (m.from_business_id === businessId) byDay[key].sent++;
      else byDay[key].received++;
    }
    const timeline = Object.entries(byDay).map(([date, v]) => ({ date, ...v }));

    return {
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        logo_url: biz.logo_url,
        views_count: biz.views_count,
        followers_count: biz.followers_count,
      },
      counts: {
        sent: sentCount ?? 0,
        received: receivedCount ?? 0,
        unread: unreadCount ?? 0,
      },
      timeline,
      history: (history ?? []).map((m) => {
        const isOutgoing = m.from_business_id === businessId;
        const partnerId = isOutgoing ? m.to_business_id : m.from_business_id;
        return {
          id: m.id,
          subject: m.subject,
          created_at: m.created_at,
          read_at: m.read_at,
          direction: isOutgoing ? ("out" as const) : ("in" as const),
          partner: partnerId ? (partnerMap.get(partnerId) ?? null) : null,
        };
      }),
    };
  });
