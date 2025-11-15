"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Route, Users, TrendingUp, Bus, Calendar } from "lucide-react";
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
import type { AnalyticsOverview, TypeCount, DistrictCount } from "@/types";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function DashboardPage() {
  const [overview, setOverview] = useState<AnalyticsOverview>({
    total_stations: 0,
    total_routes: 0,
    active_routes: 0,
    total_vehicles: 0,
    total_users: 0,
  });

  const [stationsByType, setStationsByType] = useState<TypeCount[]>([]);
  const [stationsByDistrict, setStationsByDistrict] = useState<DistrictCount[]>(
    []
  );
  const [routesByType, setRoutesByType] = useState<TypeCount[]>([]);
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

      // Fetch stations by district
      const stationsDistrictRes = await api.getStationsByDistrict();
      if (stationsDistrictRes.success) {
        // Take top 5 districts
        const top5 = stationsDistrictRes.data.slice(0, 5);
        const others = stationsDistrictRes.data.slice(5);
        const othersCount = others.reduce(
          (sum: number, item: any) => sum + item.count,
          0
        );

        const districtData = top5.map((item: any) => ({
          district: item.district,
          count: item.count,
        }));

        if (othersCount > 0) {
          districtData.push({ district: "Khác", count: othersCount });
        }

        setStationsByDistrict(districtData);
      }

      // Fetch routes by type
      const routesTypeRes = await api.getRoutesByType();
      if (routesTypeRes.success) {
        setRoutesByType(
          routesTypeRes.data.map((item: any) => ({
            name:
              item.type === "normal"
                ? "Thường"
                : item.type === "express"
                ? "Nhanh"
                : "Express",
            value: item.count,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for monthly passengers (thay bằng API thực nếu có)
  const monthlyData = [
    { month: "T1", passengers: 1200000, revenue: 8400 },
    { month: "T2", passengers: 1180000, revenue: 8260 },
    { month: "T3", passengers: 1350000, revenue: 9450 },
    { month: "T4", passengers: 1280000, revenue: 8960 },
    { month: "T5", passengers: 1420000, revenue: 9940 },
    { month: "T6", passengers: 1380000, revenue: 9660 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner" />
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
            <p className="text-xs text-muted-foreground">Trên toàn thành phố</p>
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
            <p className="text-xs text-muted-foreground">Đội xe buýt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_users}</div>
            <p className="text-xs text-muted-foreground">
              Quản trị viên & người dùng
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

        {/* Routes by Type */}
        {routesByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Phân loại tuyến xe buýt</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={routesByType}>
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

        {/* Stations by District */}
        {stationsByDistrict.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Phân bố trạm theo quận</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stationsByDistrict}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="district" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="Số trạm" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Passengers */}
        <Card>
          <CardHeader>
            <CardTitle>Lượng hành khách theo tháng</CardTitle>
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
                  dataKey="passengers"
                  stroke="#3b82f6"
                  name="Hành khách"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  name="Doanh thu (triệu VNĐ)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
