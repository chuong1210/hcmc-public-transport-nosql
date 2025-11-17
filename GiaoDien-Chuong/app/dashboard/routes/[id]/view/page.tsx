"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Clock,
  DollarSign,
  Route as RouteIcon,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BusRoute } from "@/types";
import {
  formatCurrency,
  formatDistance,
  getStatusColor,
  getTypeColor,
} from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RouteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRouteDetail();
  }, [params.id]);

  const fetchRouteDetail = async () => {
    try {
      const response = await api.getRoute(params.id);
      if (response.success) {
        setRouteData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch route:", error);
      router.push("/dashboard/routes");
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

  if (!routeData || !routeData.route) {
    return null;
  }

  const route = routeData.route;
  const stations = routeData.stations || [];

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
              Tuyến {route.route_code}
            </h2>
            <p className="text-muted-foreground">{route.route_name}</p>
          </div>
        </div>
        <Link href={`/dashboard/routes/${params.id}`}>
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
            <RouteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(route.status)}>
              {route.status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loại tuyến</CardTitle>
            <RouteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getTypeColor(route.type)}>
              {route.type === "normal"
                ? "Thường"
                : route.type === "express"
                ? "Nhanh"
                : "Express"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số trạm</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khoảng cách</CardTitle>
            <RouteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDistance(route.total_distance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin tuyến</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Mã tuyến:</span>
              <span className="text-sm">{route.route_code}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Tên tuyến:</span>
              <span className="text-sm">{route.route_name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Hướng:</span>
              <span className="text-sm">
                {route.direction === "two-way" ? "Hai chiều" : "Một chiều"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Nhà vận hành:</span>
              <span className="text-sm">{route.operator}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Thời gian hoạt động:</span>
              <span className="text-sm">
                {route.operating_hours.start} - {route.operating_hours.end}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Tần suất:</span>
              <span className="text-sm">{route.frequency} phút/chuyến</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Giá vé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Người lớn</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(route.fare.adult)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Sinh viên</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(route.fare.student)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium">Người cao tuổi</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(route.fare.senior)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stations List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách trạm dừng ({stations.length} trạm)</CardTitle>
        </CardHeader>
        <CardContent>
          {stations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Thứ tự</TableHead>
                  <TableHead>Tên trạm</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Thời gian đến</TableHead>
                  <TableHead>Trạm chính</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations
                  .sort((a: any, b: any) => a.stop_order - b.stop_order)
                  .map((stop: any) => (
                    <TableRow key={stop.stop_order}>
                      <TableCell className="font-medium">
                        #{stop.stop_order}
                      </TableCell>
                      <TableCell>{stop.station.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stop.station.address.street},{" "}
                        {stop.station.address.ward}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {stop.arrival_offset} phút
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {stop.is_main_stop ? (
                          <Badge variant="outline">Trạm chính</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Chưa có trạm dừng nào được cấu hình
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {route.description && (
        <Card>
          <CardHeader>
            <CardTitle>Mô tả</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{route.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
