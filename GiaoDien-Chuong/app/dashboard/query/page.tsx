"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Play,
  Copy,
  Check,
  Search,
  Database,
  TrendingUp,
  Map,
  Info,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QueryCategory {
  name: string;
  icon: any;
  queries: QueryTemplate[];
}

interface QueryTemplate {
  name: string;
  query: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
}

const queryCategories: QueryCategory[] = [
  {
    name: "Cơ bản",
    icon: Database,
    queries: [
      {
        name: "Tất cả trạm",
        difficulty: "easy",
        query: `FOR station IN stations
  SORT station.name
  LIMIT 20
  RETURN {
    station_id: station.station_id,
    name: station.name,
    ward: station.address.ward,
    city: station.address.city,
    type: station.type,
    status: station.status
  }`,
        description: "Lấy danh sách 20 trạm đầu tiên",
      },
      {
        name: "Trạm theo phường",
        difficulty: "easy",
        query: `FOR station IN stations
  FILTER station.address.ward == "Phường Bến Thành"
  RETURN {
    name: station.name,
    street: station.address.street,
    type: station.type
  }`,
        description: "Tìm các trạm ở Phường Bến Thành",
      },
      {
        name: "Tuyến đang hoạt động",
        difficulty: "easy",
        query: `FOR route IN routes
  FILTER route.status == "active"
  SORT route.route_code
  RETURN {
    route_code: route.route_code,
    route_name: route.route_name,
    type: route.type,
    frequency: route.frequency,
    fare_adult: route.fare.adult
  }`,
        description: "Lấy danh sách các tuyến đang hoạt động",
      },
      {
        name: "Xe theo hãng",
        difficulty: "easy",
        query: `FOR vehicle IN vehicles
  FILTER vehicle.manufacturer == "Hyundai"
  RETURN {
    plate: vehicle.license_plate,
    type: vehicle.type,
    year: vehicle.year,
    capacity: vehicle.capacity,
    status: vehicle.status
  }`,
        description: "Tìm xe Hyundai",
      },
      {
        name: "Trạm có WiFi",
        difficulty: "easy",
        query: `FOR station IN stations
  FILTER station.facilities.wifi == true
  RETURN {
    name: station.name,
    ward: station.address.ward,
    has_toilet: station.facilities.toilet,
    has_atm: station.facilities.atm
  }`,
        description: "Trạm có tiện ích WiFi",
      },
    ],
  },
  {
    name: "Thống kê",
    icon: TrendingUp,
    queries: [
      {
        name: "Đếm trạm theo phường",
        difficulty: "medium",
        query: `FOR station IN stations
  COLLECT ward = station.address.ward WITH COUNT INTO total
  SORT total DESC
  LIMIT 15
  RETURN {
    ward: ward,
    count: total
  }`,
        description: "Thống kê số lượng trạm theo từng phường",
      },
      {
        name: "Đếm tuyến theo loại",
        difficulty: "easy",
        query: `LET total_routes = LENGTH(routes)
FOR route IN routes
  COLLECT type = route.type WITH COUNT INTO count
  RETURN {
    type: type,
    count: count,
    percentage: FLOOR((count / total_routes) * 100)
  }`,
        description: "Phân loại tuyến theo loại (normal/express/rapid)",
      },
      {
        name: "Xe theo năm sản xuất",
        difficulty: "medium",
        query: `FOR vehicle IN vehicles
  COLLECT year = vehicle.year WITH COUNT INTO total
  LET avg_capacity = (
    FOR v IN vehicles
      FILTER v.year == year
      RETURN v.capacity
  )
  SORT year DESC
  RETURN {
    year: year,
    count: total,
    avg_capacity: FLOOR(AVG(avg_capacity))
  }`,
        description: "Thống kê xe theo năm sản xuất",
      },
      {
        name: "Giá vé trung bình",
        difficulty: "medium",
        query: `FOR route IN routes
  COLLECT type = route.type
  AGGREGATE
    avg_adult = AVG(route.fare.adult),
    avg_student = AVG(route.fare.student),
    min_fare = MIN(route.fare.adult),
    max_fare = MAX(route.fare.adult)
  RETURN {
    type: type,
    avg_adult_fare: FLOOR(avg_adult),
    avg_student_fare: FLOOR(avg_student),
    min_fare: min_fare,
    max_fare: max_fare
  }`,
        description: "Thống kê giá vé theo loại tuyến",
      },
      {
        name: "Tỷ lệ xe có tiện ích",
        difficulty: "medium",
        query: `LET total = LENGTH(vehicles)
LET with_ac = LENGTH(
  FOR v IN vehicles
    FILTER v.features.air_conditioning == true
    RETURN 1
)
LET with_wifi = LENGTH(
  FOR v IN vehicles
    FILTER v.features.wifi == true
    RETURN 1
)
LET with_wheelchair = LENGTH(
  FOR v IN vehicles
    FILTER v.features.wheelchair_accessible == true
    RETURN 1
)
RETURN {
  total_vehicles: total,
  air_conditioning: {
    count: with_ac,
    percentage: FLOOR((with_ac / total) * 100)
  },
  wifi: {
    count: with_wifi,
    percentage: FLOOR((with_wifi / total) * 100)
  },
  wheelchair: {
    count: with_wheelchair,
    percentage: FLOOR((with_wheelchair / total) * 100)
  }
}`,
        description: "Tỷ lệ xe có các tiện ích",
      },
      {
        name: "Phân bố tuổi xe",
        difficulty: "medium",
        query: `LET current_year = 2025
LET total_vehicles = LENGTH(vehicles)
FOR vehicle IN vehicles
  LET age = current_year - vehicle.year
  COLLECT age_group = FLOOR(age / 5) * 5 WITH COUNT INTO count
  SORT age_group
  RETURN {
    age_range: CONCAT(age_group, "-", age_group + 4, " năm"),
    count: count,
    percentage: FLOOR((count / total_vehicles) * 100)
  }`,
        description: "Phân bố xe theo độ tuổi",
      },
    ],
  },
  {
    name: "Graph & Tuyến",
    icon: Map,
    queries: [
      {
        name: "Tuyến và số trạm",
        difficulty: "medium",
        query: `FOR route IN routes
  LET stations = (
    FOR v, e IN OUTBOUND route serves
      SORT e.stop_order
      RETURN v
  )
  SORT LENGTH(stations) DESC
  RETURN {
    route: route.route_code,
    name: route.route_name,
    total_stops: LENGTH(stations),
    first_station: stations[0].name,
    last_station: stations[-1].name,
    type: route.type
  }`,
        description: "Liệt kê tuyến với số lượng trạm và trạm đầu/cuối",
      },
      {
        name: "Chi tiết một tuyến",
        difficulty: "medium",
        query: `FOR route IN routes
  FILTER route.route_code == "01"
  LET stations = (
    FOR v, e IN OUTBOUND route serves
      SORT e.stop_order
      RETURN {
        order: e.stop_order,
        name: v.name,
        arrival: e.arrival_offset,
        is_main: e.is_main_stop
      }
  )
  LET vehicles = (
    FOR v, e IN INBOUND route operates_on
      RETURN {
        plate: v.license_plate,
        type: v.type,
        shift: e.shift
      }
  )
  RETURN {
    route: route.route_name,
    code: route.route_code,
    stations: stations,
    vehicles: vehicles,
    total_stops: LENGTH(stations),
    total_vehicles: LENGTH(vehicles)
  }`,
        description: "Chi tiết đầy đủ của tuyến 01",
      },
      {
        name: "Trạm bận rộn nhất",
        difficulty: "hard",
        query: `FOR station IN stations
  LET route_count = LENGTH(
    FOR route IN routes
      FOR v, e IN OUTBOUND route serves
        FILTER v._key == station._key
        RETURN 1
  )
  FILTER route_count > 0
  SORT route_count DESC
  LIMIT 15
  RETURN {
    station: station.name,
    ward: station.address.ward,
    type: station.type,
    routes_passing: route_count,
    has_wifi: station.facilities.wifi,
    has_toilet: station.facilities.toilet
  }`,
        description: "Top 15 trạm có nhiều tuyến đi qua",
      },
      {
        name: "Xe và tuyến phân công",
        difficulty: "medium",
        query: `FOR vehicle IN vehicles
  LET assigned_route = FIRST(
    FOR route, e IN OUTBOUND vehicle operates_on
      RETURN {
        route: route.route_code,
        name: route.route_name,
        shift: e.shift
      }
  )
  FILTER vehicle.status == "active"
  RETURN {
    vehicle: vehicle.license_plate,
    type: vehicle.type,
    year: vehicle.year,
    assigned_route: assigned_route != null ? assigned_route : "Chưa phân công"
  }`,
        description: "Xe hoạt động và tuyến được phân công",
      },
      {
        name: "Tuyến đi qua 2 trạm",
        difficulty: "hard",
        query: `// Tìm tuyến đi qua Bến Xe Miền Đông VÀ Chợ Bến Thành
LET station1_id = "ST001"  // Bến Xe Miền Đông
LET station2_id = "ST003"  // Chợ Bến Thành

FOR route IN routes
  // Lấy tất cả station_id của tuyến này
  LET station_ids = (
    FOR station IN OUTBOUND route serves
      RETURN station.station_id
  )
  
  // Kiểm tra có cả 2 trạm không
  LET has_station1 = station1_id IN station_ids
  LET has_station2 = station2_id IN station_ids
  
  FILTER has_station1 AND has_station2
  
  // Lấy chi tiết các trạm
  LET all_stops = (
    FOR station, edge IN OUTBOUND route serves
      SORT edge.stop_order
      RETURN {
        name: station.name,
        station_id: station.station_id,
        stop_order: edge.stop_order
      }
  )
  
  RETURN {
    route_code: route.route_code,
    route_name: route.route_name,
    type: route.type,
    total_stops: LENGTH(all_stops),
    all_stations: all_stops[*].name,
    status: route.status
  }`,
        description: "Tuyến đi qua cả Bến Xe Miền Đông và Chợ Bến Thành",
      },
      {
        name: "Độ phủ của tuyến",
        difficulty: "hard",
        query: `FOR route IN routes
  LET stations = (
    FOR v, e IN OUTBOUND route serves
      RETURN v
  )
  LET wards = UNIQUE(stations[*].address.ward)
  LET coverage_score = LENGTH(wards) * LENGTH(stations)
  SORT coverage_score DESC
  LIMIT 10
  RETURN {
    route: route.route_code,
    name: route.route_name,
    total_stops: LENGTH(stations),
    wards_covered: LENGTH(wards),
    coverage_score: coverage_score,
    wards: wards
  }`,
        description: "Top 10 tuyến có độ phủ cao nhất",
      },
    ],
  },
  {
    name: "Truy vấn nâng cao",
    icon: Search,
    queries: [
      {
        name: "Shortest Path",
        difficulty: "hard",
        query: `FOR start IN stations
  FILTER start.name == "Bến Xe Miền Đông"
  FOR end IN stations
    FILTER end.name == "Chợ Bến Thành"
    FOR v, e IN OUTBOUND SHORTEST_PATH start TO end connects
      RETURN {
        station: v.name,
        distance: e.distance,
        duration: e.duration
      }`,
        description: "Đường đi ngắn nhất giữa 2 trạm",
      },
      {
        name: "K Shortest Paths",
        difficulty: "hard",
        query: `FOR start IN stations
  FILTER start.name == "Sân Bay Tân Sơn Nhất"
  FOR end IN stations
    FILTER end.name == "Landmark 81"
    FOR path IN OUTBOUND K_SHORTEST_PATHS start TO end connects
      LIMIT 3
      LET total_distance = SUM(path.edges[*].distance)
      LET total_duration = SUM(path.edges[*].duration)
      RETURN {
        path_stations: path.vertices[*].name,
        total_distance: FLOOR(total_distance),
        total_duration: FLOOR(total_duration),
        stops: LENGTH(path.vertices)
      }`,
        description: "Top 3 đường đi ngắn nhất",
      },
      {
        name: "Trạm có thể đến được",
        difficulty: "hard",
        query: `FOR station IN stations
  FILTER station.name == "Chợ Bến Thành"
  FOR v, e, p IN 1..3 OUTBOUND station connects
    LIMIT 20
    RETURN DISTINCT {
      name: v.name,
      steps: LENGTH(p.edges),
      total_distance: SUM(p.edges[*].distance),
      total_duration: SUM(p.edges[*].duration)
    }`,
        description: "Các trạm có thể đến từ Bến Thành (tối đa 3 bước)",
      },
      {
        name: "Tìm trạm chuyển tiếp",
        difficulty: "hard",
        query: `LET route1_stations = (
  FOR route IN routes
    FILTER route.route_code == "01"
    FOR station, edge IN OUTBOUND route serves
      RETURN {
        station: station,
        stop_order: edge.stop_order
      }
)

LET route2_stations = (
  FOR route IN routes
    FILTER route.route_code == "09"
    FOR station, edge IN OUTBOUND route serves
      RETURN {
        station: station,
        stop_order: edge.stop_order
      }
)

FOR s1 IN route1_stations
  FOR s2 IN route2_stations
    FILTER s1.station.station_id == s2.station.station_id
    RETURN {
      transfer_station: s1.station.name,
      ward: s1.station.address.ward,
      route1_stop: s1.stop_order,
      route2_stop: s2.stop_order,
      facilities: s1.station.facilities
    }`,
        description: "Trạm chuyển tiếp giữa tuyến 01 và 09",
      },
      {
        name: "Phân tích lộ trình",
        difficulty: "hard",
        query: `FOR route IN routes
  LET stations = (
    FOR v, e IN OUTBOUND route serves
      SORT e.stop_order
      RETURN {
        name: v.name,
        order: e.stop_order,
        arrival: e.arrival_offset,
        is_main: e.is_main_stop
      }
  )
  
  FILTER LENGTH(stations) > 0
  
  LET total_duration = LENGTH(stations) > 0 ? MAX(stations[*].arrival) : 0
  
  LET main_stops = LENGTH(
    FOR s IN stations
      FILTER s.is_main == true
      RETURN 1
  )
  
  LET avg_time = total_duration > 0 && LENGTH(stations) > 0 
    ? total_duration / LENGTH(stations) 
    : 0
  
  FILTER LENGTH(stations) >= 5
  SORT LENGTH(stations) DESC
  LIMIT 15
  
  RETURN {
    route: route.route_code,
    name: route.route_name,
    type: route.type,
    total_stops: LENGTH(stations),
    main_stops: main_stops,
    total_duration: total_duration,
    avg_time_between_stops: FLOOR(avg_time),
    frequency: route.frequency,
    operating_hours: CONCAT(route.operating_hours.start, " - ", route.operating_hours.end),
    efficiency_score: total_duration > 0 ? FLOOR((LENGTH(stations) * 100) / total_duration) : 0
  }`,
        description: "Phân tích hiệu suất các tuyến có >5 trạm",
      },
      {
        name: "Xe cần bảo trì",
        difficulty: "medium",
        query: `LET current_year = 2025
FOR vehicle IN vehicles
  LET age = current_year - vehicle.year
  LET assigned_route = FIRST(
    FOR route IN OUTBOUND vehicle operates_on
      RETURN route.route_code
  )
  FILTER age >= 10 OR vehicle.status == "maintenance"
  SORT age DESC
  RETURN {
    plate: vehicle.license_plate,
    age: age,
    year: vehicle.year,
    status: vehicle.status,
    assigned_route: assigned_route,
    manufacturer: vehicle.manufacturer,
    mileage: vehicle.mileage
  }`,
        description: "Danh sách xe cần bảo trì (>10 năm)",
      },
      {
        name: "Phân tích tần suất",
        difficulty: "hard",
        query: `FOR route IN routes
  LET stations_count = LENGTH(
    FOR v IN OUTBOUND route serves
      RETURN 1
  )
  LET vehicles_assigned = LENGTH(
    FOR v IN INBOUND route operates_on
      RETURN 1
  )
  
  LET trips_per_hour = 60 / route.frequency
  LET daily_trips = trips_per_hour * 16
  LET required_vehicles = CEIL(daily_trips / 8)
  
  RETURN {
    route: route.route_code,
    name: route.route_name,
    frequency: route.frequency,
    trips_per_hour: trips_per_hour,
    daily_trips: daily_trips,
    vehicles_assigned: vehicles_assigned,
    vehicles_required: required_vehicles,
    is_adequate: vehicles_assigned >= required_vehicles,
    shortage: MAX([0, required_vehicles - vehicles_assigned])
  }`,
        description: "Phân tích tần suất và nhu cầu xe",
      },
      {
        name: "Truy vấn địa lý",
        difficulty: "hard",
        query: `LET center_lat = 10.7769
LET center_lng = 106.7009
LET radius = 2000

FOR station IN stations
  LET distance = DISTANCE(
    center_lat,
    center_lng,
    station.location.latitude,
    station.location.longitude
  )
  FILTER distance <= radius
  
  LET routes_here = (
    FOR route, e IN INBOUND station serves
      RETURN route.route_code
  )
  
  SORT distance
  LIMIT 15
  
  RETURN {
    name: station.name,
    ward: station.address.ward,
    distance_km: FLOOR(distance / 100) / 10,
    type: station.type,
    routes_count: LENGTH(routes_here),
    routes: routes_here,
    facilities: station.facilities
  }`,
        description: "Tìm trạm trong bán kính 2km từ trung tâm",
      },
      {
        name: "So sánh nhà vận hành",
        difficulty: "hard",
        query: `FOR route IN routes
  LET stops_count = LENGTH(FOR v IN OUTBOUND route serves RETURN 1)
  COLLECT operator = route.operator
  AGGREGATE
    total_routes = COUNT(),
    avg_frequency = AVG(route.frequency),
    avg_fare = AVG(route.fare.adult),
    total_stops = SUM(stops_count)
  
  LET avg_stops_per_route = total_stops / total_routes
  
  SORT total_routes DESC
  
  RETURN {
    operator: operator,
    total_routes: total_routes,
    avg_frequency: FLOOR(avg_frequency),
    avg_fare: FLOOR(avg_fare),
    avg_stops_per_route: FLOOR(avg_stops_per_route),
    efficiency_score: FLOOR((avg_stops_per_route * 10) / avg_frequency)
  }`,
        description: "So sánh hiệu suất các nhà vận hành",
      },
      {
        name: "Phân tích giờ cao điểm",
        difficulty: "hard",
        query: `FOR route IN routes
  LET peak_capacity_needed = CEIL((route.frequency / 10) * 1.5)
  LET current_vehicles = LENGTH(
    FOR v IN INBOUND route operates_on
      RETURN 1
  )
  LET total_capacity = current_vehicles * 80
  LET hourly_passengers = (60 / route.frequency) * total_capacity
  
  LIMIT 20
  RETURN {
    route: route.route_code,
    name: route.route_name,
    frequency: route.frequency,
    current_vehicles: current_vehicles,
    peak_vehicles_needed: peak_capacity_needed,
    total_capacity: total_capacity,
    hourly_capacity: hourly_passengers,
    is_sufficient: current_vehicles >= peak_capacity_needed,
    additional_needed: MAX([0, peak_capacity_needed - current_vehicles])
  }`,
        description: "Phân tích nhu cầu xe giờ cao điểm",
      },
    ],
  },
];

export default function QueryPage() {
  const [query, setQuery] = useState(queryCategories[0].queries[0].query);
  const [currentDescription, setCurrentDescription] = useState(
    queryCategories[0].queries[0].description
  );
  const [currentQueryName, setCurrentQueryName] = useState(
    queryCategories[0].queries[0].name
  );
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const { toast } = useToast();

  const handleSelectQuery = (q: QueryTemplate) => {
    setQuery(q.query);
    setCurrentDescription(q.description);
    setCurrentQueryName(q.name);
    setError(null);
    setResults([]);
  };

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
      const response = await axios.post(
        "http://localhost:5000/api/query/execute",
        { query: query },
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderTableFromResults = (data: any[]) => {
    if (data.length === 0) return null;

    const keys = Object.keys(data[0]);

    return (
      <div className="rounded-lg border border-sky-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-linear-to-r from-sky-50 to-cyan-50">
              {keys.map((key) => (
                <TableHead
                  key={key}
                  className="capitalize font-semibold text-sky-900"
                >
                  {key.replace(/_/g, " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow
                key={idx}
                className="hover:bg-sky-50/50 transition-colors"
              >
                {keys.map((key) => (
                  <TableCell key={key} className="font-mono text-sm">
                    {typeof row[key] === "object" ? (
                      <pre className="text-xs bg-gray-50 p-2 rounded max-w-md overflow-auto">
                        {JSON.stringify(row[key], null, 2)}
                      </pre>
                    ) : (
                      String(row[key])
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-3xl font-bold gradient-text-ocean">Truy vấn AQL</h2>
        <p className="text-muted-foreground">
          Thực hiện truy vấn ArangoDB Query Language trên database
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Query Templates Sidebar */}
        <div className="col-span-1 space-y-4">
          <Card className="glass-effect border-sky-200/50">
            <CardHeader>
              <CardTitle className="text-lg gradient-text-ocean">
                📚 Thư viện truy vấn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
              {queryCategories.map((category, catIdx) => {
                const Icon = category.icon;
                return (
                  <div key={catIdx}>
                    <Button
                      variant={
                        selectedCategory === catIdx ? "default" : "ghost"
                      }
                      className={`w-full justify-start mb-2 ${
                        selectedCategory === catIdx
                          ? "bg-linear-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30"
                          : "hover:bg-sky-50"
                      }`}
                      onClick={() => setSelectedCategory(catIdx)}
                    >
                      <Icon className="h-4 w-4 mr-2 shrink-0" />
                      <span className="flex-1 text-left">{category.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {category.queries.length}
                      </Badge>
                    </Button>

                    {selectedCategory === catIdx && (
                      <div className="space-y-1 ml-2 mt-2">
                        {category.queries.map((q, qIdx) => (
                          <Button
                            key={qIdx}
                            variant="ghost"
                            className="w-full justify-start text-left h-auto py-3 hover:bg-linear-to-r hover:from-sky-50 hover:to-cyan-50"
                            onClick={() => handleSelectQuery(q)}
                          >
                            <div className="flex flex-col items-start gap-1 w-full">
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="font-medium text-sm flex-1 min-w-0">
                                  {q.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs shrink-0 ${getDifficultyColor(
                                    q.difficulty
                                  )}`}
                                >
                                  {q.difficulty}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground line-clamp-2 w-full">
                                {q.description}
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="glass-effect border-sky-200/50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng truy vấn:</span>
                  <span className="font-bold text-sky-600">
                    {queryCategories.reduce(
                      (acc, cat) => acc + cat.queries.length,
                      0
                    )}
                  </span>
                </div>
                <Separator className="bg-sky-200/50" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Danh mục:</span>
                  <span className="font-bold text-cyan-600">
                    {queryCategories.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Query Editor & Results */}
        <div className="col-span-3 space-y-4">
          {/* Query Info Alert */}
          {currentQueryName && (
            <Alert className="glass-effect border-sky-200/50 bg-linear-to-r from-sky-50 to-cyan-50">
              <Info className="h-4 w-4 text-sky-600" />
              <AlertDescription>
                <span className="font-semibold text-sky-900">
                  {currentQueryName}:
                </span>{" "}
                <span className="text-sky-700">{currentDescription}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Editor Card */}
          <Card className="glass-effect border-sky-200/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="gradient-text-ocean">
                  ⚡ AQL Editor
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyQuery}
                    className="border-sky-200 hover:bg-sky-50"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRunQuery}
                    disabled={loading}
                    className="bg-linear-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg shadow-sky-500/30"
                  >
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
                rows={16}
                className="font-mono text-sm border-sky-200 focus:border-sky-500 bg-linear-to-br from-white to-sky-50/30"
                placeholder="Nhập truy vấn AQL..."
              />

              {error && (
                <div className="p-4 bg-linear-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-700">
                        Lỗi truy vấn
                      </p>
                      <p className="text-sm text-red-600 mt-1 wrap-break-words">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Card */}
          {results.length > 0 && (
            <Card className="glass-effect border-sky-200/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="gradient-text-ocean">
                    📊 Kết quả ({results.length}{" "}
                    {results.length === 1 ? "dòng" : "dòng"})
                  </CardTitle>
                  <Badge className="bg-linear-to-r from-sky-500 to-cyan-500 text-white">
                    Thành công
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table">
                  <TabsList className="bg-linear-to-r from-sky-100 to-cyan-100">
                    <TabsTrigger value="table">📋 Bảng</TabsTrigger>
                    <TabsTrigger value="json">💻 JSON</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="mt-4">
                    <div className="max-h-[600px] overflow-auto custom-scrollbar">
                      {renderTableFromResults(results)}
                    </div>
                  </TabsContent>
                  <TabsContent value="json" className="mt-4">
                    <pre className="bg-linear-to-br from-gray-900 to-gray-800 text-green-400 p-6 rounded-xl overflow-auto max-h-[600px] font-mono text-sm custom-scrollbar border border-sky-200">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && !error && (
            <Card className="glass-effect border-sky-200/50">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-sky-100 to-cyan-100 flex items-center justify-center">
                    <Database className="h-8 w-8 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sẵn sàng thực thi truy vấn
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Chọn một mẫu truy vấn hoặc viết truy vấn của riêng bạn
                    </p>
                  </div>
                  <Button
                    onClick={handleRunQuery}
                    disabled={!query.trim()}
                    className="bg-linear-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg shadow-sky-500/30"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Thực thi truy vấn
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
