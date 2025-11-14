"use client";

import { useEffect, useRef } from "react";
import type { Station } from "@/types";

interface StationMapProps {
  stations: Station[];
}

export function StationMap({ stations }: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current) {
      // Leaflet implementation would go here
      // For demo, just show a placeholder
    }
  }, [stations]);

  return (
    <div
      ref={mapRef}
      className="h-[500px] w-full bg-gray-200 rounded-lg flex items-center justify-center"
    >
      <div className="text-center">
        <p className="text-muted-foreground">
          Map visualization với {stations.length} trạm
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          (Tích hợp Leaflet/Google Maps ở đây)
        </p>
      </div>
    </div>
  );
}
