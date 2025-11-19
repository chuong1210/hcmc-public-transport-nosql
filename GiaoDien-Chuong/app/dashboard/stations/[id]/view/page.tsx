"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Check,
  X,
  Bus,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Station } from "@/types";
import { getStatusColor, getTypeColor } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [stationData, setStationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStationDetail();
  }, [id]);

  const fetchStationDetail = async () => {
    try {
      const response = await api.getStation(id);
      if (response.success) {
        setStationData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch station:", error);
      router.push("/dashboard/stations");
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

  if (!stationData || !stationData.station) {
    return null;
  }

  const station = stationData.station;
  const routesPassingThrough = stationData.routes_passing_through || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {station.name}
            </h2>
            <p className="text-muted-foreground">
              {station.address.street}, {station.address.ward}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/stations/${id}`}>
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
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(station.status)}>
              {station.status === "active"
                ? "Hoạt động"
                : station.status === "maintenance"
                  ? "Bảo trì"
                  : "Ngừng hoạt động"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loại trạm</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getTypeColor(station.type)}>
              {station.type === "terminal"
                ? "Đầu cuối"
                : station.type === "intermediate"
                  ? "Trung gian"
                  : "Điểm dừng"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sức chứa</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{station.capacity} xe</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số tuyến đi qua
            </CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routesPassingThrough.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Station Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin trạm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Mã trạm:</span>
              <span className="text-sm">{station.station_id}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Tên trạm:</span>
              <span className="text-sm">{station.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Địa chỉ:</span>
              <span className="text-sm text-right">
                {station.address.street}, {station.address.ward},{" "}
                {station.address.city}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Tọa độ:</span>
              <span className="text-sm">
                {station.location.latitude}, {station.location.longitude}
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
              <span className="text-sm">Khu vực chờ</span>
              {station.facilities.waiting_area ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">WiFi</span>
              {station.facilities.wifi ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">Nhà vệ sinh</span>
              {station.facilities.toilet ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">ATM</span>
              {station.facilities.atm ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">Hỗ trợ xe lăn</span>
              {station.facilities.wheelchair_accessible ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes Passing Through - TÍNH NĂNG QUAN TRỌNG */}
      <Card>
        <CardHeader>
          <CardTitle>
            Các tuyến xe đi qua ({routesPassingThrough.length} tuyến)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routesPassingThrough.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã tuyến</TableHead>
                  <TableHead>Tên tuyến</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thứ tự dừng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routesPassingThrough.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {item.route.route_code}
                    </TableCell>
                    <TableCell>{item.route.route_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.route.type === "normal"
                          ? "Thường"
                          : item.route.type === "express"
                            ? "Nhanh"
                            : "Express"}
                      </Badge>
                    </TableCell>
                    <TableCell>#{item.stop_order}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.route.status)}>
                        {item.route.status === "active"
                          ? "Hoạt động"
                          : "Ngừng hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/routes/${item.route.route_id}/view`}
                      >
                        <Button variant="ghost" size="sm">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Chưa có tuyến nào đi qua trạm này
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
