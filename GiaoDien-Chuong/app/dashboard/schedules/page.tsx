"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, Trash2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import type { Schedule, BusRoute, Vehicle } from "@/types";
import { useToast } from "@/components/ui/use-toast";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Thứ 2" },
  { value: "tuesday", label: "Thứ 3" },
  { value: "wednesday", label: "Thứ 4" },
  { value: "thursday", label: "Thứ 5" },
  { value: "friday", label: "Thứ 6" },
  { value: "saturday", label: "Thứ 7" },
  { value: "sunday", label: "Chủ nhật" },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    route_id: "",
    vehicle_id: "",
    departure_time: "",
    shift: "morning" as "morning" | "afternoon" | "evening",
    day_of_week: [] as string[],
    driver_name: "",
    driver_license: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [schedulesRes, routesRes, vehiclesRes] = await Promise.all([
        api.getSchedules(),
        api.getRoutes({ status: "active" }),
        api.getVehicles({ status: "active" }),
      ]);

      if (schedulesRes.success) setSchedules(schedulesRes.data);
      if (routesRes.success) setRoutes(routesRes.data);
      if (vehiclesRes.success) setVehicles(vehiclesRes.data);
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

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      day_of_week: prev.day_of_week.includes(day)
        ? prev.day_of_week.filter((d) => d !== day)
        : [...prev.day_of_week, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.route_id ||
      !formData.vehicle_id ||
      !formData.departure_time ||
      formData.day_of_week.length === 0
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = {
        route_id: formData.route_id,
        vehicle_id: formData.vehicle_id,
        departure_time: formData.departure_time,
        shift: formData.shift,
        day_of_week: formData.day_of_week,
        driver: formData.driver_name
          ? {
              name: formData.driver_name,
              license_number: formData.driver_license,
            }
          : undefined,
      };

      const response = await api.createSchedule(data);

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã tạo lịch trình",
        });

        setDialogOpen(false);
        setFormData({
          route_id: "",
          vehicle_id: "",
          departure_time: "",
          shift: "morning",
          day_of_week: [],
          driver_name: "",
          driver_license: "",
        });

        fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể tạo lịch trình",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lịch trình này?")) return;

    try {
      const response = await api.deleteSchedule(scheduleId);

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa lịch trình",
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa lịch trình",
        variant: "destructive",
      });
    }
  };

  const getRouteName = (routeId: string) => {
    const route = routes.find((r) => r.route_id === routeId);
    return route ? `Tuyến ${route.route_code}` : routeId;
  };

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.vehicle_id === vehicleId);
    return vehicle?.license_plate || vehicleId;
  };

  const getDayLabel = (days: string[]) => {
    if (days.length === 7) return "Tất cả các ngày";
    if (
      days.length === 5 &&
      !days.includes("saturday") &&
      !days.includes("sunday")
    ) {
      return "Thứ 2 - Thứ 6";
    }
    return days
      .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
      .join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lịch trình</h2>
          <p className="text-muted-foreground">
            Quản lý lịch trình hoạt động của xe buýt
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm lịch trình
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Tạo lịch trình mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin lịch trình hoạt động
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tuyến xe *</Label>
                    <Select
                      value={formData.route_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, route_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tuyến" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem
                            key={route.route_id}
                            value={route.route_id}
                          >
                            Tuyến {route.route_code}: {route.route_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Phương tiện *</Label>
                    <Select
                      value={formData.vehicle_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, vehicle_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn xe" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem
                            key={vehicle.vehicle_id}
                            value={vehicle.vehicle_id}
                          >
                            {vehicle.license_plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giờ xuất phát *</Label>
                    <Input
                      type="time"
                      value={formData.departure_time}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          departure_time: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ca làm việc *</Label>
                    <Select
                      value={formData.shift}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, shift: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Ca sáng</SelectItem>
                        <SelectItem value="afternoon">Ca chiều</SelectItem>
                        <SelectItem value="evening">Ca tối</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ngày hoạt động *</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={day.value}
                          checked={formData.day_of_week.includes(day.value)}
                          onCheckedChange={() => handleDayToggle(day.value)}
                        />
                        <label
                          htmlFor={day.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên tài xế</Label>
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={formData.driver_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          driver_name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Số GPLX</Label>
                    <Input
                      placeholder="12345678"
                      value={formData.driver_license}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          driver_license: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">Tạo lịch trình</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch trình</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có lịch trình nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tuyến</TableHead>
                  <TableHead>Xe</TableHead>
                  <TableHead>Giờ xuất phát</TableHead>
                  <TableHead>Ca</TableHead>
                  <TableHead>Ngày hoạt động</TableHead>
                  <TableHead>Tài xế</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule._key}>
                    <TableCell className="font-medium">
                      {getRouteName(schedule.route_id)}
                    </TableCell>
                    <TableCell>
                      {getVehiclePlate(schedule.vehicle_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {schedule.departure_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {schedule.shift === "morning"
                          ? "Sáng"
                          : schedule.shift === "afternoon"
                          ? "Chiều"
                          : "Tối"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm">
                        {getDayLabel(schedule.day_of_week)}
                      </span>
                    </TableCell>
                    <TableCell>{schedule.driver?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          schedule.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : schedule.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          schedule._key && handleDelete(schedule._key)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
