import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const submitPaymentAndActivate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        price: z.number().positive(),
        subType: z.enum(["b2b_block_500", "icon_premium", "contact_block_addon"]),
        receiptUrl: z.string().url().optional(),
        businessId: z.string().uuid().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: paymentId, error } = await supabaseAdmin.rpc("submit_manual_payment", {
      p_plan_id: data.subType,
      p_amount: data.price,
      p_receipt_url: data.receiptUrl ?? null,
      p_business_id: data.businessId ?? null,
    });
    if (error) throw new Error("Không thể tạo yêu cầu thanh toán: " + error.message);
    return { ok: true, paymentId };
  });
