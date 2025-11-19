"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, MapPin, Clock, DollarSign, Bus } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BusRoute } from "@/types";
import { getStatusColor, getTypeColor } from "@/lib/utils";
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
  params: Promise<{ id: string }>;
}) {
  // Unwrap params Promise
  const { id } = use(params);

  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRouteDetail();
  }, [id]); // Now using unwrapped id

  const fetchRouteDetail = async () => {
    try {
      const response = await api.getRoute(id);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
        <Link href={`/dashboard/routes/${id}`}>
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
            <Badge className={getStatusColor(route.status)}>
              {route.status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loại tuyến</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Tần suất</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{route.frequency} phút</div>
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
              <span className="text-sm font-medium">Chiều:</span>
              <span className="text-sm">
                {route.direction === "two-way" ? "Hai chiều" : "Một chiều"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Nhà vận hành:</span>
              <span className="text-sm">{route.operator}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Giờ hoạt động & Giá vé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Giờ bắt đầu:</span>
              <span className="text-sm">{route.operating_hours?.start}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Giờ kết thúc:</span>
              <span className="text-sm">{route.operating_hours?.end}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Giá người lớn:</span>
              <span className="text-sm">
                {route.fare?.adult.toLocaleString()} VNĐ
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Giá học sinh:</span>
              <span className="text-sm">
                {route.fare?.student.toLocaleString()} VNĐ
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stations Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Lộ trình ({stations.length} trạm)</CardTitle>
        </CardHeader>
        <CardContent>
          {stations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Tên trạm</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Thời gian đến</TableHead>
                  <TableHead>Trạm chính</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {item.stop_order}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/stations/${item.station.station_id}/view`}
                        className="text-blue-600 hover:underline"
                      >
                        {item.station.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.station.address.street}, {item.station.address.ward}
                    </TableCell>
                    <TableCell>
                      {item.arrival_offset === 0 ? (
                        <Badge variant="outline">Xuất phát</Badge>
                      ) : (
                        <span className="text-sm">
                          +{item.arrival_offset} phút
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.is_main_stop && (
                        <Badge variant="secondary">Trạm chính</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Chưa có trạm nào trong lộ trình
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
