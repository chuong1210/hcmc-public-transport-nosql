"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Route, Users, Bus, Activity } from "lucide-react";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  "#2563eb", // blue-600
  "#1d4ed8", // blue-700
  "#93c5fd", // blue-300
  "#0ea5e9", // sky-500
];

interface OverviewStats {
  total_stations: number;
  active_stations: number;
  total_routes: number;
  active_routes: number;
  total_vehicles: number;
  active_vehicles: number;
}

interface TypeCount {
  name: string;
  value: number;
}

interface WardCount {
  ward: string;
  city: string;
  count: number;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewStats>({
    total_stations: 0,
    active_stations: 0,
    total_routes: 0,
    active_routes: 0,
    total_vehicles: 0,
    active_vehicles: 0,
  });

  const [stationsByType, setStationsByType] = useState<TypeCount[]>([]);
  const [stationsByWard, setStationsByWard] = useState<WardCount[]>([]);
  const [vehiclesUtilization, setVehiclesUtilization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch overview
      const overviewRes = await api.getAnalyticsOverview();
      if (overviewRes.success) {
        setOverview(overviewRes.data);
      }

      // Fetch stations by type
      const stationsTypeRes = await api.getStationsByType();
      if (stationsTypeRes.success) {
        setStationsByType(
          stationsTypeRes.data.map((item: any) => ({
            name:
              item.type === "terminal"
                ? "Đầu cuối"
                : item.type === "intermediate"
                ? "Trung gian"
                : "Điểm dừng",
            value: item.count,
          }))
        );
      }

      // Fetch stations by ward
      const stationsWardRes = await api.getStationsByWard();
      if (stationsWardRes.success) {
        // Take top 10 wards
        const top10 = stationsWardRes.data.slice(0, 10);
        setStationsByWard(
          top10.map((item: any) => ({
            ward: item.ward,
            city: item.city,
            count: item.count,
          }))
        );
      }

      // Fetch vehicles utilization
      const vehiclesRes = await api.getVehiclesUtilization();
      if (vehiclesRes.success) {
        setVehiclesUtilization(vehiclesRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for monthly trends (có thể thêm API thực nếu cần)
  const monthlyData = [
    { month: "T1", trips: 4200, onTime: 92 },
    { month: "T2", trips: 4100, onTime: 90 },
    { month: "T3", trips: 4500, onTime: 94 },
    { month: "T4", trips: 4300, onTime: 91 },
    { month: "T5", trips: 4600, onTime: 95 },
    { month: "T6", trips: 4400, onTime: 93 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Tổng quan hệ thống quản lý xe buýt TP.HCM
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số trạm</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_stations}</div>
            <p className="text-xs text-muted-foreground">
              {overview.active_stations} trạm hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tuyến xe buýt</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_routes}</div>
            <p className="text-xs text-muted-foreground">
              {overview.active_routes} tuyến đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phương tiện</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_vehicles}</div>
            <p className="text-xs text-muted-foreground">
              {overview.active_vehicles} xe đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tỷ lệ sử dụng xe
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehiclesUtilization
                ? `${vehiclesUtilization.utilization_rate.toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {vehiclesUtilization?.assigned || 0}/
              {vehiclesUtilization?.total || 0} xe được phân công
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stations by Type */}
        {stationsByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Phân loại trạm xe buýt</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stationsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stationsByType.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Vehicles by Status */}
        {vehiclesUtilization && vehiclesUtilization.by_status && (
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái phương tiện</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vehiclesUtilization.by_status.map((item: any) => ({
                      name:
                        item.status === "active"
                          ? "Hoạt động"
                          : item.status === "maintenance"
                          ? "Bảo trì"
                          : "Ngừng hoạt động",
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {vehiclesUtilization.by_status.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Stations by Ward (Top 10) */}
        {stationsByWard.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top 10 Phường/Xã có nhiều trạm nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stationsByWard}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ward"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">
                              {payload[0].payload.ward}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payload[0].payload.city}
                            </p>
                            <p className="text-sm">
                              Số trạm:{" "}
                              <span className="font-bold">
                                {payload[0].value}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="Số trạm" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Vehicles by Type */}
        {vehiclesUtilization && vehiclesUtilization.by_type && (
          <Card>
            <CardHeader>
              <CardTitle>Phân loại phương tiện</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={vehiclesUtilization.by_type.map((item: any) => ({
                    name:
                      item.type === "bus_16"
                        ? "Xe 16 chỗ"
                        : item.type === "bus_40"
                        ? "Xe 40 chỗ"
                        : "Xe 60 chỗ",
                    value: item.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Số lượng" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trips Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng chuyến đi theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="trips"
                  stroke="#3b82f6"
                  name="Số chuyến"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="onTime"
                  stroke="#10b981"
                  name="Đúng giờ (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xe chưa phân công</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {vehiclesUtilization?.unassigned || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Xe đang sẵn sàng được phân công
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trạm trung tâm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stationsByType.find((s) => s.name === "Trung gian")?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Trạm trung gian trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tuyến nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {overview.active_routes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tuyến đang hoạt động tích cực
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
