-- 20260916000000_sepay_integration.sql
-- Integrates automated SePay Webhook processing

-- 1. Create table to log incoming SePay transactions to prevent duplicate processing
CREATE TABLE IF NOT EXISTS public.sepay_logs (
    id serial PRIMARY KEY,
    reference_code text UNIQUE NOT NULL,
    amount numeric NOT NULL,
    content text NOT NULL,
    processed_at timestamptz DEFAULT now()
);

-- 2. Grant permissions
GRANT ALL ON public.sepay_logs TO service_role;
-- (No public/authenticated access needed since this is only touched by Edge Functions via Service Role)

-- 3. The main processing function (Trust First)
CREATE OR REPLACE FUNCTION public.process_sepay_payment(
  p_short_user_id text,
  p_short_biz_id text,
  p_plan_id text,
  p_amount numeric,
  p_ref text,
  p_raw_content text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_business_id uuid;
  v_payment_type public.payment_type;
BEGIN
  -- Prevent duplicate processing
  IF EXISTS (SELECT 1 FROM public.sepay_logs WHERE reference_code = p_ref) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duplicate transaction');
  END IF;

  -- 1. Resolve User ID from the 8-character prefix
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE id::text LIKE p_short_user_id || '-%' 
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found for short ID');
  END IF;

  -- 2. Resolve Business ID (Optional) from the 8-character prefix
  IF p_short_biz_id IS NOT NULL AND p_short_biz_id <> '' THEN
    SELECT id INTO v_business_id 
    FROM public.businesses 
    WHERE id::text LIKE p_short_biz_id || '-%' 
    LIMIT 1;
  END IF;

  -- 3. Map Plan to Payment Type
  IF p_plan_id = 'contact_block_addon' THEN
    v_payment_type := 'extra_quota';
  ELSIF p_plan_id = 'icon_premium' THEN
    v_payment_type := 'icon_premium';
  ELSE
    -- default fallback
    v_payment_type := 'membership';
  END IF;

  -- 4. Insert into payments_log
  INSERT INTO public.payments_log (
    user_id,
    business_id,
    amount,
    currency,
    type,
    provider,
    status,
    receipt_url
  )
  VALUES (
    v_user_id,
    v_business_id,
    p_amount,
    'VND',
    v_payment_type,
    'sepay',
    'completed',
    p_ref -- Storing the SePay reference code as the "receipt"
  );

  -- 5. Instant Grant: Insert into subscriptions
  -- For block systems (contact_block_addon, b2b_block_500), multiple purchases = multiple rows.
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
    v_business_id,
    'sepay',
    'active',
    p_plan_id,
    now() + interval '1 year'
  );

  -- 6. Special logic for icon_premium: instantly update the business record
  IF p_plan_id = 'icon_premium' AND v_business_id IS NOT NULL THEN
    UPDATE public.businesses
    SET icon_tier = 'premium'
    WHERE id = v_business_id;
  END IF;

  -- 7. Mark as processed
  INSERT INTO public.sepay_logs (reference_code, amount, content)
  VALUES (p_ref, p_amount, p_raw_content);

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'business_id', v_business_id);
END;
$$;
