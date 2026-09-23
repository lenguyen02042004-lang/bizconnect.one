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
      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
        bg-card border
        ${
          isPremium
            ? "border-amber-500/30 hover:border-amber-400/60 shadow-[0_2px_16px_rgba(251,191,36,0.08)]"
            : "border-border hover:border-primary/40 shadow-sm hover:shadow-[0_4px_20px_rgba(200,16,46,0.12)]"
        }`}
    >
      {/* Subtle top accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${isPremium ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" : "bg-gradient-to-r from-primary/60 via-primary to-primary/60"} opacity-80`}
      />

      {/* Premium badge */}
      {isPremium && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Premium
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        {/* Logo + Name row */}
        <div className="flex items-center gap-3">
          <div
            className={`shrink-0 rounded-xl overflow-hidden border transition-transform duration-300 group-hover:scale-105
            ${isPremium ? "border-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]" : "border-border/60"}`}
          >
            {b.logo_url ? (
              <img
                src={b.logo_url}
                alt={`Logo ${b.name}`}
                loading="lazy"
                decoding="async"
                className="w-14 h-14 object-contain bg-white p-1"
              />
            ) : (
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10">
                <span className="text-primary text-xl font-bold">{b.name?.[0] ?? "B"}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {b.name}
            </h3>
          </div>

          <FollowButton
            businessId={b.id}
            variant="icon"
            className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Short intro */}
        {b.short_intro && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {b.short_intro}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
          {b.country_name && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground flex items-center gap-1 group-hover:bg-primary/8 group-hover:text-primary transition-colors">
              <Globe2 className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{b.country_name}</span>
            </span>
          )}
          {b.industry_slug && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground flex items-center gap-1 group-hover:bg-primary/8 group-hover:text-primary transition-colors">
              <Briefcase className="w-3 h-3" />
              <span className="truncate max-w-[90px]">
                {t(`industry.${b.industry_slug}`, { defaultValue: b.industry })}
              </span>
            </span>
          )}
          <span className="ml-auto px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Eye className="w-3 h-3 text-primary" />
            {formatCount(b.views_count)}
          </span>
        </div>
      </div>
    </div>
  );
}
