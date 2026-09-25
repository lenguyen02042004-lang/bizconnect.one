-- Process SePay payment using the 6-character order code
DROP FUNCTION IF EXISTS public.process_payment_by_order_code(text, numeric, text, text);
CREATE OR REPLACE FUNCTION public.process_payment_by_order_code(
  p_order_code text,
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
  v_order record;
  v_payment_type public.payment_type;
  v_log_id integer;
  v_payment_id uuid;
BEGIN
  -- Insert into sepay logs to prevent duplicates
  INSERT INTO public.sepay_logs (reference_code, amount, content)
  VALUES (p_ref, p_amount, p_raw_content)
  ON CONFLICT (reference_code) DO NOTHING
  RETURNING id INTO v_log_id;

  IF v_log_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  -- Look up the payment order
  SELECT * INTO v_order
  FROM public.payment_orders
  WHERE order_code = p_order_code AND status = 'pending';

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Pending order not found for the given code';
  END IF;

  IF p_amount <> v_order.amount THEN
    RAISE EXCEPTION 'Invalid payment amount';
  END IF;

  IF v_order.plan_id NOT IN ('b2b_block_500', 'icon_premium', 'contact_block_addon', 'b2b_premium') THEN
    RAISE EXCEPTION 'Unsupported payment plan';
  END IF;

  IF v_order.plan_id = 'contact_block_addon' THEN
    v_payment_type := 'extra_quota';
  ELSIF v_order.plan_id = 'icon_premium' THEN
    v_payment_type := 'icon_premium';
  ELSIF v_order.plan_id = 'b2b_premium' THEN
    v_payment_type := 'membership';
  ELSE
    v_payment_type := 'membership';
  END IF;

  -- Try to find an existing pending payment_log created by the old manual flow
  SELECT id INTO v_payment_id
  FROM public.payments_log
  WHERE user_id = v_order.user_id
    AND (business_id = v_order.business_id OR (business_id IS NULL AND v_order.business_id IS NULL))
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
      v_order.user_id, v_order.business_id, p_amount, 'VND', v_payment_type, 'sepay', p_ref, 'completed', p_ref
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
    v_order.user_id, v_order.business_id, 'sepay', v_payment_id::text, 'active', v_order.plan_id, now() + interval '1 year'
  );

  IF v_order.plan_id = 'icon_premium' THEN
    UPDATE public.businesses
    SET icon_tier = 'premium', premium_until = now() + interval '1 year'
    WHERE id = v_order.business_id;
  ELSIF v_order.plan_id = 'b2b_premium' THEN
    UPDATE public.businesses
    SET premium_until = now() + interval '1 year'
    WHERE id = v_order.business_id;
  ELSIF v_order.plan_id = 'contact_block_addon' THEN
    PERFORM public.admin_add_wallet_block(v_order.user_id);
  END IF;

  -- Mark the order as completed
  UPDATE public.payment_orders
  SET status = 'completed', completed_at = now()
  WHERE id = v_order.id;

  RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_payment_by_order_code(text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_by_order_code(text, numeric, text, text) TO service_role;
