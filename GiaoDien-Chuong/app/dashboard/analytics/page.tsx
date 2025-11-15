"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { api } from "@/lib/api";
import type { BusiestStation, VehicleUtilization } from "@/types";
import { Loader2 } from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#FF6B9D",
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [busiestStations, setBusiestStations] = useState<BusiestStation[]>([]);
  const [vehicleUtilization, setVehicleUtilization] =
    useState<VehicleUtilization | null>(null);
  const [routeCoverage, setRouteCoverage] = useState<any[]>([]);
  const [stationsByDistrict, setStationsByDistrict] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [busiestRes, utilizationRes, coverageRes, districtRes] =
        await Promise.all([
          api.getBusiestStations(10),
          api.getVehiclesUtilization(),
          api.getRouteCoverage(),
          api.getStationsByDistrict(),
        ]);

      if (busiestRes.success) {
        setBusiestStations(busiestRes.data);
      }

      if (utilizationRes.success) {
        setVehicleUtilization(utilizationRes.data);
      }

      if (coverageRes.success) {
        setRouteCoverage(coverageRes.data);
      }

      if (districtRes.success) {
        setStationsByDistrict(districtRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const monthlyPassengers = [
    { month: "T1", passengers: 1200000, revenue: 8400 },
    { month: "T2", passengers: 1180000, revenue: 8260 },
    { month: "T3", passengers: 1350000, revenue: 9450 },
    { month: "T4", passengers: 1280000, revenue: 8960 },
    { month: "T5", passengers: 1420000, revenue: 9940 },
    { month: "T6", passengers: 1380000, revenue: 9660 },
  ];

  const peakHours = [
    { hour: "5-6h", usage: 15 },
    { hour: "6-7h", usage: 45 },
    { hour: "7-8h", usage: 85 },
    { hour: "8-9h", usage: 70 },
    { hour: "9-10h", usage: 40 },
    { hour: "10-11h", usage: 30 },
    { hour: "11-12h", usage: 35 },
    { hour: "12-13h", usage: 40 },
    { hour: "13-14h", usage: 35 },
    { hour: "14-15h", usage: 30 },
    { hour: "15-16h", usage: 40 },
    { hour: "16-17h", usage: 60 },
    { hour: "17-18h", usage: 90 },
    { hour: "18-19h", usage: 75 },
    { hour: "19-20h", usage: 50 },
    { hour: "20-21h", usage: 30 },
    { hour: "21-22h", usage: 20 },
    { hour: "22-23h", usage: 10 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Thống kê & Phân tích
        </h2>
        <p className="text-muted-foreground">
          Báo cáo và phân tích hoạt động hệ thống
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="stations">Trạm xe</TabsTrigger>
          <TabsTrigger value="routes">Tuyến xe</TabsTrigger>
          <TabsTrigger value="vehicles">Phương tiện</TabsTrigger>
          <TabsTrigger value="time">Thời gian</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Passengers & Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Lượng khách & Doanh thu theo tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyPassengers}>
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
                      name="Doanh thu (tr VNĐ)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stations by District */}
            {stationsByDistrict.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Phân bố trạm theo quận</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stationsByDistrict.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="district"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Số trạm" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stations" className="space-y-4">
          {/* Busiest Stations */}
          {busiestStations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 trạm bận rộn nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={busiestStations.map((b) => ({
                      name: b.station.name,
                      routes: b.route_count,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="routes"
                      fill="#3b82f6"
                      name="Số tuyến đi qua"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          {/* Route Coverage */}
          {routeCoverage.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Độ phủ của tuyến</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={routeCoverage.slice(0, 10).map((r) => ({
                        name: `Tuyến ${r.route.route_code}`,
                        districts: r.districts_covered,
                        stops: r.total_stops,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="districts" fill="#3b82f6" name="Số quận" />
                      <Bar dataKey="stops" fill="#10b981" name="Số trạm" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết độ phủ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {routeCoverage.slice(0, 5).map((route, idx) => (
                      <div key={idx} className="border-b pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            Tuyến {route.route.route_code}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {route.districts_covered} quận, {route.total_stops}{" "}
                            trạm
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {route.districts.map(
                            (district: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                              >
                                {district}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          {/* Vehicle Utilization */}
          {vehicleUtilization && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tỷ lệ sử dụng phương tiện</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <span className="font-medium">Tổng số xe</span>
                      <span className="text-2xl font-bold">
                        {vehicleUtilization.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="font-medium">Đã phân công</span>
                      <span className="text-2xl font-bold text-green-600">
                        {vehicleUtilization.assigned}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <span className="font-medium">Chưa phân công</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {vehicleUtilization.unassigned}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="font-medium">Tỷ lệ sử dụng</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {vehicleUtilization.utilization_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phân bố theo trạng thái</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={vehicleUtilization.by_status}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {vehicleUtilization.by_status.map((entry, index) => (
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

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Phân bố theo loại xe</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vehicleUtilization.by_type}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name="Số lượng" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Mức độ sử dụng theo giờ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="usage"
                    fill="#3b82f6"
                    name="Mức độ sử dụng (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
