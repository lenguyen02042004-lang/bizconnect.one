// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Optional: SEPAY_API_KEY if we want to verify webhook signature, but here we just process.
// Ideally, check some auth headers if configured in SePay.

const supabase = createClient(supabaseUrl, supabaseServiceRole);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    
    // SePay Webhook payload format
    // { gateway: "TPBank", transferAmount: 150000, referenceCode: "MB...123", content: "BIZC b2b_block_500 ...", ... }
    const content = (payload.content || "").toUpperCase();
    const amount = payload.transferAmount || 0;
    const ref = payload.referenceCode;

    if (!ref) {
      return new Response(JSON.stringify({ error: "No reference code" }), { status: 400 });
    }

    // Parse BIZC {PLAN_ID} {USER_SHORT_ID} [BIZ_SHORT_ID]
    // Example 1: BIZC MEMBERSHIP 550E8400
    // Example 2: BIZC ICON_PREMIUM 550E8400 AABBCCDD
    // Example 3: BIZC B2B_BLOCK_500 550E8400
    
    // We strictly match 8 characters for user ID and optional 8 characters for biz ID.
    const match = content.match(/BIZC\s+([A-Z0-9_]+)\s+([A-Z0-9]{8})(?:\s+([A-Z0-9]{8})\b)?/i);
    
    if (!match) {
      console.log("Ignoring non-bizconnect transfer:", content);
      return new Response(JSON.stringify({ success: true, ignored: true, reason: "Not a BIZC transaction" }), { status: 200 });
    }

    let planId = match[1].toLowerCase(); // e.g. b2b_block_500
    
    // Fix missing underscores caused by some banks stripping them
    if (planId === "b2bblock500") planId = "b2b_block_500";
    if (planId === "contactblockaddon") planId = "contact_block_addon";
    if (planId === "iconpremium") planId = "icon_premium";

    const shortUserId = match[2].toLowerCase(); // 8 chars
    const shortBizId = match[3] ? match[3].toLowerCase() : null; // 8 chars

    console.log(`Processing SePay: Plan=${planId}, User=${shortUserId}, Biz=${shortBizId}, Ref=${ref}, Amount=${amount}`);

    // Optionally check if amount is sufficient (e.g. >= 150000)
    // Could vary by plan. Assuming all plans are 150000 currently.
    if (amount < 150000) {
      console.log("Amount too low:", amount);
      return new Response(JSON.stringify({ success: true, ignored: true, reason: "amount < 150000" }), { status: 200 });
    }

    // Call RPC
    const { data, error } = await supabase.rpc("process_sepay_payment", {
      p_short_user_id: shortUserId,
      p_short_biz_id: shortBizId,
      p_plan_id: planId,
      p_amount: amount,
      p_ref: ref,
      p_raw_content: content
    });

    if (error) {
      console.error("RPC Error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log("Success:", data);
    return new Response(JSON.stringify({ success: true, result: data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
