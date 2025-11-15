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
  DollarSign,
  MapPin,
  Bus,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDistance, formatDuration } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Station, JourneyPath } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function JourneyPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [journeys, setJourneys] = useState<JourneyPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStations, setLoadingStations] = useState(true);

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
      return;
    }

    if (fromStation === toStation) {
      alert("Điểm đi và điểm đến không thể giống nhau");
      return;
    }

    setLoading(true);
    try {
      const response = await api.findShortestPath({
        from_station_id: fromStation,
        to_station_id: toStation,
      });

      if (response.success && response.data) {
        setJourneys(response.data);
      } else {
        setJourneys([]);
      }
    } catch (error) {
      console.error("Failed to find journey:", error);
      setJourneys([]);
    } finally {
      setLoading(false);
    }
  };

  const getStationName = (stationId: string) => {
    const station = stations.find((s) => s.station_id === stationId);
    return station?.name || stationId;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Lộ trình</h2>
        <p className="text-muted-foreground">
          Tìm đường đi tối ưu giữa các trạm xe buýt
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm lộ trình</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingStations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from">Điểm đi</Label>
                  <Select value={fromStation} onValueChange={setFromStation}>
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

                <div className="space-y-2">
                  <Label htmlFor="to">Điểm đến</Label>
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

              <Button
                onClick={handleSearch}
                className="w-full"
                disabled={loading || !fromStation || !toStation}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tìm...
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

      {/* Results */}
      {!loading && journeys.length > 0 && (
        <div className="space-y-4 fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Tìm thấy {journeys.length} lộ trình
            </h3>
            <span className="text-sm text-muted-foreground">
              Từ {getStationName(fromStation)} đến {getStationName(toStation)}
            </span>
          </div>

          {journeys.map((journey, idx) => (
            <Card key={idx} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Lộ trình #{idx + 1}</CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {journey.stops} điểm dừng
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Khoảng cách
                      </p>
                      <p className="font-semibold">
                        {formatDistance(journey.total_distance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Thời gian</p>
                      <p className="font-semibold">
                        {formatDuration(journey.total_duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Chi phí</p>
                      <p className="font-semibold">{formatCurrency(7000)}</p>
                    </div>
                  </div>
                </div>

                {/* Path Visualization */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Chi tiết lộ trình:</h4>

                  {journey.vertices.map((vertex, vIdx) => (
                    <div key={vIdx}>
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              vIdx === 0
                                ? "bg-green-100"
                                : vIdx === journey.vertices.length - 1
                                ? "bg-red-100"
                                : "bg-blue-100"
                            }`}
                          >
                            <MapPin
                              className={`h-5 w-5 ${
                                vIdx === 0
                                  ? "text-green-600"
                                  : vIdx === journey.vertices.length - 1
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                          {vIdx < journey.vertices.length - 1 && (
                            <div className="h-16 w-0.5 bg-border my-1" />
                          )}
                        </div>

                        <div className="flex-1 pt-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{vertex.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {vertex.address.street},{" "}
                                {vertex.address.district}
                              </p>
                            </div>
                            {vIdx === 0 && (
                              <Badge className="bg-green-100 text-green-700">
                                Xuất phát
                              </Badge>
                            )}
                            {vIdx === journey.vertices.length - 1 && (
                              <Badge className="bg-red-100 text-red-700">
                                Đích đến
                              </Badge>
                            )}
                          </div>

                          {/* Route information between stops */}
                          {vIdx < journey.edges.length &&
                            journey.routes &&
                            journey.routes[vIdx] && (
                              <div className="mt-3 p-3 bg-primary/5 rounded-md border border-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Bus className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm">
                                    Tuyến{" "}
                                    {journey.routes[vIdx].route.route_code}:{" "}
                                    {journey.routes[vIdx].route.route_name}
                                  </span>
                                </div>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>
                                    Khoảng cách:{" "}
                                    {formatDistance(
                                      journey.edges[vIdx].distance
                                    )}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Thời gian:{" "}
                                    {formatDuration(
                                      journey.edges[vIdx].duration
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Available Routes Info */}
                {journey.routes && journey.routes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-3">
                        Tuyến xe cần đi:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          ...new Set(
                            journey.routes.map((r) => r.route.route_code)
                          ),
                        ].map((code, i) => {
                          const route = journey.routes?.find(
                            (r) => r.route.route_code === code
                          )?.route;
                          return route ? (
                            <Badge
                              key={i}
                              variant="outline"
                              className="px-3 py-1"
                            >
                              Tuyến {route.route_code}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && journeys.length === 0 && fromStation && toStation && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Navigation className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="font-semibold">Không tìm thấy lộ trình</h3>
              <p className="text-sm text-muted-foreground">
                Không có tuyến xe buýt nào kết nối giữa hai trạm này
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
