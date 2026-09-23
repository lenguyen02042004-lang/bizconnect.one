import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { BusinessProfile } from "@/types/business";

// Country centroid coordinates for fallback when business has no lat/lng

function getMarkerPosition(b: BusinessProfile): [number, number] | null {
  const lat = b.lat;
  const lng = b.lng;

  // Has valid real coordinates (not zero)
  if (
    lat !== null &&
    lat !== undefined &&
    lng !== null &&
    lng !== undefined &&
    !(lat === 0 && lng === 0)
  ) {
    return [lat, lng];
  }

  // No usable position — skip this marker
  return null;
}

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
        await import("leaflet.markercluster");
        const L = leafletModule.default || leafletModule;
        if (cancelled || !ref.current || !L || !L.map) return;

        let map = mapRef.current;
        if (!map) {
          map = L.map(ref.current, {
            center: [20, 30],
            zoom: 2,
            minZoom: 1,
            maxZoom: 18,
            zoomControl: true,
            worldCopyJump: true,
          });
          mapRef.current = map;

          // PRIMARY: ESRI World Street Map — free, no API key needed, reliable globally
          const esriLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
            {
              attribution:
                'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ',
              maxZoom: 19,
            },
          );

          let osmFallbackApplied = false;
          // FALLBACK: OSM if ESRI fails on any network
          esriLayer.on("tileerror", () => {
            if (osmFallbackApplied) return;
            osmFallbackApplied = true;
            map.removeLayer(esriLayer);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              subdomains: "abc",
              maxZoom: 19,
            }).addTo(map);
          });

          esriLayer.addTo(map);

          // Fix container size issues
          const resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) mapRef.current.invalidateSize();
          });
          resizeObserver.observe(ref.current!);
          setTimeout(() => {
            if (mapRef.current) mapRef.current.invalidateSize();
          }, 300);
          (mapRef.current as any)._resizeObserver = resizeObserver;

          // Initialize Marker Cluster Group
          const clusterGroup = (L as any).markerClusterGroup({
            chunkedLoading: true,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            maxClusterRadius: 60,
            iconCreateFunction: (cluster: any) => {
              const count = cluster.getChildCount();
              const size = count < 10 ? 38 : count < 100 ? 46 : 54;
              return L.divIcon({
                html: `<div style="background:linear-gradient(135deg,#c8102e,#8b0000);color:white;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:700;font-size:13px;box-shadow:0 4px 16px rgba(200,16,46,0.5);border:3px solid white;">${count}</div>`,
                className: "custom-cluster-icon",
                iconSize: L.point(size, size),
                iconAnchor: L.point(size / 2, size / 2),
              });
            },
          });
          (mapRef.current as any)._clusterGroup = clusterGroup;
          map.addLayer(clusterGroup);
        } else {
          // Clear existing markers
          if ((mapRef.current as any)._clusterGroup) {
            (mapRef.current as any)._clusterGroup.clearLayers();
          }
        }

        const clusterGroup = (mapRef.current as any)._clusterGroup;

        businesses.forEach((b) => {
          const pos = getMarkerPosition(b);
          // Skip if no usable position
          if (!pos) return;

          const isPremium = b.icon_tier === "premium";
          const size = isPremium ? 52 : 40;

          const logoHtml = b.logo_url
            ? `<img src="${b.logo_url}" alt="${b.name}" style="width:100%;height:100%;border-radius:9999px;object-fit:cover;display:block;" />`
            : `<div style="width:100%;height:100%;border-radius:9999px;background:#c8102e;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${Math.round(size * 0.35)}px;">${b.name.charAt(0).toUpperCase()}</div>`;

          const borderStyle = isPremium
            ? `background:conic-gradient(from 0deg,#8b0000,#c8102e,#ff3b5c,#8b0000);padding:3px;`
            : `background:white;padding:2px;border:2px solid #c8102e;`;

          const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;${borderStyle}box-shadow:0 6px 18px -4px rgba(200,16,46,0.5);">${logoHtml}</div>`;

          const icon = L.divIcon({
            html,
            className: "biz-marker",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = L.marker(pos, { icon });
          marker.on("click", () => onSelect(b));
          marker.bindTooltip(b.name, {
            direction: "top",
            offset: [0, -(size / 2 + 4)],
            className: "biz-tooltip",
          });
          clusterGroup.addLayer(marker);
        });
      } catch (error) {
        console.error("MapView initialization error:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businesses, onSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        if (mapRef.current._resizeObserver) mapRef.current._resizeObserver.disconnect();
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
