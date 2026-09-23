import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugRe = /^[a-z0-9-]+$/;

export const getPersonalBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ slug: z.string().min(1).max(120).regex(slugRe) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      data.slug,
    );
    let query = supabaseAdmin
      .from("personal_profiles")
      .select(
        "id, user_id, slug, full_name, job_title, company_name, phone, zalo, email, avatar_url, facebook_url, linkedin_url, is_public",
      );

    if (isUuid) {
      query = query.eq("id", data.slug);
    } else {
      query = query.eq("slug", data.slug);
    }

    const { data: row, error } = await query.maybeSingle();

    if (error) throw new Error(error.message);
    if (!row || !row.is_public) return { profile: null };

    return { profile: row };
  });
