-- Create a secure RPC function for manual payments
-- SECURITY DEFINER allows it to bypass RLS to insert into payments_log and subscriptions.
-- Users can call this function instead of directly inserting, preventing quota abuse.

CREATE OR REPLACE FUNCTION public.submit_manual_payment(
  p_plan_id text,
  p_receipt_url text,
  p_business_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_payment_type public.payment_type;
BEGIN
  -- 1. Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Map p_plan_id to payment_type enum
  IF p_plan_id = 'contact_block_addon' THEN
    v_payment_type := 'extra_quota';
  ELSIF p_plan_id = 'icon_premium' THEN
    v_payment_type := 'icon_premium';
  ELSE
    -- default to membership for b2b_block_500 and others
    v_payment_type := 'membership';
  END IF;

  -- 3. Insert into payments_log
  INSERT INTO public.payments_log (
    user_id,
    business_id,
    amount, -- amount is unused in manual flow, just set 0
    currency,
    type,
    provider,
    status,
    receipt_url
  )
  VALUES (
    v_user_id,
    p_business_id,
    0, 
    'VND',
    v_payment_type,
    'manual',
    'pending',
    p_receipt_url
  );

  -- 4. Instant Grant (Trust First): Insert into subscriptions
  -- Valid for exactly 1 year from now.
  INSERT INTO public.subscriptions (
    user_id,
    business_id,
    provider,
    status,
    sub_type,
    current_period_end
  )
  VALUES (
    v_user_id,
    p_business_id,
    'manual',
    'active',
    p_plan_id,
    now() + interval '1 year'
  );

END;
$$;
