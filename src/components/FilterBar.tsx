import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface Props {
  countries: { code: string; name: string }[];
  industries: { slug: string; name: string }[];
  country: string;
  industry: string;
  search: string;
  onCountry: (v: string) => void;
  onIndustry: (v: string) => void;
  onSearch: (v: string) => void;
}

export function FilterBar({
  countries,
  industries,
  country,
  industry,
  search,
  onCountry,
  onIndustry,
  onSearch,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="bg-background/80 backdrop-blur-md border border-border/40 rounded-2xl p-3 flex flex-col sm:flex-row gap-2 shadow-card">
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="pl-9 bg-background/70 border-border/60"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
        <Select value={country} onValueChange={onCountry}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background/70">
            <SelectValue placeholder={t("common.country")} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">{t("common.allCountries")}</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="inline-flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {c.code}
                  </span>
                  <span className="truncate">{c.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={industry} onValueChange={onIndustry}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background/70">
            <SelectValue placeholder={t("common.industry")} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">{t("common.allIndustries")}</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i.slug} value={i.slug}>
                <span className="truncate">
                  {t(`industry.${i.slug}`, { defaultValue: i.name })}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
