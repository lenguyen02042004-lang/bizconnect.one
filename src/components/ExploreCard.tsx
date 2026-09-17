import { formatCount } from "@/lib/format";
import { Eye, Globe2, Briefcase, Star } from "lucide-react";
import { FollowButton } from "./FollowButton";
import { useTranslation } from "react-i18next";

export function ExploreCard({ business: b, onSelect }: any) {
  const { t } = useTranslation();
  const isPremium = b.icon_tier === "premium";

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      className={`group relative overflow-hidden rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
        isPremium
          ? "border border-amber-400/40 hover:border-amber-400/70 shadow-[0_4px_24px_rgba(251,191,36,0.15)]"
          : "border border-white/15 hover:border-primary/60 shadow-[0_4px_24px_rgba(200,16,46,0.12)]"
      }`}
      style={{
        background: isPremium
          ? "linear-gradient(135deg, #9b0d23 0%, #c8102e 55%, #e84057 100%)"
          : "linear-gradient(135deg, #8b0a1f 0%, #b8102c 55%, #c8102e 100%)",
      }}
    >
      {/* Subtle noise/texture overlay */}
      <div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVy idPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')] pointer-events-none" />

      {/* Soft glow top-right */}
      <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      {/* Premium star badge */}
      {isPremium && (
        <div className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-lg border border-amber-200/50">
          <Star className="w-4 h-4 text-amber-950 fill-amber-950" />
        </div>
      )}

      <div className="p-6 flex flex-col h-full relative z-10">
        {/* Logo + Follow button */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className={`rounded-[18px] shrink-0 transition-transform duration-300 group-hover:scale-105 ${isPremium ? "ring-2 ring-amber-300/60 shadow-[0_0_16px_rgba(251,191,36,0.3)]" : "ring-2 ring-white/30 shadow-md"}`}>
            {b.logo_url ? (
              <img
                src={`https://wsrv.nl/?url=${encodeURIComponent(b.logo_url)}&w=128&h=128&fit=contain&a=attention`}
                alt={`Logo ${b.name}`}
                loading="lazy"
                decoding="async"
                className="w-16 h-16 rounded-[16px] object-contain bg-white p-1"
              />
            ) : (
              <div className="w-16 h-16 rounded-[16px] bg-white/20 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{b.name?.[0] ?? "B"}</span>
              </div>
            )}
          </div>
          <FollowButton
            businessId={b.id}
            variant="icon"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 text-white border-white/20"
          />
        </div>

        {/* Business name */}
        <h3 className="font-display font-bold text-lg leading-snug mb-1 line-clamp-2 text-white drop-shadow-sm">
          {b.name}
        </h3>

        {/* Short intro */}
        {b.short_intro && (
          <p className="text-sm text-white/80 line-clamp-2 leading-relaxed mb-3">
            {b.short_intro}
          </p>
        )}

        {/* Tags row */}
        <div className="mt-auto pt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white border-t border-white/15">
          {b.country_name && (
            <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm flex items-center gap-1.5 group-hover:bg-white/25 transition-colors">
              <Globe2 className="w-3.5 h-3.5" />
              <span className="truncate max-w-[90px]">{b.country_name}</span>
            </span>
          )}
          {b.industry_slug && (
            <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm flex items-center gap-1.5 group-hover:bg-white/25 transition-colors">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="truncate max-w-[100px]">{t(`industry.${b.industry_slug}`, { defaultValue: b.industry })}</span>
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm flex items-center gap-1.5 ml-auto group-hover:bg-white/25 transition-colors">
            <Eye className="w-3.5 h-3.5" /> {formatCount(b.views_count)}
          </span>
        </div>
      </div>
    </div>
  );
}
