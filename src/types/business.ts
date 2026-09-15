export interface BusinessProfile {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  banner_url?: string;
  short_intro?: string;
  description?: string;
  certifications?: { name: string; year: number | null; icon?: string; issuer?: string }[];
  address?: string;
  country_code?: string;
  country_name?: string;
  province?: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  industry_slug?: string;
  views_count?: number;
  followers_count?: number;
  icon_tier?: "standard" | "premium";
  socials?: Record<string, string>;
  gallery?: string[];
}
