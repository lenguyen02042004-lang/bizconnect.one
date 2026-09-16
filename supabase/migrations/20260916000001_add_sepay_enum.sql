-- 20260916000001_add_sepay_enum.sql
-- Add sepay to payment_provider enum
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'sepay';
