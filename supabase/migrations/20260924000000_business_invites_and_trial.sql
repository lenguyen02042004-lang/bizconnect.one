-- 1. Add claimed_at to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- 2. Create business_invites table
CREATE TABLE IF NOT EXISTS public.business_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.business_invites ENABLE ROW LEVEL SECURITY;

-- Admins can manage invites
DROP POLICY IF EXISTS "Admins can manage business_invites" ON public.business_invites;
CREATE POLICY "Admins can manage business_invites" ON public.business_invites
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- Anyone can read unused invites to verify them before login
DROP POLICY IF EXISTS "Anyone can read unused invites" ON public.business_invites;
CREATE POLICY "Anyone can read unused invites" ON public.business_invites
  FOR SELECT USING (used_at IS NULL);

-- 3. RPC to create invite
DROP FUNCTION IF EXISTS public.create_business_invite(UUID);
CREATE OR REPLACE FUNCTION public.create_business_invite(p_business_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invite_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Check admin
  SELECT (role = 'admin') INTO v_is_admin FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  IF v_is_admin IS NULL OR NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can create invites';
  END IF;

  INSERT INTO public.business_invites (business_id, created_by)
  VALUES (p_business_id, auth.uid())
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;

-- 4. RPC to accept invite
DROP FUNCTION IF EXISTS public.accept_business_invite(UUID);
CREATE OR REPLACE FUNCTION public.accept_business_invite(p_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_business_id UUID;
  v_used_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT business_id, used_at INTO v_business_id, v_used_at
  FROM public.business_invites
  WHERE id = p_invite_id;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invite already used';
  END IF;

  -- Mark invite as used
  UPDATE public.business_invites
  SET used_by = auth.uid(), used_at = now()
  WHERE id = p_invite_id;

  -- Transfer ownership and set claimed_at
  UPDATE public.businesses
  SET owner_id = auth.uid(), is_claimed = true, claimed_at = now()
  WHERE id = v_business_id;

  RETURN TRUE;
END;
$$;
