-- Enable RLS for sepay_logs
ALTER TABLE public.sepay_logs ENABLE ROW LEVEL SECURITY;

-- Create functional indexes for short ID lookups in process_sepay_payment
-- Using CONCURRENTLY for safety on production, but typically not required for an empty/small table
CREATE INDEX IF NOT EXISTS idx_businesses_id_text ON public.businesses ((id::text));
