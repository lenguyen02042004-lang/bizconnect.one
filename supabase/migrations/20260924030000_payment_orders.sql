-- 1. Create payment_orders table
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(6) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    business_id UUID REFERENCES public.businesses(id),
    plan_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can read own orders" ON public.payment_orders
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Function to generate a random 6-character code
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(6) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- 3. RPC to create a new payment order
CREATE OR REPLACE FUNCTION public.create_payment_order(
    p_plan_id TEXT,
    p_amount NUMERIC,
    p_business_id UUID DEFAULT NULL
)
RETURNS VARCHAR(6)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code VARCHAR(6);
    v_exists BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Generate a unique code
    LOOP
        v_code := public.generate_order_code();
        SELECT EXISTS(SELECT 1 FROM public.payment_orders WHERE order_code = v_code) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;

    -- Insert order
    INSERT INTO public.payment_orders (order_code, user_id, business_id, plan_id, amount)
    VALUES (v_code, auth.uid(), p_business_id, p_plan_id, p_amount);

    RETURN v_code;
END;
$$;
