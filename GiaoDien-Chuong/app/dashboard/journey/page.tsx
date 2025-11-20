"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Navigation,
  ArrowRight,
  Clock,
  MapPin,
  Bus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Station, JourneyPath } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JourneyMap } from "@/components/journey/journey-map";

export default function JourneyPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [journeys, setJourneys] = useState<JourneyPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStations, setLoadingStations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State lưu lộ trình đang chọn để hiển thị
  const [selectedJourney, setSelectedJourney] = useState<JourneyPath | null>(
    null
  );

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await api.getStations({ status: "active" });
      if (response.success) {
        setStations(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stations:", error);
    } finally {
      setLoadingStations(false);
    }
  };

  const handleSearch = async () => {
    if (!fromStation || !toStation) {
      setError("Vui lòng chọn điểm đi và điểm đến");
      return;
    }

    if (fromStation === toStation) {
      setError("Điểm đi và điểm đến không thể giống nhau");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedJourney(null);

    try {
      const response = await api.findShortestPath({
        from_station_id: fromStation,
        to_station_id: toStation,
      });

      if (response.success && response.data && response.data.length > 0) {
        setJourneys(response.data);
        setSelectedJourney(response.data[0]); // Mặc định chọn lộ trình đầu tiên
      } else {
        setJourneys([]);
        setError("Không tìm thấy lộ trình giữa hai trạm này");
      }
    } catch (error: any) {
      console.error("Failed to find journey:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Không thể tìm lộ trình. Vui lòng thử lại.";
      setError(errorMessage);
      setJourneys([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tìm lộ trình</h2>
        <p className="text-muted-foreground">
          Tìm đường đi tối ưu giữa các trạm xe buýt
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
        {/* CỘT TRÁI: Form & Danh sách (Cuộn dọc) */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full overflow-y-auto pr-2 pb-4 scrollbar-hide">
          {/* Search Form */}
          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Thông tin hành trình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingStations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase text-muted-foreground font-semibold">
                        Điểm đi
                      </Label>
                      <Select
                        value={fromStation}
                        onValueChange={setFromStation}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạm xuất phát" />
                        </SelectTrigger>
                        <SelectContent>
                          {stations.map((station) => (
                            <SelectItem
                              key={station.station_id}
                              value={station.station_id}
                            >
                              {station.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-center -my-2 relative z-10">
                      <div className="bg-background p-1 rounded-full border shadow-sm">
                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90 lg:rotate-90" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase text-muted-foreground font-semibold">
                        Điểm đến
                      </Label>
                      <Select value={toStation} onValueChange={setToStation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạm đích" />
                        </SelectTrigger>
                        <SelectContent>
                          {stations.map((station) => (
                            <SelectItem
                              key={station.station_id}
                              value={station.station_id}
                            >
                              {station.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSearch}
                    className="w-full"
                    disabled={loading || !fromStation || !toStation}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tính toán...
                      </>
                    ) : (
                      <>
                        <Navigation className="mr-2 h-4 w-4" />
                        Tìm lộ trình
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results List */}
          {!loading && journeys.length > 0 && (
            <div className="space-y-3 fade-in pb-10">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Kết quả ({journeys.length})
                </h3>
              </div>

              {journeys.map((journey, idx) => (
                <Card
                  key={idx}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedJourney === journey
                      ? "border-primary ring-1 ring-primary shadow-md"
                      : ""
                  }`}
                  onClick={() => setSelectedJourney(journey)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold">
                        Lộ trình #{idx + 1}
                      </CardTitle>
                      {idx === 0 && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                          Tối ưu nhất
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-4">
                    {/* Summary Stats */}
                    <div className="flex justify-between text-sm bg-muted/50 p-2.5 rounded-md border">
                      <div className="flex flex-col items-center gap-1 px-2 flex-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                          Khoảng cách
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatDistance(journey.total_distance)}
                        </span>
                      </div>
                      <Separator
                        orientation="vertical"
                        className="h-auto bg-gray-200"
                      />
                      <div className="flex flex-col items-center gap-1 px-2 flex-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                          Thời gian
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatDuration(journey.total_duration)}
                        </span>
                      </div>
                      <Separator
                        orientation="vertical"
                        className="h-auto bg-gray-200"
                      />
                      <div className="flex flex-col items-center gap-1 px-2 flex-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                          Trạm dừng
                        </span>
                        <span className="font-bold text-gray-900">
                          {journey.stops}
                        </span>
                      </div>
                    </div>

                    {/* Available Routes Info */}
                    {journey.routes && journey.routes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {journey.routes.map((routeInfo: any, i: number) =>
                          routeInfo && routeInfo.route ? (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="px-2 py-0.5 text-xs font-normal bg-blue-50 text-blue-700 border-blue-100"
                            >
                              <Bus className="w-3 h-3 mr-1" />
                              Tuyến {routeInfo.route.route_code}
                            </Badge>
                          ) : null
                        )}
                      </div>
                    )}

                    {/* CHI TIẾT TỪNG CHẶNG (GIAO DIỆN MỚI) */}
                    {selectedJourney === journey && (
                      <div className="mt-4 pt-4 border-t space-y-4 animate-in slide-in-from-top-2">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                          Chi tiết di chuyển:
                        </h4>

                        <div className="relative pl-2 space-y-0">
                          {journey.vertices.map((vertex, vIdx) => {
                            const isLast = vIdx === journey.vertices.length - 1;
                            // Lấy thông tin cạnh nối tới trạm tiếp theo
                            const nextEdge =
                              !isLast && journey.edges && journey.edges[vIdx];

                            return (
                              <div key={vIdx} className="relative pb-1">
                                {/* Dây nối dọc (Vertical Line) */}
                                {!isLast && (
                                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
                                )}

                                {/* ITEM TRẠM (Station Node) */}
                                <div className="flex gap-3 items-start mb-4">
                                  {/* Icon Marker */}
                                  <div className="relative z-10 mt-0.5 shrink-0">
                                    {vIdx === 0 ? (
                                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-green-100">
                                        <MapPin className="w-4 h-4 text-green-600 fill-green-600" />
                                      </div>
                                    ) : isLast ? (
                                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-red-100">
                                        <MapPin className="w-4 h-4 text-red-600 fill-red-600" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-gray-200 shadow-sm">
                                        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Thông tin trạm */}
                                  <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-start gap-2">
                                      <h5 className="text-sm font-semibold text-gray-900 leading-tight">
                                        {vertex.name}
                                      </h5>
                                      {vIdx === 0 && (
                                        <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 text-[10px] px-1.5 h-5 shrink-0">
                                          Xuất phát
                                        </Badge>
                                      )}
                                      {isLast && (
                                        <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 text-[10px] px-1.5 h-5 shrink-0">
                                          Đích đến
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                      {vertex.address.street}
                                    </p>
                                  </div>
                                </div>

                                {/* ITEM ĐOẠN ĐƯỜNG (Segment Info Box) */}
                                {!isLast && nextEdge && (
                                  <div className="ml-11 mb-6 pr-1">
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-center gap-4 shadow-sm">
                                      <div className="flex items-center gap-2 min-w-[110px]">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <Bus className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-gray-500 block uppercase font-medium">
                                            Khoảng cách
                                          </span>
                                          <span className="text-sm font-bold text-gray-900">
                                            {formatDistance(nextEdge.distance)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="h-8 w-px bg-blue-200/50" />
                                      <div>
                                        <span className="text-[10px] text-gray-500 block uppercase font-medium">
                                          Thời gian
                                        </span>
                                        <span className="text-sm text-gray-700 font-medium">
                                          {formatDuration(nextEdge.duration)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading &&
            journeys.length === 0 &&
            fromStation &&
            toStation &&
            !error && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Navigation className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">Không tìm thấy lộ trình</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                      Hiện tại chưa có tuyến xe buýt kết nối trực tiếp giữa hai
                      trạm này.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* CỘT PHẢI: Bản đồ (Cố định) */}
        <div className="lg:col-span-2 h-[400px] lg:h-full bg-gray-100 rounded-xl border shadow-sm overflow-hidden relative">
          {selectedJourney ? (
            <JourneyMap pathData={selectedJourney} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-gray-50/50">
              <MapPin className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">Chọn lộ trình để xem trên bản đồ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
