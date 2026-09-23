import { useEffect, useRef, useState } from "react";
import type { BusinessProfile } from "@/types/business";

interface Props {
  onSelect: (b: BusinessProfile) => void;
  businesses?: BusinessProfile[];
}

import { useTranslation } from "react-i18next";

// Lazy import react-globe.gl on client only (uses WebGL / Three.js).
export function Globe3D({ onSelect, businesses = [] }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [GlobeComp, setGlobeComp] = useState<any>(null);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const available = Boolean(
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
      );
      setWebglAvailable(available);
      if (!available) return;
    } catch {
      setWebglAvailable(false);
      return;
    }

    import("react-globe.gl")
      .then((mod) => setGlobeComp(() => mod.default))
      .catch((error) => {
        console.warn("[Globe3D] WebGL globe unavailable:", error);
        setLoadFailed(true);
      });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      // Auto-rotate
      const controls = globeRef.current.controls?.();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
      }
    }
  }, [GlobeComp]);

  const points = businesses.map((b) => ({
    lat: b.lat,
    lng: b.lng,
    name: b.name,
    color: b.icon_tier === "premium" ? "#ff3b5c" : "#c8102e",
    size: b.icon_tier === "premium" ? 0.9 : 0.6,
    business: b,
  }));

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {GlobeComp && webglAvailable && !loadFailed && (
        <GlobeComp
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
          atmosphereColor="#ff3b5c"
          atmosphereAltitude={0.18}
          pointsData={points}
          pointAltitude={0.02}
          pointRadius="size"
          pointColor="color"
          pointLabel={(d: any) => `
            <div style="background:rgba(255,255,255,0.96);color:#222;padding:8px 12px;border-radius:10px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;box-shadow:0 8px 20px -8px rgba(200,16,46,0.55)">
              ${d.name}
            </div>`}
          onPointClick={(d: any) => onSelect(d.business)}
          pointsMerge={false}
          enablePointerInteraction
        />
      )}
      {(!GlobeComp || !webglAvailable || loadFailed) && (
        <div className="w-full h-full flex items-center justify-center text-white/60">
          {t("home.globeUnavailable", "Interactive globe unavailable")}
        </div>
      )}
    </div>
  );
}
