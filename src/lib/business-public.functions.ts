import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugRe = /^[a-z0-9-]+$/;

export const getBusinessBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ slug: z.string().min(1).max(120).regex(slugRe) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.slug);
    let query = supabase
      .from("businesses")
      .select("*, industries(name, slug), countries(name)");
      
    if (isUuid) {
      query = query.eq("id", data.slug);
    } else {
      query = query.eq("slug", data.slug);
    }

    const { data: biz, error } = await query.maybeSingle();

    if (error) throw new Error(error.message);
    if (!biz) return { business: null };
    if (biz.status !== "public") return { business: null };

    const [{ data: socials }, { data: gallery }] = await Promise.all([
      supabase.from("business_socials").select("platform, url").eq("business_id", biz.id),
      supabase
        .from("business_gallery")
        .select("image_url")
        .eq("business_id", biz.id)
        .order("order_index"),
    ]);

    const industry = (biz as any).industries?.name ?? "";
    const industry_slug = (biz as any).industries?.slug ?? "";
    const country_name = (biz as any).countries?.name ?? biz.country_code ?? "";

    return {
      business: {
        id: biz.id,
        slug: biz.slug,
        name: biz.name,
        logo_url: biz.logo_url ?? "",
        banner_url: biz.banner_url ?? "",
        short_intro: biz.short_intro ?? "",
        description: (biz as any).description ?? "",
        certifications: Array.isArray((biz as any).certifications)
          ? (biz as any).certifications
          : [],
        address: biz.address ?? "",
        country_code: biz.country_code ?? "",
        country_name,
        province: biz.province ?? "",
        lat: biz.lat ?? 0,
        lng: biz.lng ?? 0,
        phone: biz.phone ?? "",
        email: biz.email ?? "",
        website: biz.website ?? "",
        industry,
        industry_slug,
        views_count: biz.views_count ?? 0,
        icon_tier: biz.icon_tier as "standard" | "premium",
        socials: Object.fromEntries((socials ?? []).map((s) => [s.platform, s.url])),
        gallery: (gallery ?? []).map((g) => g.image_url),
      },
    };
  });

export const getExploreBusinesses = createServerFn({ method: "GET" })
  .inputValidator((input: any) =>
    z.object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(20),
      country: z.string().optional(),
      industry: z.string().optional(),
      q: z.string().optional(),
    }).parse(input || {})
  )
  .handler(async ({ data: input }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    let query = supabase
      .from("businesses")
      .select(
        "id, name, slug, logo_url, country_code, lat, lng, views_count, icon_tier, status, short_intro, website, industries(name, slug), countries(name)",
        { count: 'exact' }
      )
      .eq("status", "public");

    if (input.country && input.country !== "all") {
      query = query.eq("country_code", input.country);
    }
    
    if (input.industry && input.industry !== "all") {
      const { data: ind } = await supabase.from("industries").select("id").eq("slug", input.industry).maybeSingle();
      if (ind) {
        query = query.eq("industry_id", ind.id);
      }
    }
    
    if (input.q) {
      query = query.ilike("name", `%${input.q}%`);
    }

    const from = (input.page - 1) * input.limit;
    const to = from + input.limit - 1;

    const { data: bizes, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
  
    if (error) throw new Error(error.message);
  
    return {
      total: count || 0,
      businesses: (bizes ?? []).map((biz) => ({
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      logo_url: biz.logo_url ?? "",
      country_code: biz.country_code ?? "",
      country_name: (biz as any).countries?.name ?? biz.country_code ?? "",
      industry: (biz as any).industries?.name ?? "",
      industry_slug: (biz as any).industries?.slug ?? "",
      lat: biz.lat ?? null,
      lng: biz.lng ?? null,
      views_count: biz.views_count ?? 0,
      icon_tier: (biz.icon_tier as "standard" | "premium") ?? "standard",
      short_intro: biz.short_intro ?? "",
      description: "",
      certifications: [],
      address: "",
      province: "",
      phone: "",
      email: "",
      website: biz.website ?? "",
      banner_url: "",
      socials: {},
      gallery: [],
    })),
  };
});

export const getGlobalLists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  
  // Get all countries and industries
  const [{ data: countries }, { data: industries }] = await Promise.all([
    supabase.from("countries").select("code, name, flag").order("name"),
    supabase.from("industries").select("slug, name, icon").order("name"),
  ]);

  // Fetch only distinct country codes that have public businesses
  const { data: activeBizes } = await supabase
    .from("businesses")
    .select("country_code")
    .eq("status", "public");

  const activeCodes = new Set(activeBizes?.map(b => b.country_code) || []);
  const activeCountries = (countries ?? []).filter(c => activeCodes.has(c.code));

  return { countries: activeCountries, industries: industries ?? [] };
});
