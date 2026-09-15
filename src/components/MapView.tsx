import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { BusinessProfile } from "@/types/business";

// Country centroid coordinates for fallback when business has no lat/lng
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  VN: [14.058, 108.277],
  CN: [35.861, 104.195],
  US: [37.090, -95.712],
  JP: [36.204, 138.252],
  KR: [35.907, 127.766],
  DE: [51.165, 10.451],
  FR: [46.227, 2.213],
  GB: [55.378, -3.435],
  TH: [15.870, 100.992],
  SG: [1.352, 103.819],
  MY: [4.210, 101.975],
  ID: [-0.789, 113.921],
  IN: [20.593, 78.962],
  AU: [-25.274, 133.775],
  CA: [56.130, -106.346],
  BR: [-14.235, -51.925],
  MX: [23.634, -102.552],
  IT: [41.871, 12.567],
  ES: [40.463, -3.749],
  RU: [61.524, 105.318],
  TR: [38.963, 35.243],
  SA: [23.885, 45.079],
  AE: [23.424, 53.847],
  ZA: [-30.559, 22.937],
  NG: [9.081, 8.675],
  EG: [26.820, 30.802],
  AR: [-38.416, -63.616],
  PH: [12.879, 121.774],
  PK: [30.375, 69.345],
  BD: [23.684, 90.356],
  TW: [23.697, 120.960],
  HK: [22.396, 114.109],
  NL: [52.132, 5.291],
  SE: [60.128, 18.643],
  NO: [60.472, 8.468],
  DK: [56.263, 9.501],
  FI: [61.924, 25.748],
  PL: [51.919, 19.145],
  CH: [46.818, 8.227],
  AT: [47.516, 14.550],
  BE: [50.503, 4.469],
  PT: [39.399, -8.224],
  GR: [39.074, 21.824],
  CZ: [49.817, 15.472],
  HU: [47.162, 19.503],
  RO: [45.943, 24.966],
  UA: [48.379, 31.165],
  IL: [31.046, 34.851],
  QA: [25.354, 51.183],
  KW: [29.311, 47.481],
  BH: [26.066, 50.557],
  OM: [21.512, 55.922],
  MM: [19.153, 96.057],
  KH: [12.565, 104.990],
  LA: [19.857, 102.495],
  NZ: [-40.900, 174.885],
  ZA: [-28.034, 24.276],
  CL: [-35.675, -71.542],
  CO: [4.570, -74.297],
  PE: [-9.189, -75.015],
  EC: [-1.831, -78.183],
  UZ: [41.377, 64.585],
  KZ: [48.019, 66.923],
};

function getMarkerPosition(b: BusinessProfile): [number, number] | null {
  const lat = b.lat;
  const lng = b.lng;

  // Has valid real coordinates (not zero)
  if (lat !== null && lat !== undefined && lng !== null && lng !== undefined &&
      !(lat === 0 && lng === 0)) {
    return [lat, lng];
  }

  // Fallback: use country centroid with small random jitter so markers don't stack exactly
  const countryCode = b.country_code?.toUpperCase();
  if (countryCode && COUNTRY_CENTROIDS[countryCode]) {
    const [clat, clng] = COUNTRY_CENTROIDS[countryCode];
    // Jitter ±1.5° so markers from same country spread out slightly
    const jitterLat = (Math.random() - 0.5) * 3;
    const jitterLng = (Math.random() - 0.5) * 3;
    return [clat + jitterLat, clng + jitterLng];
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

          // OSM tiles — free, no API key needed
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            crossOrigin: true,
            subdomains: ["a", "b", "c"],
          }).addTo(map);

          // Fix container size issues
          const resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) mapRef.current.invalidateSize();
          });
          resizeObserver.observe(ref.current!);
          setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 300);
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
          marker.bindTooltip(b.name, { direction: "top", offset: [0, -(size / 2 + 4)], className: "biz-tooltip" });
          clusterGroup.addLayer(marker);
        });
      } catch (error) {
        console.error("MapView initialization error:", error);
      }
    })();

    return () => { cancelled = true; };
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
