import * as z from "zod";

export const businessFormSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, "Vui lòng nhập tên doanh nghiệp"),
  slug: z.string(),
  short_intro: z.string().max(240).optional().default(""),
  description: z.string().max(4000).optional().default(""),
  industry_id: z.string().nullable().default(null),
  logo_url: z.string().nullable().default(null),
  banner_url: z.string().nullable().default(null),
  address: z.string().optional().default(""),
  province: z.string().nullable().default(null),
  country_code: z.string().nullable().default(null),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
  phone: z.string().optional().default(""),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")).default(""),
  website: z.string().url("URL không hợp lệ").optional().or(z.literal("")).default(""),
  status: z.enum(["draft", "public"]).default("draft"),
  socials: z.record(z.string()).default({}),
  gallery: z.array(z.string()).default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional().nullable(),
        year: z.number().nullable(),
        icon: z.string().optional().nullable(),
      }),
    )
    .default([]),
});

export type BusinessFormValues = z.infer<typeof businessFormSchema>;
