-- 1. Add missing columns to personal_profiles
ALTER TABLE public.personal_profiles 
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count INTEGER NOT NULL DEFAULT 0;

-- 2. Enable pg_cron extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 3. Create function to increase daily views randomly
CREATE OR REPLACE FUNCTION public.increase_daily_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tăng view cho businesses: ngẫu nhiên từ 10 đến 50
  -- random() trả về [0, 1) -> random() * (50 - 10 + 1) + 10 = [10, 51) -> floor: 10 to 50
  UPDATE public.businesses
  SET views_count = views_count + floor(random() * 41 + 10)::int
  WHERE status = 'public';

  -- Tăng view cho personal_profiles: ngẫu nhiên từ 1 đến 5
  -- random() * (5 - 1 + 1) + 1 = [1, 6) -> floor: 1 to 5
  UPDATE public.personal_profiles
  SET views_count = views_count + floor(random() * 5 + 1)::int
  WHERE is_public = true;
END;
$$;

-- 4. Schedule the cron job to run at 00:00 UTC daily
SELECT cron.schedule('increase_daily_views_job', '0 0 * * *', 'SELECT public.increase_daily_views()');
