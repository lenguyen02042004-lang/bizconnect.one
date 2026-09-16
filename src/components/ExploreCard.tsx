import { formatCount } from "@/lib/format";
import { Eye, Globe2, Briefcase } from "lucide-react";
import { FollowButton } from "./FollowButton";
import { useTranslation } from "react-i18next";

export function ExploreCard({ business: b, onSelect }: any) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      className={`group relative overflow-hidden rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-[#160b0e] text-white ${
        b.icon_tier === "premium"
          ? "border border-premium/50 hover:border-premium shadow-premium/20"
          : "border border-white/10 hover:border-primary/50 shadow-soft"
      }`}
    >
      {/* Decorative gradient for premium */}
      {b.icon_tier === "premium" && (
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-premium/15 blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-70" />
      )}
      
      <div className="p-6 flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className={`p-1 rounded-[20px] shrink-0 transition-transform duration-300 group-hover:scale-105 ${b.icon_tier === "premium" ? "bg-gradient-premium shadow-glow" : "bg-white/10"}`}>
            <img
              src={b.logo_url}
              alt={`Logo ${b.name}`}
              loading="lazy"
              decoding="async"
              className="w-16 h-16 rounded-[16px] object-cover bg-white"
            />
          </div>
          <FollowButton businessId={b.id} variant="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <h3 className="font-display font-bold text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2 text-white">
          {b.name}
        </h3>
        
        <div className="mt-auto pt-4 flex flex-col gap-3">
          {b.short_intro && (
            <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
              {b.short_intro}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/70 mt-2">
            {b.country_name && (
              <span className="px-2.5 py-1 rounded-lg bg-white/5 flex items-center gap-1.5 transition-colors group-hover:bg-white/10">
                <Globe2 className="w-3.5 h-3.5" /> <span className="truncate max-w-[100px]">{b.country_name}</span>
              </span>
            )}
            {b.industry_slug && (
              <span className="px-2.5 py-1 rounded-lg bg-white/5 flex items-center gap-1.5 transition-colors group-hover:bg-white/10">
                <Briefcase className="w-3.5 h-3.5" /> <span className="truncate max-w-[120px]">{t(`industry.${b.industry_slug}`, { defaultValue: b.industry })}</span>
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-white/5 flex items-center gap-1.5 ml-auto transition-colors group-hover:bg-white/10 text-rose-500 font-bold">
              <Eye className="w-3.5 h-3.5" /> {formatCount(b.views_count)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
