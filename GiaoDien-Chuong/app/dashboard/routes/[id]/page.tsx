"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BusRoute, Station } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface RouteStop {
  station_id: string;
  station_name: string;
  stop_order: number;
  arrival_offset: number;
  is_main_stop: boolean;
}

export default function RouteEditPage({ params }: { params: { id: string } }) {
  const [route, setRoute] = useState<BusRoute | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStopDialogOpen, setAddStopDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState("");
  const [arrivalOffset, setArrivalOffset] = useState(0);
  const [isMainStop, setIsMainStop] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [routeRes, stationsRes] = await Promise.all([
        api.getRoute(params.id),
        api.getStations({ status: "active" }),
      ]);

      if (routeRes.success) {
        setRoute(routeRes.data.route);

        // Format stops data
        if (routeRes.data.stations) {
          const formattedStops = routeRes.data.stations.map((s: any) => ({
            station_id: s.station.station_id,
            station_name: s.station.name,
            stop_order: s.stop_order,
            arrival_offset: s.arrival_offset || 0,
            is_main_stop: s.is_main_stop || false,
          }));
          setStops(
            formattedStops.sort(
              (a: { stop_order: number }, b: { stop_order: number }) =>
                a.stop_order - b.stop_order
            )
          );
        }
      }

      if (stationsRes.success) {
        setAllStations(stationsRes.data);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStop = async () => {
    if (!selectedStation) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn trạm",
        variant: "destructive",
      });
      return;
    }

    try {
      const station = allStations.find((s) => s.station_id === selectedStation);
      if (!station) return;

      // Add stop to route
      const response = await api.addStopToRoute(params.id, {
        station_id: selectedStation,
        stop_order: stops.length + 1,
        arrival_offset: arrivalOffset,
        is_main_stop: isMainStop,
      });

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã thêm trạm vào tuyến",
        });

        // Update local state
        setStops([
          ...stops,
          {
            station_id: selectedStation,
            station_name: station.name,
            stop_order: stops.length + 1,
            arrival_offset: arrivalOffset,
            is_main_stop: isMainStop,
          },
        ]);

        // Reset form
        setSelectedStation("");
        setArrivalOffset(0);
        setIsMainStop(false);
        setAddStopDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể thêm trạm",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStop = async (stationId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa trạm này khỏi tuyến?")) return;

    try {
      const response = await api.removeStopFromRoute(params.id, stationId);

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa trạm khỏi tuyến",
        });

        // Update local state and reorder
        const newStops = stops
          .filter((s) => s.station_id !== stationId)
          .map((s, idx) => ({ ...s, stop_order: idx + 1 }));

        setStops(newStops);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa trạm",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update stop_order
    const updatedStops = items.map((item, idx) => ({
      ...item,
      stop_order: idx + 1,
    }));

    setStops(updatedStops);

    // Save to backend
    try {
      await api.updateRouteStops(params.id, {
        stops: updatedStops.map((s) => ({
          station_id: s.station_id,
          stop_order: s.stop_order,
          arrival_offset: s.arrival_offset,
          is_main_stop: s.is_main_stop,
        })),
      });

      toast({
        title: "Thành công",
        description: "Đã cập nhật thứ tự trạm",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thứ tự",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/routes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Chỉnh sửa tuyến {route.route_code}
            </h2>
            <p className="text-muted-foreground">{route.route_name}</p>
          </div>
        </div>
      </div>

      {/* Basic Route Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add route basic info form fields here */}
          <p className="text-sm text-muted-foreground">
            Form chỉnh sửa thông tin cơ bản của tuyến (code, name, type, etc.)
          </p>
        </CardContent>
      </Card>

      {/* Route Stops Management - QUAN TRỌNG */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quản lý trạm dừng ({stops.length} trạm)</CardTitle>
            <Dialog
              open={addStopDialogOpen}
              onOpenChange={setAddStopDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm trạm
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm trạm vào tuyến</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Chọn trạm</Label>
                    <Select
                      value={selectedStation}
                      onValueChange={setSelectedStation}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạm" />
                      </SelectTrigger>
                      <SelectContent>
                        {allStations
                          .filter(
                            (s) =>
                              !stops.some(
                                (stop) => stop.station_id === s.station_id
                              )
                          )
                          .map((station) => (
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
                    <Label>Thời gian đến (phút)</Label>
                    <Input
                      type="number"
                      value={arrivalOffset}
                      onChange={(e) =>
                        setArrivalOffset(parseInt(e.target.value))
                      }
                      placeholder="Ví dụ: 15"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="main-stop"
                      checked={isMainStop}
                      onCheckedChange={(checked) =>
                        setIsMainStop(checked as boolean)
                      }
                    />
                    <label htmlFor="main-stop" className="text-sm font-medium">
                      Đây là trạm chính
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddStopDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleAddStop}>Thêm</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {stops.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="stops">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {stops.map((stop, index) => (
                      <Draggable
                        key={stop.station_id}
                        draggableId={stop.station_id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-4 p-4 border rounded-lg bg-white"
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                              {stop.stop_order}
                            </div>

                            <div className="flex-1">
                              <p className="font-medium">{stop.station_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Đến sau {stop.arrival_offset} phút
                                {stop.is_main_stop && " • Trạm chính"}
                              </p>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStop(stop.station_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Chưa có trạm nào. Nhấn "Thêm trạm" để bắt đầu.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/routes")}
        >
          Hủy
        </Button>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
