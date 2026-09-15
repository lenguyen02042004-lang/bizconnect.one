import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const submitPaymentAndActivate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        price: z.number(),
        subType: z.string(),
        receiptUrl: z.string().url(),
        businessId: z.string().uuid().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Tạo payments_log (trạng thái pending chờ admin check)
    const { data: payment, error: pErr } = await supabaseAdmin
      .from("payments_log")
      .insert({
        user_id: userId,
        business_id: data.businessId,
        amount: data.price,
        currency: "USD",
        provider: "manual" as any,
        type: data.subType as any,
        status: "pending",
        provider_payment_id: data.receiptUrl,
        receipt_url: data.receiptUrl,
      })
      .select("id")
      .single();

    if (pErr) throw new Error("Không thể tạo log thanh toán: " + pErr.message);

    // 2. NGAY LẬP TỨC CẤP QUYỀN (trải nghiệm nhanh, admin duyệt sau)
    const now = new Date();
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);

    const { error: sErr } = await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      business_id: data.businessId,
      status: "active" as const,
      provider: "manual" as const,
      provider_subscription_id: payment.id,
      sub_type: data.subType,
      current_period_end: end.toISOString(),
    });

    if (sErr) throw new Error("Không thể tạo gói đăng ký: " + sErr.message);

    // 3. KÍCH HOẠT CÁC ĐẶC QUYỀN CỤ THỂ
    if (data.subType === "icon_premium" && data.businessId) {
      // Đổi màu viền và tăng kích thước logo
      await supabaseAdmin
        .from("businesses")
        .update({
          icon_tier: "premium",
          premium_until: new Date(
            now.getFullYear() + 1,
            now.getMonth(),
            now.getDate(),
          ).toISOString(),
        })
        .eq("id", data.businessId);
    } else if (data.subType === "b2b_block_500" && data.businessId) {
      // Cộng ngay 500 lượt nhắn tin B2B
      const year = new Date().getFullYear();
      await (supabaseAdmin as any).from("message_quotas").upsert(
        {
          business_id: data.businessId,
          period_year: year,
          bonus_credits: 500,
        },
        { onConflict: "business_id,period_year", ignoreDuplicates: false },
      );
      // Dùng hàm SQL an toàn để cộng thêm
      await (supabaseAdmin as any).rpc("admin_add_quota_bonus", { _user_id: userId, _amount: 500 });
    } else if (data.subType === "contact_block_addon") {
      // Mở rộng bộ nhớ danh bạ cá nhân +500
      await supabaseAdmin
        .from("wallet_limits")
        .upsert(
          { user_id: userId, blocks_purchased: 1, max_saved_allowed: 700 },
          { onConflict: "user_id", ignoreDuplicates: false },
        );
      await supabaseAdmin.rpc("admin_add_wallet_block", { _user_id: userId });
    }

    return { ok: true, paymentId: payment.id };
  });
