-- 20260916000002_add_b2b_block_sub_type.sql
-- Add b2b_block_500 to sub_type check constraint

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_sub_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_sub_type_check CHECK (sub_type IN ('b2b_premium', 'icon_premium', 'contact_block_addon', 'b2b_block_500', 'membership'));
