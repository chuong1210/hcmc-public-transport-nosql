"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Route, Users, TrendingUp } from "lucide-react";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStations: 0,
    totalRoutes: 0,
    activeRoutes: 0,
    totalUsers: 0,
  });

  const [stationsByType, setStationsByType] = useState<any[]>([]);
  const [routesByType, setRoutesByType] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stations
      const stationsRes = await api.getStations();
      if (stationsRes.success) {
        const stations = stationsRes.data;
        setStats((prev) => ({ ...prev, totalStations: stations.length }));

        // Group by type
        const typeCount: Record<string, number> = {};
        stations.forEach((station: any) => {
          typeCount[station.type] = (typeCount[station.type] || 0) + 1;
        });

        setStationsByType(
          Object.entries(typeCount).map(([name, value]) => ({ name, value }))
        );
      }

      // Fetch routes
      const routesRes = await api.getRoutes();
      if (routesRes.success) {
        const routes = routesRes.data;
        setStats((prev) => ({
          ...prev,
          totalRoutes: routes.length,
          activeRoutes: routes.filter((r: any) => r.status === "active").length,
        }));

        // Group by type
        const typeCount: Record<string, number> = {};
        routes.forEach((route: any) => {
          typeCount[route.type] = (typeCount[route.type] || 0) + 1;
        });

        setRoutesByType(
          Object.entries(typeCount).map(([name, value]) => ({ name, value }))
        );
      }

      // Fetch users (if admin)
      try {
        const usersRes = await api.getUsers();
        if (usersRes.success) {
          setStats((prev) => ({ ...prev, totalUsers: usersRes.data.length }));
        }
      } catch (error) {
        // User might not have permission
        console.log("No permission to fetch users");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const monthlyData = [
    { month: "T1", passengers: 1200000 },
    { month: "T2", passengers: 1180000 },
    { month: "T3", passengers: 1350000 },
    { month: "T4", passengers: 1280000 },
    { month: "T5", passengers: 1420000 },
    { month: "T6", passengers: 1380000 },
  ];

  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold">{stats.totalStations}</div>
            <p className="text-xs text-muted-foreground">Trên toàn thành phố</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tuyến xe buýt</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoutes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeRoutes} tuyến đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Quản trị viên & người dùng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lượt khách/tháng
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.38M</div>
            <p className="text-xs text-muted-foreground">
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Passengers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lượng hành khách theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="passengers"
                  stroke="#3b82f6"
                  name="Hành khách"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stations by Type */}
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
                  outerRadius={80}
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

        {/* Routes by Type */}
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
      </div>
    </div>
  );
}
