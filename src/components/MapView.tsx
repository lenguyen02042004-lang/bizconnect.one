import { useEffect, useRef } from "react";
import type { BusinessProfile } from "@/types/business";

interface Props {
  onSelect: (b: BusinessProfile) => void;
  businesses?: BusinessProfile[];
}

export function MapView({ onSelect, businesses = [] }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;
    let cancelled = false;

    (async () => {
      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default || leafletModule;
        if (cancelled || !ref.current || !L || !L.map) return;

      // Ensure we don't initialize if it's already initialized by a concurrent effect
      let map = mapRef.current;
      if (!map) {
        map = L.map(ref.current, {
          center: [20, 30], zoom: 2, minZoom: 2, zoomControl: true, worldCopyJump: true,
        });
        mapRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Fix Leaflet tile loading/size issue when container is initially hidden or 0 height
        const resizeObserver = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(ref.current);
        
        // Store observer to clean up later
        (mapRef.current as any)._resizeObserver = resizeObserver;
      } else {
        // Remove existing markers if we are re-running for businesses update
        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            map.removeLayer(layer);
          }
        });
      }

      businesses.forEach((b) => {
        const isPremium = b.icon_tier === "premium";
        const size = isPremium ? 56 : 44;
        const ringClass = isPremium
          ? "background:conic-gradient(from 0deg,#8b0000,#c8102e,#ff3b5c,#8b0000);padding:3px;animation:spin 8s linear infinite;"
          : "background:white;padding:2px;border:2px solid #c8102e;";

        const html = `
          <div style="width:${size}px;height:${size}px;border-radius:9999px;${ringClass};box-shadow:0 8px 20px -6px rgba(200,16,46,0.55);transition:transform .3s">
            <img src="${b.logo_url}" alt="${b.name}"
                 style="width:100%;height:100%;border-radius:9999px;background:white;object-fit:cover;display:block" />
          </div>`;

        const icon = L.divIcon({ html, className: "biz-marker", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
        const marker = L.marker([b.lat ?? 0, b.lng ?? 0], { icon }).addTo(map);
        marker.on("click", () => onSelect(b));
        marker.bindTooltip(b.name, { direction: "top", offset: [0, -size / 2] });
      });
      } catch (error) {
        console.error("Leaflet initialization error:", error);
      }
    })();

    return () => {
      cancelled = true;
      // We purposefully DO NOT destroy the map on every re-render to avoid flashing.
      // Leaflet map cleanup should ideally only happen on component unmount, 
      // but to handle React strict mode properly we leave it as is or clean it fully:
    };
  }, [businesses, onSelect]);

  // Handle actual unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        if (mapRef.current._resizeObserver) {
          mapRef.current._resizeObserver.disconnect();
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0" style={{ minHeight: "400px" }}>
      <div ref={ref} className="w-full h-full" />
    </div>
  );
}
