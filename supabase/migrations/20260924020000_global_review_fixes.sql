-- Fix 1: saved_contacts business_id can be null for personal saves
ALTER TABLE public.saved_contacts ALTER COLUMN business_id DROP NOT NULL;

-- Fix 2: accept_business_invite check owner_id IS NULL
DROP FUNCTION IF EXISTS public.accept_business_invite(UUID);
CREATE OR REPLACE FUNCTION public.accept_business_invite(p_invite_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_id UUID;
    v_is_used BOOLEAN;
    v_owner_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT business_id, is_used INTO v_business_id, v_is_used
    FROM public.business_invites
    WHERE id = p_invite_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invite not found or invalid';
    END IF;

    IF v_is_used THEN
        RAISE EXCEPTION 'Invite has already been used';
    END IF;

    SELECT owner_id INTO v_owner_id FROM public.businesses WHERE id = v_business_id;
    IF v_owner_id IS NOT NULL THEN
        RAISE EXCEPTION 'Business already has an owner';
    END IF;

    UPDATE public.business_invites
    SET is_used = true,
        used_by = auth.uid(),
        used_at = now()
    WHERE id = p_invite_id;

    PERFORM set_config('bizconnect.bypass_engagement_guard', '1', true);

    UPDATE public.businesses
    SET owner_id = auth.uid(),
        is_claimed = true,
        claimed_at = now()
    WHERE id = v_business_id;
END;
$$;

-- Fix 3: get_my_quota reporting wrong limits
DROP FUNCTION IF EXISTS public.get_my_quota();
CREATE OR REPLACE FUNCTION get_my_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used_count int;
  v_limit int;
  v_active_blocks int;
  v_bonus int;
BEGIN
  SELECT COALESCE(SUM(used_count), 0), COALESCE(SUM(bonus_credits), 0) INTO v_used_count, v_bonus
  FROM message_quotas
  WHERE user_id = auth.uid() AND period_year = EXTRACT(YEAR FROM CURRENT_DATE);

  SELECT COUNT(*) INTO v_active_blocks
  FROM subscriptions
  WHERE user_id = auth.uid() 
    AND status = 'active'
    AND sub_type = 'b2b_block_500'
    AND (current_period_end IS NULL OR current_period_end > now());

  v_limit := 200 + (v_active_blocks * 500) + COALESCE(v_bonus, 0);

  RETURN jsonb_build_object(
    'used_count', v_used_count,
    'bonus_credits', COALESCE(v_bonus, 0),
    'limit', v_limit
  );
END;
$$;

DROP FUNCTION IF EXISTS my_wallet_limits();
CREATE OR REPLACE FUNCTION my_wallet_limits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
  v_limit int;
  v_active_blocks int;
BEGIN
  SELECT count(*) INTO v_count
  FROM saved_contacts
  WHERE user_id = auth.uid();

  SELECT COUNT(*) INTO v_active_blocks
  FROM subscriptions
  WHERE user_id = auth.uid() 
    AND status = 'active'
    AND sub_type = 'contact_block_addon'
    AND (current_period_end IS NULL OR current_period_end > now());
    
  v_limit := 200 + (v_active_blocks * 500);

  RETURN jsonb_build_object(
    'current_saved_count', v_count,
    'max_saved_allowed', v_limit,
    'blocks_purchased', v_active_blocks
  );
END;
$$;

-- Fix 4: messages_update_receiver
DROP POLICY IF EXISTS "messages_update_receiver" ON public.connect_messages;
CREATE POLICY "messages_update_receiver" ON public.connect_messages FOR UPDATE USING (
  auth.uid() = to_user_id OR
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = to_business_id AND b.owner_id = auth.uid())
);

-- Fix 5: manual payment support b2b_premium and fix b2b_block_500 helper bug
DROP FUNCTION IF EXISTS public.submit_manual_payment(text, numeric, text, uuid);
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

  IF p_plan_id NOT IN ('b2b_block_500', 'icon_premium', 'contact_block_addon', 'b2b_premium') THEN
    RAISE EXCEPTION 'Unsupported payment plan';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;

  IF p_plan_id IN ('b2b_block_500', 'icon_premium', 'b2b_premium') THEN
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
  ELSIF p_plan_id = 'b2b_premium' THEN
    v_payment_type := 'membership';
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

DROP FUNCTION IF EXISTS public.process_sepay_payment(text, text, text, numeric, text, text);
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
  IF p_plan_id NOT IN ('b2b_block_500', 'icon_premium', 'contact_block_addon', 'b2b_premium') THEN
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

  IF p_plan_id IN ('b2b_block_500', 'icon_premium', 'b2b_premium') AND v_business_id IS NULL THEN
    RAISE EXCEPTION 'Business not found for payment code';
  END IF;

  IF p_plan_id = 'contact_block_addon' THEN
    v_payment_type := 'extra_quota';
  ELSIF p_plan_id = 'icon_premium' THEN
    v_payment_type := 'icon_premium';
  ELSIF p_plan_id = 'b2b_premium' THEN
    v_payment_type := 'membership';
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
  ELSIF p_plan_id = 'b2b_premium' THEN
    UPDATE public.businesses
    SET premium_until = now() + interval '1 year'
    WHERE id = v_business_id;
  ELSIF p_plan_id = 'contact_block_addon' THEN
    PERFORM public.admin_add_wallet_block(v_user_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id);
END;
$$;
