-- Create an RPC to fetch randomized explore businesses
CREATE OR REPLACE FUNCTION get_randomized_explore_businesses(
    p_country text DEFAULT 'all',
    p_industry_slug text DEFAULT 'all',
    p_search text DEFAULT ''
)
RETURNS SETOF businesses
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_industry_id uuid;
BEGIN
    -- Resolve industry slug to id if provided
    IF p_industry_slug IS NOT NULL AND p_industry_slug != 'all' AND p_industry_slug != '' THEN
        SELECT id INTO v_industry_id FROM industries WHERE slug = p_industry_slug LIMIT 1;
    END IF;

    RETURN QUERY
    SELECT b.*
    FROM businesses b
    WHERE b.status = 'public'
      AND (p_country IS NULL OR p_country = 'all' OR p_country = '' OR b.country_code = p_country)
      AND (p_industry_slug IS NULL OR p_industry_slug = 'all' OR p_industry_slug = '' OR b.industry_id = v_industry_id)
      AND (p_search IS NULL OR p_search = '' OR b.name ILIKE '%' || p_search || '%')
    ORDER BY
      -- Priority 1: Newly registered within the last 1 day (24 hours) gets priority 1, others 2
      CASE 
        WHEN b.created_at >= NOW() - INTERVAL '1 day' THEN 1 
        ELSE 2 
      END ASC,
      -- Priority 2: Sort the new ones by created_at DESC (newest first)
      CASE 
        WHEN b.created_at >= NOW() - INTERVAL '1 day' THEN b.created_at 
        ELSE NULL 
      END DESC,
      -- Priority 3: Randomize the older ones, but keep the order stable for 24 hours to prevent pagination jumping
      MD5(b.id::text || CURRENT_DATE::text) ASC;
END;
$$;
