"use client";

import { useEffect, useRef, useState } from "react";
import type { Station } from "@/types";
// Import thư viện Vietmap
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { Loader2 } from "lucide-react";

interface StationMapProps {
  stations: Station[];
  center?: [number, number]; // [Lat, Lng]
  zoom?: number;
}

export function StationMap({
  stations,
  center = [10.7769, 106.7009], // Mặc định TP.HCM
  zoom = 13,
}: StationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  // Thêm ref này để kiểm soát việc khởi tạo map, tránh duplicate trong Strict Mode
  const mapInitRef = useRef<boolean>(false);
  const markersRef = useRef<vietmapgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 1. Khởi tạo bản đồ
  useEffect(() => {
    // Nếu đã init hoặc không có container thì dừng
    if (mapInitRef.current || !mapContainerRef.current) return;

    mapInitRef.current = true; // Đánh dấu đang/đã khởi tạo

    const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";

    try {
      const map = new vietmapgl.Map({
        container: mapContainerRef.current,
        style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
        center: [center[1], center[0]],
        zoom: zoom,
        pitch: 45,
      });

      // Lưu ref ngay lập tức
      mapRef.current = map;

      map.addControl(new vietmapgl.NavigationControl(), "top-right");

      map.on("load", () => {
        setIsMapLoaded(true);
        map.resize();
      });

      // Bắt lỗi chung của map để tránh crash ứng dụng
      map.on("error", (e) => {
        console.warn("Vietmap error:", e);
      });
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    // Cleanup
    return () => {
      // Trong Strict Mode, React sẽ unmount ngay lập tức.
      // Chúng ta cần kiểm tra kỹ trước khi remove.
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // Bỏ qua lỗi AbortError khi unmount nhanh
          console.debug("Map remove error (safe to ignore):", e);
        }
        mapRef.current = null;
        mapInitRef.current = false; // Reset trạng thái để có thể init lại nếu cần
      }
    };
  }, []); // Chỉ chạy 1 lần khi mount

  // 2. Quản lý Markers
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    // Xóa markers cũ
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const popupHTML = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-bold text-base mb-1">${station.name}</h3>
          <p class="text-sm text-gray-600 mb-2">
            ${station.address.street}, ${station.address.ward}
          </p>
          <div class="flex gap-2">
            <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
              ${station.type}
            </span>
            <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
              ${station.status}
            </span>
          </div>
        </div>
      `;

      const popup = new vietmapgl.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(popupHTML);

      const marker = new vietmapgl.Marker({ color: "#EF4444" })
        .setLngLat([station.location.longitude, station.location.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [stations, isMapLoaded]);

  // 3. FlyTo Animation
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    mapRef.current.flyTo({
      center: [center[1], center[0]],
      zoom: zoom,
      essential: true,
      duration: 1500,
    });
  }, [center, zoom, isMapLoaded]);

  return (
    <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
