"use client";

import { useEffect, useRef, useState } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { Loader2 } from "lucide-react";
import type { JourneyPath } from "@/types";

interface JourneyMapProps {
  pathData: JourneyPath | null;
}

function decodePolyline(encoded: string) {
  let points = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function JourneyMap({ pathData }: JourneyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  // KHAI BÁO BIẾN NÀY ĐỂ TRÁNH LỖI
  const mapInitRef = useRef(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 1. Khởi tạo bản đồ (Safe Init & Cleanup)
  // 1. Khởi tạo bản đồ (Safe Init & Cleanup)
  useEffect(() => {
    if (!mapContainerRef.current || mapInitRef.current) return;

    mapInitRef.current = true;

    const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";
    let mapInstance: any = null; // Dùng any để truy cập thuộc tính nội bộ nếu cần

    try {
      mapInstance = new vietmapgl.Map({
        container: mapContainerRef.current,
        style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
        center: [106.7009, 10.7769],
        zoom: 12,
        pitch: 0,
      });

      mapRef.current = mapInstance;
      mapInstance.addControl(new vietmapgl.NavigationControl(), "top-right");

      mapInstance.on("load", () => {
        if (!mapInstance) return; // Map đã bị hủy
        setIsMapLoaded(true);
        mapInstance.resize();
      });
    } catch (e) {
      console.error("Map Init Failed:", e);
      mapInitRef.current = false;
    }

    // CLEANUP FUNCTION
    return () => {
      // Đánh dấu component đã unmount
      setIsMapLoaded(false);

      if (mapInstance) {
        // Hủy các event listener để tránh memory leak
        mapInstance.off("load");
        mapInstance.off("error");

        // Trick: Đặt timeout nhỏ để đẩy việc remove xuống cuối hàng đợi sự kiện (Event Loop)
        // Điều này giúp các request đang chạy dở có thời gian hoàn tất hoặc hủy an toàn hơn
        setTimeout(() => {
          try {
            if (mapInstance && mapInstance._container) {
              mapInstance.remove();
            }
          } catch (error) {
            // Silent fail
          }
        }, 0);

        mapRef.current = null;
        mapInstance = null;
        mapInitRef.current = false;
      }
    };
  }, []);

  // 2. Vẽ lộ trình (Logic vẽ đường cong mượt mà)
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !pathData) return;

    const map = mapRef.current;
    const vertices = pathData.vertices;

    if (!vertices || vertices.length === 0) return;

    // Xóa layer/source cũ an toàn
    if (map.getLayer("route-layer")) map.removeLayer("route-layer");
    if (map.getSource("route-source")) map.removeSource("route-source");

    // Xóa marker cũ
    const markers = document.getElementsByClassName("vietmap-marker");
    while (markers.length > 0) {
      markers[0].remove();
    }

    const drawRoute = async () => {
      try {
        // Lấy điểm để vẽ (Sampling thông minh nếu quá nhiều điểm)
        let pointsToRoute = vertices;
        // Nếu quá 25 điểm, lấy mẫu để tránh lỗi URL quá dài
        if (vertices.length > 25) {
          pointsToRoute = [
            vertices[0],
            ...vertices
              .slice(1, -1)
              .filter((_, i) => i % Math.ceil(vertices.length / 20) === 0),
            vertices[vertices.length - 1],
          ];
        }

        const pointsParam = pointsToRoute
          .map((v) => `point=${v.location.latitude},${v.location.longitude}`)
          .join("&");

        const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";
        const url = `https://maps.vietmap.vn/api/route?api-version=1.1&apikey=${apiKey}&vehicle=car&points_encoded=true&${pointsParam}`;

        const res = await fetch(url);
        const data = await res.json();

        let routeCoordinates: any[] = [];

        if (data.paths && data.paths[0] && data.paths[0].points) {
          const pointsData = data.paths[0].points;
          // Decode
          if (typeof pointsData === "string") {
            const decoded = decodePolyline(pointsData);
            // [lat, lng] -> [lng, lat]
            routeCoordinates = decoded.map((p) => [p[1], p[0]]);
          } else {
            // Fallback
            routeCoordinates = vertices.map((v) => [
              v.location.longitude,
              v.location.latitude,
            ]);
          }
        } else {
          // Fallback: Nối thẳng
          routeCoordinates = vertices.map((v) => [
            v.location.longitude,
            v.location.latitude,
          ]);
        }

        // Add Source
        map.addSource("route-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeCoordinates,
            },
          },
        });

        // Add Layer
        map.addLayer({
          id: "route-layer",
          type: "line",
          source: "route-source",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 5,
            "line-opacity": 0.8,
          },
        });

        // Fit Bounds (Zoom bao quát toàn bộ các trạm)
        const bounds = new vietmapgl.LngLatBounds();
        // Thêm đường đi vào bounds
        routeCoordinates.forEach((coord: any) => bounds.extend(coord));
        // Thêm các trạm vào bounds (để chắc chắn không bị sót trạm nào)
        vertices.forEach((v) =>
          bounds.extend([v.location.longitude, v.location.latitude])
        );

        map.fitBounds(bounds, { padding: 50 });

        // Markers (Vẽ TẤT CẢ các trạm)
        vertices.forEach((v, index) => {
          const el = document.createElement("div");
          el.className = "vietmap-marker";
          // Basic Styles
          el.style.width = "12px";
          el.style.height = "12px";
          el.style.borderRadius = "50%";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
          el.style.cursor = "pointer";

          if (index === 0) {
            el.style.backgroundColor = "#22c55e"; // Green
            el.style.width = "16px";
            el.style.height = "16px";
            el.style.zIndex = "10";
          } else if (index === vertices.length - 1) {
            el.style.backgroundColor = "#ef4444"; // Red
            el.style.width = "16px";
            el.style.height = "16px";
            el.style.zIndex = "10";
          } else {
            el.style.backgroundColor = "#3b82f6"; // Blue
          }

          new vietmapgl.Marker(el)
            .setLngLat([v.location.longitude, v.location.latitude])
            .setPopup(
              new vietmapgl.Popup({ offset: 25, closeButton: false }).setHTML(
                `<div style="font-size:12px; font-weight:600; padding:4px">${v.name}</div>`
              )
            )
            .addTo(map);
        });
      } catch (error) {
        console.error("Error drawing route:", error);
      }
    };

    drawRoute();
  }, [pathData, isMapLoaded]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
