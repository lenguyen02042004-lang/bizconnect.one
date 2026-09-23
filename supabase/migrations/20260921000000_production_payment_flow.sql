-- Production payment flow: manual submissions remain pending until SePay confirms them.

DROP FUNCTION IF EXISTS public.submit_manual_payment(text, text, uuid);

CREATE OR REPLACE FUNCTION public.submit_manual_payment(
  p_plan_id text,
  p_amount numeric,
  p_receipt_url text DEFAULT NULL,
  p_business_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_payment_type public.payment_type;
  v_payment_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_plan_id NOT IN ('b2b_block_500', 'icon_premium', 'contact_block_addon') THEN
    RAISE EXCEPTION 'Unsupported payment plan';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;

  IF p_plan_id IN ('b2b_block_500', 'icon_premium') THEN
    IF p_business_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = p_business_id AND owner_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Business does not belong to the authenticated user';
    END IF;
  END IF;

  IF p_plan_id = 'contact_block_addon' THEN
    v_payment_type := 'extra_quota';
  ELSIF p_plan_id = 'icon_premium' THEN
    v_payment_type := 'icon_premium';
  ELSE
    v_payment_type := 'membership';
  END IF;

  INSERT INTO public.payments_log (
    user_id, business_id, amount, currency, type, provider, status, receipt_url
  )
  VALUES (
    v_user_id, p_business_id, p_amount, 'VND', v_payment_type, 'manual', 'pending',
    NULLIF(p_receipt_url, '')
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_manual_payment(text, numeric, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_manual_payment(text, numeric, text, uuid) TO authenticated;

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
  v_log_id integer;
  v_payment_id uuid;
BEGIN
  IF p_plan_id NOT IN ('b2b_block_500', 'icon_premium', 'contact_block_addon') THEN
    RAISE EXCEPTION 'Unsupported payment plan';
  END IF;

  IF p_amount <> 150000 THEN
    RAISE EXCEPTION 'Invalid payment amount';
  END IF;

  INSERT INTO public.sepay_logs (reference_code, amount, content)
  VALUES (p_ref, p_amount, p_raw_content)
  ON CONFLICT (reference_code) DO NOTHING
  RETURNING id INTO v_log_id;

  IF v_log_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(id::text) LIKE lower(p_short_user_id) || '-%'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for payment code';
  END IF;

  IF p_short_biz_id IS NOT NULL AND p_short_biz_id <> '' THEN
    SELECT id INTO v_business_id
    FROM public.businesses
    WHERE lower(id::text) LIKE lower(p_short_biz_id) || '-%'
      AND owner_id = v_user_id
    LIMIT 1;
  END IF;

  IF p_plan_id IN ('b2b_block_500', 'icon_premium') AND v_business_id IS NULL THEN
    RAISE EXCEPTION 'Business not found for payment code';
  END IF;

  IF p_plan_id = 'contact_block_addon' THEN
    v_payment_type := 'extra_quota';
  ELSIF p_plan_id = 'icon_premium' THEN
    v_payment_type := 'icon_premium';
  ELSE
    v_payment_type := 'membership';
  END IF;

  SELECT id INTO v_payment_id
  FROM public.payments_log
  WHERE user_id = v_user_id
    AND (business_id = v_business_id OR (business_id IS NULL AND v_business_id IS NULL))
    AND amount = p_amount
    AND status = 'pending'
    AND type = v_payment_type
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_payment_id IS NULL THEN
    INSERT INTO public.payments_log (
      user_id, business_id, amount, currency, type, provider, provider_payment_id, status, receipt_url
    )
    VALUES (
      v_user_id, v_business_id, p_amount, 'VND', v_payment_type, 'sepay', p_ref, 'completed', p_ref
    )
    RETURNING id INTO v_payment_id;
  ELSE
    UPDATE public.payments_log
    SET provider = 'sepay', provider_payment_id = p_ref, status = 'completed', currency = 'VND'
    WHERE id = v_payment_id;
  END IF;

  INSERT INTO public.subscriptions (
    user_id, business_id, provider, provider_subscription_id, status, sub_type, current_period_end
  )
  VALUES (
    v_user_id, v_business_id, 'sepay', v_payment_id::text, 'active', p_plan_id, now() + interval '1 year'
  );

  IF p_plan_id = 'icon_premium' THEN
    UPDATE public.businesses
    SET icon_tier = 'premium', premium_until = now() + interval '1 year'
    WHERE id = v_business_id;
  ELSIF p_plan_id = 'b2b_block_500' THEN
    PERFORM public.admin_add_quota_bonus(v_business_id, 500);
  ELSIF p_plan_id = 'contact_block_addon' THEN
    PERFORM public.admin_add_wallet_block(v_user_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_sepay_payment(text, text, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_sepay_payment(text, text, text, numeric, text, text) TO service_role;
