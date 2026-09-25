// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

declare const Deno: { env: { get(name: string): string | undefined } };

type SePayPayload = {
  id: number;
  accountNumber?: string;
  content: string;
  transferType: "in" | "out";
  transferAmount: number;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function equalStrings(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function verifyRequest(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get("SEPAY_WEBHOOK_SECRET") ?? Deno.env.get("SEPAY_SECRET");
  const apiKey = Deno.env.get("SEPAY_API_KEY");
  const authorization = req.headers.get("authorization") ?? "";

  if (apiKey) return equalStrings(authorization, `Apikey ${apiKey}`);
  if (!secret) return false;

  const timestamp = Number(req.headers.get("x-sepay-timestamp"));
  const signature = req.headers.get("x-sepay-signature") ?? "";
  if (!Number.isInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) {
    return false;
  }

  const expected = `sha256=${await hmacHex(secret, `${timestamp}.${rawBody}`)}`;
  return equalStrings(signature, expected);
}

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const rawBody = await req.text();
  if (!(await verifyRequest(req, rawBody)))
    return json({ success: false, error: "Unauthorized" }, 401);

  try {
    const payload = JSON.parse(rawBody) as Partial<SePayPayload>;
    if (
      !Number.isInteger(payload.id) ||
      typeof payload.content !== "string" ||
      payload.transferType !== "in" ||
      typeof payload.transferAmount !== "number" ||
      payload.transferAmount <= 0
    ) {
      return json({ success: false, error: "Invalid payload" }, 400);
    }

    const content = payload.content.toUpperCase();
    const match = content.match(/\b([A-Z0-9]{6})\b/);
    if (!match) return json({ success: true });

    const orderCode = match[1];

    const configuredAccount = Deno.env.get("SEPAY_ACCOUNT_NUMBER");
    if (configuredAccount && payload.accountNumber !== configuredAccount) {
      return json({ success: false, error: "Unexpected account" }, 400);
    }

    const { error } = await supabase.rpc("process_payment_by_order_code", {
      p_order_code: orderCode,
      p_amount: payload.transferAmount,
      p_ref: String(payload.id),
      p_raw_content: rawBody,
    });

    if (error) {
      console.error("SePay payment processing failed:", error.message);
      return json({ success: false, error: "Payment could not be processed" }, 422);
    }

    return json({ success: true });
  } catch (error) {
    console.error("SePay webhook error:", error);
    return json({ success: false, error: "Invalid request" }, 400);
  }
});
