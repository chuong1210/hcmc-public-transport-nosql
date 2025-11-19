"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Bus, Wrench, Calendar, Check, X } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Vehicle } from "@/types";
import { getStatusColor } from "@/lib/utils";
import { format } from "date-fns";

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchVehicleDetail();
  }, [id]);

  const fetchVehicleDetail = async () => {
    try {
      const response = await api.getVehicle(id);
      if (response.success) {
        setVehicleData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle:", error);
      router.push("/dashboard/vehicles");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (!vehicleData || !vehicleData.vehicle) {
    return null;
  }

  const vehicle = vehicleData.vehicle;
  const currentRoute = vehicleData.current_route;

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bus_16: "16 chỗ",
      bus_40: "40 chỗ",
      bus_60: "60 chỗ",
    };
    return labels[type] || type;
  };

  const getFuelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      diesel: "Dầu diesel",
      cng: "CNG",
      electric: "Điện",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vehicles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {vehicle.license_plate}
            </h2>
            <p className="text-muted-foreground">
              {vehicle.manufacturer} {vehicle.model}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/vehicles/${id}`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(vehicle.status)}>
              {vehicle.status === "active"
                ? "Hoạt động"
                : vehicle.status === "maintenance"
                ? "Bảo trì"
                : "Ngừng hoạt động"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loại xe</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getVehicleTypeLabel(vehicle.type)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sức chứa</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicle.capacity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tình trạng</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {vehicle.condition === "good"
                ? "Tốt"
                : vehicle.condition === "fair"
                ? "Trung bình"
                : "Cần bảo trì"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin xe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Mã xe:</span>
              <span className="text-sm">{vehicle.vehicle_id}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Biển số:</span>
              <span className="text-sm font-mono">{vehicle.license_plate}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Hãng sản xuất:</span>
              <span className="text-sm">{vehicle.manufacturer}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Mẫu xe:</span>
              <span className="text-sm">{vehicle.model}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Năm sản xuất:</span>
              <span className="text-sm">{vehicle.year}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Loại nhiên liệu:</span>
              <span className="text-sm">
                {getFuelTypeLabel(vehicle.fuel_type)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiện nghi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">Điều hòa</span>
              {vehicle.features.air_conditioning ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">WiFi</span>
              {vehicle.features.wifi ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">Sạc USB</span>
              {vehicle.features.usb_charging ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">Hỗ trợ xe lăn</span>
              {vehicle.features.wheelchair_lift ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Phân công hiện tại</CardTitle>
        </CardHeader>
        <CardContent>
          {currentRoute ? (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">
                  Tuyến {currentRoute.route.route_code}:{" "}
                  {currentRoute.route.route_name}
                </h4>
                <Badge variant="outline">
                  Ca{" "}
                  {currentRoute.assignment.shift === "morning"
                    ? "sáng"
                    : currentRoute.assignment.shift === "afternoon"
                    ? "chiều"
                    : "tối"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Thời gian: {currentRoute.assignment.start_time} -{" "}
                {currentRoute.assignment.end_time}
              </p>
              <p className="text-sm text-muted-foreground">
                Ngày phân công:{" "}
                {format(
                  new Date(currentRoute.assignment.assignment_date),
                  "dd/MM/yyyy"
                )}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Xe chưa được phân công tuyến
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Bảo trì</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Bảo trì lần cuối</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {vehicle.last_maintenance
                  ? format(new Date(vehicle.last_maintenance), "dd/MM/yyyy")
                  : "Chưa có dữ liệu"}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Bảo trì tiếp theo</span>
              </div>
              <p className="text-lg font-bold text-orange-600">
                {vehicle.next_maintenance
                  ? format(new Date(vehicle.next_maintenance), "dd/MM/yyyy")
                  : "Chưa lên lịch"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
