-- Fix 1 & 4: Drop old policies and replace with secure ones
DROP POLICY IF EXISTS "Anyone can read unused invites" ON public.business_invites;
DROP POLICY IF EXISTS "Admins can manage business_invites" ON public.business_invites;
DROP POLICY IF EXISTS "Admins can view all invites" ON public.business_invites;

CREATE POLICY "Admins can view all invites"
    ON public.business_invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage business_invites"
    ON public.business_invites
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Fix 2 & 14: Update accept_business_invite
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
BEGIN
    -- Check if user is logged in
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

    -- Mark invite as used
    UPDATE public.business_invites
    SET is_used = true,
        used_by = auth.uid(),
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

-- Fix 3: Update create_business_invite
CREATE OR REPLACE FUNCTION public.create_business_invite(p_business_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite_id UUID;
    v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only admins can create invites';
    END IF;

    INSERT INTO public.business_invites (business_id, created_by)
    VALUES (p_business_id, auth.uid())
    RETURNING id INTO v_invite_id;

    RETURN v_invite_id;
END;
$$;
