import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { COUNTRY_LIST } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://bizconnect.one";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export const Route = createFileRoute("/sitemap.xml")({
  loader: async () => {
    try {
      const entries: SitemapEntry[] = [
        { loc: "/", changefreq: "daily", priority: 1.0 },
        { loc: "/explore", changefreq: "daily", priority: 0.9 },
        { loc: "/pricing", changefreq: "weekly", priority: 0.7 },
        { loc: "/support", changefreq: "monthly", priority: 0.5 },
        { loc: "/login", changefreq: "monthly", priority: 0.4 },
        { loc: "/countries", changefreq: "weekly", priority: 0.8 },
        { loc: "/blog/how-to-find-international-b2b-partners", changefreq: "monthly", priority: 0.8 },
      ];

      for (const country of COUNTRY_LIST) {
        entries.push({
          loc: `/country/${country.slug}`,
          changefreq: "weekly",
          priority: 0.7,
        });
      }

      let businessSlugs: string[] = [];
      let personalSlugs: string[] = [];
      try {
        const { data: bizes } = await supabase
          .from("businesses")
          .select("slug")
          .eq("status", "public");
        if (bizes) businessSlugs = bizes.map((b) => b.slug);

        const { data: persons } = await supabase
          .from("personal_profiles")
          .select("slug")
          .eq("is_public", true);
        if (persons) personalSlugs = persons.map((p) => p.slug);
      } catch (e) {
        console.error("Failed to fetch profiles for sitemap", e);
      }

      for (const slug of businessSlugs) {
        entries.push({
          loc: `/business/${slug}`,
          changefreq: "daily",
          priority: 0.8,
        });
      }

      for (const slug of personalSlugs) {
        entries.push({
          loc: `/p/${slug}`,
          changefreq: "weekly",
          priority: 0.6,
        });
      }

      const today = new Date().toISOString().split("T")[0];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${entries
              .map(
                (entry) => `
              <url>
                <loc>${BASE_URL}${entry.loc}</loc>
                <lastmod>${entry.lastmod || today}</lastmod>
                ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ""}
                ${entry.priority ? `<priority>${entry.priority}</priority>` : ""}
              </url>
            `,
              )
              .join("")}
          </urlset>`;

      return new Response(xml.trim(), {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (error) {
      console.error("Sitemap generation error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});
