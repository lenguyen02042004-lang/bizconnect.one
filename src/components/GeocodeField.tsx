import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";
import { geocodeAddress } from "@/lib/geocode.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

interface Props {
  value: {
    address: string;
    lat: number | null;
    lng: number | null;
    province: string | null;
    country_code: string | null;
  };
  onChange: (v: Props["value"]) => void;
}

export function GeocodeField({ value, onChange }: Props) {
  const geocode = useServerFn(geocodeAddress);
  const [query, setQuery] = useState(value.address);
  const [results, setResults] = useState<
    Array<{
      lat: number;
      lng: number;
      label: string;
      country_code: string | null;
      province: string | null;
    }>
  >([]);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    try {
      const { results } = await geocode({ data: { query } });
      setResults(results);
      if (results.length === 0) toast.error("Không tìm thấy địa chỉ");
    } catch (e: any) {
      toast.error(e.message ?? "Tìm kiếm thất bại");
    } finally {
      setBusy(false);
    }
  };

  const pick = (r: (typeof results)[number]) => {
    onChange({
      address: query,
      lat: r.lat,
      lng: r.lng,
      country_code: r.country_code,
      province: r.province,
    });
    setResults([]);
    toast.success("Đã chọn vị trí");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Địa chỉ</label>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Số nhà, đường, thành phố, quốc gia"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
        />
        <Button type="button" variant="outline" onClick={search} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="border border-border rounded-xl divide-y divide-border bg-card">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex gap-2 items-start"
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate">{r.label}</p>
                <p className="text-xs text-muted-foreground">
                  {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                  {r.country_code && ` · ${r.country_code}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {value.lat !== null && value.lng !== null && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
          <MapPin className="w-3 h-3 text-primary" />
          Tọa độ: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          {value.country_code && ` · ${value.country_code}`}
          {value.province && ` · ${value.province}`}
        </div>
      )}
    </div>
  );
}
