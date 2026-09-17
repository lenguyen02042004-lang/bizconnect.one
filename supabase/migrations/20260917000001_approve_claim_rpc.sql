CREATE OR REPLACE FUNCTION public.approve_business_claim(claim_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_claim_status TEXT;
    v_business_id UUID;
    v_user_id UUID;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if caller is admin
    SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Chỉ quản trị viên mới được phép thực hiện chức năng này.';
    END IF;

    -- Get claim details
    SELECT status, business_id, user_id INTO v_claim_status, v_business_id, v_user_id
    FROM public.business_claims
    WHERE id = claim_id;

    IF v_claim_status IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy yêu cầu này.';
    END IF;

    IF v_claim_status != 'pending' THEN
        RAISE EXCEPTION 'Yêu cầu này không ở trạng thái chờ duyệt.';
    END IF;

    -- 1. Update business ownership
    UPDATE public.businesses 
    SET owner_id = v_user_id, is_claimed = true 
    WHERE id = v_business_id;

    -- 2. Mark claim as approved
    UPDATE public.business_claims
    SET status = 'approved'
    WHERE id = claim_id;

    -- 3. Mark all other pending claims for this business as rejected
    UPDATE public.business_claims
    SET status = 'rejected'
    WHERE business_id = v_business_id AND id != claim_id AND status = 'pending';

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_business_claim(claim_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if caller is admin
    SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Chỉ quản trị viên mới được phép thực hiện chức năng này.';
    END IF;

    UPDATE public.business_claims
    SET status = 'rejected'
    WHERE id = claim_id AND status = 'pending';

    RETURN TRUE;
END;
$$;
