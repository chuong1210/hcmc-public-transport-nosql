"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, Copy, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

const sampleQueries = [
  {
    name: "Tất cả trạm",
    query: `FOR station IN stations
  SORT station.name
  RETURN {
    station_id: station.station_id,
    name: station.name,
    district: station.address.district,
    type: station.type,
    status: station.status
  }`,
    description: "Lấy danh sách tất cả các trạm xe buýt",
  },
  {
    name: "Trạm theo quận",
    query: `FOR station IN stations
  FILTER station.address.district == "Quận 1"
  RETURN station`,
    description: "Tìm các trạm ở Quận 1",
  },
  {
    name: "Tuyến đang hoạt động",
    query: `FOR route IN routes
  FILTER route.status == "active"
  RETURN {
    route_code: route.route_code,
    route_name: route.route_name,
    type: route.type,
    fare: route.fare.adult
  }`,
    description: "Lấy danh sách các tuyến đang hoạt động",
  },
  {
    name: "Đếm trạm theo quận",
    query: `FOR station IN stations
  COLLECT district = station.address.district WITH COUNT INTO total
  SORT total DESC
  RETURN {
    district: district,
    count: total
  }`,
    description: "Thống kê số lượng trạm theo từng quận",
  },
  {
    name: "Tuyến và số trạm",
    query: `FOR route IN routes
  LET stations = (
    FOR v, e IN OUTBOUND route serves
      RETURN v
  )
  RETURN {
    route: route.route_code,
    name: route.route_name,
    total_stops: LENGTH(stations),
    stations: stations[*].name
  }`,
    description: "Liệt kê tuyến với số lượng trạm",
  },
  {
    name: "Shortest Path",
    query: `FOR v, e, p IN 1..10 OUTBOUND "stations/ST001" connects
  FILTER v._key == "ST002"
  LIMIT 1
  LET total_distance = SUM(p.edges[*].distance)
  LET total_duration = SUM(p.edges[*].duration)
  RETURN {
    path: p.vertices[*].name,
    distance: total_distance,
    duration: total_duration
  }`,
    description: "Tìm đường đi ngắn nhất giữa 2 trạm",
  },
  {
    name: "Trạm bận rộn nhất",
    query: `FOR station IN stations
  LET route_count = LENGTH(
    FOR route IN routes
      FOR v, e IN OUTBOUND route serves
        FILTER v._key == station._key
        RETURN 1
  )
  SORT route_count DESC
  LIMIT 10
  RETURN {
    station: station.name,
    district: station.address.district,
    routes_passing: route_count
  }`,
    description: "Top 10 trạm có nhiều tuyến đi qua nhất",
  },
  {
    name: "Xe và tuyến",
    query: `FOR vehicle IN vehicles
  LET assigned_route = FIRST(
    FOR route, e IN OUTBOUND vehicle operates_on
      RETURN {
        route: route.route_code,
        name: route.route_name,
        shift: e.shift
      }
  )
  RETURN {
    vehicle: vehicle.license_plate,
    type: vehicle.type,
    status: vehicle.status,
    assigned: assigned_route
  }`,
    description: "Danh sách xe và tuyến được phân công",
  },
];

export default function QueryPage() {
  const [query, setQuery] = useState(sampleQueries[0].query);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRunQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập truy vấn AQL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call backend API to execute query
      const response = await axios.post(
        "http://localhost:5000/api/query/execute",
        {
          query: query,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (response.data.success) {
        setResults(response.data.data);
        toast({
          title: "Thành công",
          description: `Truy vấn trả về ${response.data.data.length} kết quả`,
        });
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Lỗi khi thực thi truy vấn";
      setError(errorMessage);
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Đã sao chép",
      description: "Truy vấn đã được sao chép vào clipboard",
    });
  };

  const renderTableFromResults = (data: any[]) => {
    if (data.length === 0) return null;

    const keys = Object.keys(data[0]);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {keys.map((key) => (
              <TableHead key={key} className="capitalize">
                {key.replace(/_/g, " ")}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {keys.map((key) => (
                <TableCell key={key}>
                  {typeof row[key] === "object"
                    ? JSON.stringify(row[key])
                    : String(row[key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Truy vấn AQL</h2>
        <p className="text-muted-foreground">
          Thực hiện truy vấn ArangoDB Query Language trên database
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Query Templates */}
        <div className="col-span-1 space-y-2">
          <h3 className="font-semibold mb-4">Mẫu truy vấn</h3>
          <div className="space-y-2">
            {sampleQueries.map((sample, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => setQuery(sample.query)}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span className="font-medium">{sample.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {sample.description}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Query Editor & Results */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AQL Editor</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyQuery}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" onClick={handleRunQuery} disabled={loading}>
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Đang thực thi...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Thực thi truy vấn
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="Nhập truy vấn AQL..."
              />

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Kết quả ({results.length}{" "}
                  {results.length === 1 ? "dòng" : "dòng"})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table">
                  <TabsList>
                    <TabsTrigger value="table">Bảng</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="mt-4">
                    <div className="max-h-[600px] overflow-auto">
                      {renderTableFromResults(results)}
                    </div>
                  </TabsContent>
                  <TabsContent value="json" className="mt-4">
                    <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
