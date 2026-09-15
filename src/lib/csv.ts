// Tiny CSV parser (handles quoted fields + commas + newlines).
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else field += c;
    }
  }
  if (field.length || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  const cleaned = rows.filter((r) => r.some((v) => v.trim().length));
  if (!cleaned.length) return [];
  const headers = cleaned[0].map((h) => h.trim());
  return cleaned
    .slice(1)
    .map((r) => Object.fromEntries(headers.map((h, idx) => [h, (r[idx] ?? "").trim()])));
}

export const BULK_CSV_TEMPLATE = `owner_email,owner_password,owner_display_name,name,slug,short_intro,address,country_code,province,lat,lng,phone,email,website,logo_url,banner_url,industry_slug,status,icon_tier
owner@example.com,,Owner Name,Acme Corp,acme-corp,Leading global tech,123 Main St,US,California,37.77,-122.41,+1-555-1000,hello@acme.com,https://acme.com,,,technology,public,standard
`;
