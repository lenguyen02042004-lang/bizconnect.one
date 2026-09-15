import { createServerFn } from "@tanstack/react-start";

// Free geocoding via OpenStreetMap Nominatim — no API key required.
// Usage policy: send a descriptive User-Agent; 1 req/sec max.
export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => {
    if (!input?.query || typeof input.query !== "string") {
      throw new Error("Query is required");
    }
    if (input.query.length > 500) throw new Error("Query too long");
    return { query: input.query.trim().slice(0, 500) };
  })
  .handler(async ({ data }) => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", data.query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "BizConnectOne/1.0 (contact@bizconnect.one)",
        "Accept-Language": "vi,en",
      },
    });
    if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

    const arr = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: {
        country_code?: string;
        state?: string;
        city?: string;
        town?: string;
        village?: string;
      };
    }>;

    return {
      results: arr.map((r) => ({
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        label: r.display_name,
        country_code: r.address?.country_code?.toUpperCase() ?? null,
        province:
          r.address?.state ?? r.address?.city ?? r.address?.town ?? r.address?.village ?? null,
      })),
    };
  });
