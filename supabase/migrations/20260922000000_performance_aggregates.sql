-- Aggregate public dashboard data in PostgreSQL instead of transferring all rows.

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'connections', (SELECT count(*) FROM public.connect_messages),
    'businesses', (SELECT count(*) FROM public.businesses WHERE status = 'public'),
    'industryCounts', COALESCE((
      SELECT jsonb_object_agg(COALESCE(i.slug, 'other'), counts.total)
      FROM (
        SELECT industry_id, count(*) AS total
        FROM public.businesses
        WHERE status = 'public'
        GROUP BY industry_id
      ) counts
      LEFT JOIN public.industries i ON i.id = counts.industry_id
    ), '{}'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_public_country_codes()
RETURNS TABLE(country_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT b.country_code
  FROM public.businesses b
  WHERE b.status = 'public' AND b.country_code IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_public_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_public_country_codes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_country_codes() TO anon, authenticated, service_role;
