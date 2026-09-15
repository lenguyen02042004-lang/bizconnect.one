import { BusinessProfile } from "@/types/business";

function esc(v: string) {
  return (v ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function buildVCard(b: BusinessProfile, profileUrl?: string): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(b.name)}`,
    `ORG:${esc(b.name)}`,
    b.industry ? `TITLE:${esc(b.industry)}` : "",
    b.phone ? `TEL;TYPE=WORK,VOICE:${esc(b.phone)}` : "",
    b.email ? `EMAIL;TYPE=WORK:${esc(b.email)}` : "",
    b.website ? `URL:${esc(b.website)}` : "",
    profileUrl ? `URL:${esc(profileUrl)}` : "",
    b.address || b.province || b.country_name
      ? `ADR;TYPE=WORK:;;${esc(b.address || "")};${esc(b.province || "")};;;${esc(b.country_name || "")}`
      : "",
    b.short_intro ? `NOTE:${esc(b.short_intro)}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadVCard(b: BusinessProfile, profileUrl?: string) {
  const vcf = buildVCard(b, profileUrl);
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${b.slug || b.name.replace(/\s+/g, "-").toLowerCase()}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
