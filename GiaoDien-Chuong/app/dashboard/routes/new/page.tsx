"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Station } from "@/types";
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

// Định nghĩa kiểu dữ liệu local cho Stop khi tạo mới
interface RouteStop {
  id: string; // ID tạm thời để dùng cho key và drag-drop
  station_id: string;
  station_name: string;
  stop_order: number;
  arrival_offset: number;
  is_main_stop: boolean;
}

export default function NewRoutePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form Data State
  const [formData, setFormData] = useState({
    route_code: "",
    route_name: "",
    type: "normal",
    direction: "two-way",
    operating_hours: {
      start: "05:00",
      end: "22:00",
    },
    frequency: 10,
    fare: { adult: 7000, student: 3500, senior: 3500 },
    operator: "SAMCO",
    status: "active",
    description: "",
    total_distance: 0,
    estimated_duration: 0,
  });

  // Stops & Stations State
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog State
  const [addStopDialogOpen, setAddStopDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState("");
  const [arrivalOffset, setArrivalOffset] = useState(0);
  const [isMainStop, setIsMainStop] = useState(false);

  // Load danh sách trạm khi vào trang
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await api.getStations({ status: "active" });
        if (res.success) {
          setAllStations(res.data);
        }
      } catch (error) {
        console.error("Failed to load stations", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách trạm",
          variant: "destructive",
        })
      } finally {
        setLoadingStations(false);
      }
    };
    fetchStations();
  }, []);

  // Xử lý thêm trạm vào danh sách tạm (Local State)
  const handleAddStop = () => {
    if (!selectedStation) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn trạm",
        variant: "destructive",
      });
      return;
    }

    const stationInfo = allStations.find((s) => s.station_id === selectedStation);
    if (!stationInfo) return;

    // Kiểm tra trùng lặp
    if (stops.some((s) => s.station_id === selectedStation)) {
      toast({
        title: "Trùng lặp",
        description: "Trạm này đã có trong lộ trình",
        variant: "destructive",
      });
      return;
    }

    const newStop: RouteStop = {
      id: `temp-${Date.now()}`, // Tạo ID tạm
      station_id: selectedStation,
      station_name: stationInfo.name,
      stop_order: stops.length + 1,
      arrival_offset: arrivalOffset,
      is_main_stop: isMainStop,
    };

    setStops([...stops, newStop]);

    // Reset form dialog
    setSelectedStation("");
    setArrivalOffset(0);
    setIsMainStop(false);
    setAddStopDialogOpen(false);

    toast({ title: "Đã thêm", description: "Đã thêm trạm vào danh sách chờ" });
  };

  // Xử lý xóa trạm khỏi danh sách tạm
  const handleRemoveStop = (tempId: string) => {
    const newStops = stops
      .filter((s) => s.id !== tempId)
      .map((s, idx) => ({ ...s, stop_order: idx + 1 })); // Cập nhật lại thứ tự
    setStops(newStops);
  };

  // Xử lý kéo thả
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Cập nhật lại stop_order
    const updatedStops = items.map((item, idx) => ({
      ...item,
      stop_order: idx + 1,
    }));

    setStops(updatedStops);
  };

  // Xử lý Submit tổng (Tạo Route -> Thêm Stops)
  const handleCreateRoute = async () => {
    // Validate cơ bản
    if (!formData.route_code || !formData.route_name) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập mã và tên tuyến", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Tạo tuyến xe
      const createRes = await api.createRoute(formData);

      if (!createRes.success) {
        throw new Error(createRes.error || "Lỗi khi tạo tuyến");
      }

      const newRouteId = createRes.data.route_id; // Giả sử API trả về ID của tuyến mới tạo

      // 2. Nếu có trạm dừng, gọi API thêm từng trạm vào tuyến mới
      if (stops.length > 0 && newRouteId) {
        // Cách 1: Gọi loop (nếu API không hỗ trợ bulk create stops)
        // Lưu ý: Nên xử lý Promise.all để nhanh hơn
        const stopPromises = stops.map(stop =>
          api.addStopToRoute(newRouteId, {
            station_id: stop.station_id,
            stop_order: stop.stop_order,
            arrival_offset: stop.arrival_offset,
            is_main_stop: stop.is_main_stop
          })
        );

        await Promise.all(stopPromises);
      }

      toast({
        title: "Thành công",
        description: "Đã tạo tuyến mới và cập nhật lộ trình",
      });

      router.push("/dashboard/routes");

    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || error.response?.data?.error || "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingStations) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/routes">
            <Button variant="ghost" size="icon" className="hover:bg-sky-50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold gradient-text-ocean">
              Thêm tuyến mới
            </h2>
            <p className="text-muted-foreground">Nhập thông tin và cấu hình lộ trình</p>
          </div>
        </div>
      </div>

      {/* Basic Route Information */}
      <Card className="glass-effect border-sky-200/50">
        <CardHeader>
          <CardTitle className="gradient-text-ocean">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="route_code">Mã tuyến (Số hiệu) *</Label>
              <Input
                id="route_code"
                value={formData.route_code}
                onChange={(e) =>
                  setFormData({ ...formData, route_code: e.target.value })
                }
                placeholder="VD: 01, 150"
                className="border-sky-200 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="route_name">Tên tuyến *</Label>
              <Input
                id="route_name"
                value={formData.route_name}
                onChange={(e) =>
                  setFormData({ ...formData, route_name: e.target.value })
                }
                placeholder="Bến Xe Miền Đông - Chợ Lớn"
                className="border-sky-200 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Loại tuyến *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="border-sky-200 focus:border-sky-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Thường</SelectItem>
                  <SelectItem value="express">Nhanh</SelectItem>
                  <SelectItem value="rapid">Express</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Chiều hoạt động *</Label>
              <Select
                value={formData.direction}
                onValueChange={(value) =>
                  setFormData({ ...formData, direction: value })
                }
              >
                <SelectTrigger className="border-sky-200 focus:border-sky-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="two-way">Hai chiều</SelectItem>
                  <SelectItem value="one-way">Một chiều</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator">Nhà vận hành *</Label>
              <Input
                id="operator"
                value={formData.operator}
                onChange={(e) =>
                  setFormData({ ...formData, operator: e.target.value })
                }
                placeholder="SAMCO"
                className="border-sky-200 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Tần suất (phút) *</Label>
              <Input
                id="frequency"
                type="number"
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="10"
                className="border-sky-200 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Tổng khoảng cách (km)</Label>
              <Input
                id="distance"
                type="number"
                value={formData.total_distance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_distance: parseFloat(e.target.value) || 0,
                  })
                }
                className="border-sky-200 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Thời gian ước tính (phút)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimated_duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_duration: parseInt(e.target.value) || 0,
                  })
                }
                className="border-sky-200 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="border-sky-200 focus:border-sky-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-sky-700">Giờ hoạt động</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Giờ bắt đầu *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.operating_hours.start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operating_hours: {
                        ...formData.operating_hours,
                        start: e.target.value,
                      },
                    })
                  }
                  className="border-sky-200 focus:border-sky-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Giờ kết thúc *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.operating_hours.end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operating_hours: {
                        ...formData.operating_hours,
                        end: e.target.value,
                      },
                    })
                  }
                  className="border-sky-200 focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Fare */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-sky-700">Giá vé (VNĐ)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fare_adult">Người lớn *</Label>
                <Input
                  id="fare_adult"
                  type="number"
                  value={formData.fare.adult}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fare: {
                        ...formData.fare,
                        adult: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="border-sky-200 focus:border-sky-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fare_student">Học sinh *</Label>
                <Input
                  id="fare_student"
                  type="number"
                  value={formData.fare.student}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fare: {
                        ...formData.fare,
                        student: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="border-sky-200 focus:border-sky-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fare_senior">Người cao tuổi *</Label>
                <Input
                  id="fare_senior"
                  type="number"
                  value={formData.fare.senior}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fare: {
                        ...formData.fare,
                        senior: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="border-sky-200 focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Nhập mô tả về tuyến xe..."
              rows={4}
              className="border-sky-200 focus:border-sky-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Route Stops Management */}
      <Card className="glass-effect border-sky-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="gradient-text-ocean">
              Cấu hình trạm dừng ({stops.length} trạm)
            </CardTitle>
            <Dialog
              open={addStopDialogOpen}
              onOpenChange={setAddStopDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg shadow-sky-500/30">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm trạm
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-sky-200/50">
                <DialogHeader>
                  <DialogTitle className="gradient-text-ocean">
                    Thêm trạm vào lộ trình
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Chọn trạm</Label>
                    <Select
                      value={selectedStation}
                      onValueChange={setSelectedStation}
                    >
                      <SelectTrigger className="border-sky-200 focus:border-sky-500">
                        <SelectValue placeholder="Tìm kiếm hoặc chọn trạm..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
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
                              {station.name} ({station.station_id})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Thời gian di chuyển từ trạm trước (phút)</Label>
                    <Input
                      type="number"
                      value={arrivalOffset}
                      onChange={(e) =>
                        setArrivalOffset(parseInt(e.target.value) || 0)
                      }
                      placeholder="Ví dụ: 15"
                      className="border-sky-200 focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2 rounded-lg border border-sky-200 p-4 hover:bg-sky-50/50">
                    <Checkbox
                      id="main-stop"
                      checked={isMainStop}
                      onCheckedChange={(checked) =>
                        setIsMainStop(checked as boolean)
                      }
                    />
                    <label
                      htmlFor="main-stop"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Đây là trạm chính (Terminal/Hub)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddStopDialogOpen(false)}
                    className="border-sky-200 hover:bg-sky-50"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleAddStop}
                    className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
                  >
                    Thêm vào danh sách
                  </Button>
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
                        key={stop.id}
                        draggableId={stop.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${snapshot.isDragging
                                ? "bg-gradient-to-r from-sky-50 to-cyan-50 shadow-lg shadow-sky-500/30 scale-105"
                                : "bg-white border border-sky-200 hover:border-sky-300"
                              }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-sky-400 hover:text-sky-600 cursor-grab" />
                            </div>

                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white font-bold shadow-lg shadow-sky-500/30">
                              {stop.stop_order}
                            </div>

                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {stop.station_name}
                              </p>
                              <p className="text-sm text-sky-600">
                                +{stop.arrival_offset} phút
                                {stop.is_main_stop && " • ⭐ Trạm chính"}
                              </p>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStop(stop.id)}
                              className="hover:bg-red-50 hover:text-red-600 transition-colors"
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
            <div className="text-center py-12 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl border-2 border-dashed border-sky-300">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <p className="text-sky-700 font-medium">
                  Chưa có trạm nào trong lộ trình
                </p>
                <p className="text-sm text-sky-600">
                  Nhấn "Thêm trạm" để bắt đầu xây dựng lộ trình
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pb-10">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/routes")}
          className="border-sky-200 hover:bg-sky-50"
        >
          Hủy
        </Button>
        <Button
          onClick={handleCreateRoute}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg shadow-sky-500/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Tạo tuyến mới
            </>
          )}
        </Button>
      </div>
    </div>
  );
}