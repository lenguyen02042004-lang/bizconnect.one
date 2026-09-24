DROP FUNCTION IF EXISTS public.accept_business_invite(UUID);

CREATE OR REPLACE FUNCTION public.accept_business_invite(p_invite_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_id UUID;
    v_used_at TIMESTAMPTZ;
BEGIN
    -- Check if user is logged in
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT business_id, used_at INTO v_business_id, v_used_at
    FROM public.business_invites
    WHERE id = p_invite_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invite not found or invalid';
    END IF;

    IF v_used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Invite has already been used';
    END IF;

    -- Mark invite as used
    UPDATE public.business_invites
    SET used_by = auth.uid(),
        used_at = now()
    WHERE id = p_invite_id;

    -- Bypass the protected-columns guard (owner_id change is blocked for non-admins)
    PERFORM set_config('bizconnect.bypass_engagement_guard', '1', true);

    -- Transfer ownership and set claimed_at
    UPDATE public.businesses
    SET owner_id = auth.uid(),
        is_claimed = true,
        claimed_at = now()
    WHERE id = v_business_id;
END;
$$;
