-- Fix send_card_limit to support 200 default limit and b2b_block_500
CREATE OR REPLACE FUNCTION public.send_card_visit(
  _from_business uuid DEFAULT NULL,
  _to_business uuid DEFAULT NULL,
  _from_user uuid DEFAULT NULL,
  _to_user uuid DEFAULT NULL,
  _subject text DEFAULT '',
  _body text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id uuid;
  v_active_blocks int;
  v_quota public.message_quotas;
  v_limit int;
  v_year int := extract(year from now());
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _from_business IS NULL AND _from_user IS NULL THEN
    RAISE EXCEPTION 'Must specify a sender (from_business or from_user)';
  END IF;

  IF _to_business IS NULL AND _to_user IS NULL THEN
    RAISE EXCEPTION 'Must specify a receiver (to_business or to_user)';
  END IF;

  -- Validate sender authorization
  IF _from_business IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = _from_business AND owner_id = auth.uid()) THEN
      RAISE EXCEPTION 'Not authorized to send from this business';
    END IF;
  END IF;
  
  IF _from_user IS NOT NULL THEN
    IF _from_user <> auth.uid() THEN
      RAISE EXCEPTION 'Not authorized to send from this user';
    END IF;
  END IF;

  -- Check active blocks (b2b_block_500 or contact_block_addon)
  SELECT COUNT(*) INTO v_active_blocks
  FROM public.subscriptions s
  WHERE s.user_id = auth.uid()
    AND s.status = 'active'
    AND s.sub_type IN ('b2b_block_500', 'contact_block_addon')
    AND (s.current_period_end IS NULL OR s.current_period_end > now());

  -- Ensure quota row exists for user
  SELECT * INTO v_quota FROM public.message_quotas
    WHERE user_id = auth.uid() AND period_year = v_year FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.message_quotas(user_id, period_year, used_count, bonus_credits)
    VALUES (auth.uid(), v_year, 0, 0)
    RETURNING * INTO v_quota;
  END IF;

  -- Limit is Base 200 + (500 * blocks)
  v_limit := 200 + (v_active_blocks * 500);

  IF v_quota.used_count >= v_limit THEN
    RAISE EXCEPTION 'Bạn đã dùng hết % / % lượt gửi danh thiếp năm nay. Mua thêm block 500 để tiếp tục.', v_quota.used_count, v_limit;
  END IF;

  INSERT INTO public.connect_messages(from_business_id, to_business_id, from_user_id, to_user_id, subject, body)
  VALUES (_from_business, _to_business, _from_user, _to_user, _subject, _body)
  RETURNING id INTO v_msg_id;

  -- Increment quota
  UPDATE public.message_quotas
  SET used_count = used_count + 1
  WHERE id = v_quota.id;

  RETURN v_msg_id;
END;
$$;
