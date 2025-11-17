from pyArango.connection import Connection
import os
from dotenv import load_dotenv
import json

load_dotenv()

def get_db():
    conn = Connection(
        arangoURL=os.getenv('ARANGO_HOST'),
        username=os.getenv('ARANGO_USERNAME'),
        password=os.getenv('ARANGO_PASSWORD')
    )
    return conn[os.getenv('ARANGO_DATABASE')]

print("=" * 80)
print("PHẦN 7A: TRUY VẤN CƠ BẢN")
print("=" * 80)

db = get_db()

# 1. CRUD - Read all stations
print("\n1. Lấy tất cả các trạm xe buýt:")
aql = """
FOR station IN stations
    SORT station.name
    RETURN {
        id: station.station_id,
        name: station.name,
        address: CONCAT(station.address.street, ", ", station.address.ward),
        type: station.type,
        status: station.status
    }
"""
result = db.AQLQuery(aql, rawResults=True)
stations = list(result)
print(f"   Tổng số trạm: {len(stations)}")
for s in stations[:5]:
    print(f"   - {s['name']} ({s['type']}) - {s['address']}")
print(f"   ... và {len(stations) - 5} trạm khác")

# 2. Filter - Active routes
print("\n2. Các tuyến xe đang hoạt động:")
aql = """
FOR route IN routes
    FILTER route.status == "active"
    RETURN {
        code: route.route_code,
        name: route.route_name,
        type: route.type,
        frequency: route.frequency
    }
"""
result = db.AQLQuery(aql, rawResults=True)
routes = list(result)
print(f"   Tổng số tuyến hoạt động: {len(routes)}")
for r in routes[:5]:
    print(f"   - Tuyến {r['code']}: {r['name']} ({r['type']}) - {r['frequency']} phút/chuyến")

# 3. Join - Routes with station count
print("\n3. Số lượng trạm của mỗi tuyến:")
aql = """
FOR route IN routes
    LET stations = (
        FOR v, e IN OUTBOUND route serves
            RETURN v
    )
    SORT LENGTH(stations) DESC
    RETURN {
        code: route.route_code,
        name: route.route_name,
        total_stops: LENGTH(stations)
    }
"""
result = db.AQLQuery(aql, rawResults=True)
routes_with_stops = list(result)
for r in routes_with_stops:
    print(f"   - Tuyến {r['code']}: {r['total_stops']} trạm")

# 4. Aggregate - Count by type
print("\n4. Thống kê trạm theo loại:")
aql = """
FOR station IN stations
    COLLECT type = station.type WITH COUNT INTO total
    RETURN {
        type: type,
        count: total
    }
"""
result = db.AQLQuery(aql, rawResults=True)
stats = list(result)
for s in stats:
    print(f"   - {s['type']}: {s['count']} trạm")

# 5. Group and aggregate - Vehicles by manufacturer
print("\n5. Số xe theo hãng sản xuất:")
aql = """
FOR vehicle IN vehicles
    COLLECT manufacturer = vehicle.manufacturer WITH COUNT INTO total
    SORT total DESC
    RETURN {
        manufacturer: manufacturer,
        count: total
    }
"""
result = db.AQLQuery(aql, rawResults=True)
manufacturers = list(result)
for m in manufacturers:
    print(f"   - {m['manufacturer']}: {m['count']} xe")

# 6. Filter with multiple conditions
print("\n6. Xe hoạt động có điều hòa và WiFi:")
aql = """
FOR vehicle IN vehicles
    FILTER vehicle.status == "active" 
        AND vehicle.features.air_conditioning == true
        AND vehicle.features.wifi == true
    RETURN {
        plate: vehicle.license_plate,
        type: vehicle.type,
        year: vehicle.year
    }
"""
result = db.AQLQuery(aql, rawResults=True)
vehicles = list(result)
print(f"   Tìm thấy {len(vehicles)} xe")
for v in vehicles[:5]:
    print(f"   - {v['plate']} ({v['type']}) - Năm {v['year']}")

# 7. Subquery - Routes passing through Ben Thanh
print("\n7. Tuyến đi qua Chợ Bến Thành:")
aql = """
FOR station IN stations
    FILTER station.name == "Chợ Bến Thành"
    FOR route, e IN INBOUND station serves
        RETURN {
            code: route.route_code,
            name: route.route_name,
            stop_order: e.stop_order
        }
"""
result = db.AQLQuery(aql, rawResults=True)
routes_through = list(result)
print(f"   Có {len(routes_through)} tuyến đi qua")
for r in routes_through:
    print(f"   - Tuyến {r['code']}: Dừng thứ {r['stop_order']}")

print("\n" + "=" * 80)
print("PHẦN 7B: TRUY VẤN NÂNG CAO (GRAPH)")
print("=" * 80)

# 1. Graph Traversal - Find all stations reachable from Mien Dong
print("\n1. Tất cả trạm có thể đến từ Bến Xe Miền Đông (trong 3 bước):")
aql = """
FOR station IN stations
    FILTER station.name == "Bến Xe Miền Đông"
    FOR v, e, p IN 1..3 OUTBOUND station connects
        RETURN DISTINCT {
            name: v.name,
            distance: SUM(p.edges[*].distance),
            duration: SUM(p.edges[*].duration)
        }
"""
result = db.AQLQuery(aql, rawResults=True)
reachable = list(result)
print(f"   Có thể đến {len(reachable)} trạm")
for r in reachable[:10]:
    print(f"   - {r['name']}: {r['distance']}m, {r['duration']} phút")

# 2. Shortest Path - From Mien Dong to Ben Thanh
print("\n2. Đường đi ngắn nhất từ Miền Đông đến Bến Thành:")
aql = """
FOR start IN stations
    FILTER start.name == "Bến Xe Miền Đông"
    FOR end IN stations
        FILTER end.name == "Chợ Bến Thành"
        FOR v, e IN OUTBOUND SHORTEST_PATH start TO end connects
            RETURN {
                station: v.name,
                distance: e.distance,
                duration: e.duration
            }
"""
result = db.AQLQuery(aql, rawResults=True)
path = list(result)
total_distance = sum([p['distance'] for p in path if p['distance']])
total_duration = sum([p['duration'] for p in path if p['duration']])
print(f"   Tổng khoảng cách: {total_distance}m")
print(f"   Tổng thời gian: {total_duration} phút")
print(f"   Lộ trình:")
for i, p in enumerate(path):
    print(f"   {i+1}. {p['station']}")

# 3. K Shortest Paths
print("\n3. Top 3 đường đi ngắn nhất từ Sân Bay đến Landmark:")
aql = """
FOR start IN stations
    FILTER start.name == "Sân Bay Tân Sơn Nhất"
    FOR end IN stations
        FILTER end.name == "Landmark 81"
        FOR path IN OUTBOUND K_SHORTEST_PATHS start TO end connects
            LIMIT 3
            LET total_distance = SUM(path.edges[*].distance)
            LET total_duration = SUM(path.edges[*].duration)
            RETURN {
                path: path.vertices[*].name,
                distance: total_distance,
                duration: total_duration,
                stops: LENGTH(path.vertices)
            }
"""
result = db.AQLQuery(aql, rawResults=True)
paths = list(result)
for i, p in enumerate(paths):
    print(f"\n   Lộ trình {i+1}:")
    print(f"   - Khoảng cách: {p['distance']}m")
    print(f"   - Thời gian: {p['duration']} phút")
    print(f"   - Số trạm: {p['stops']}")
    print(f"   - Đường đi: {' → '.join(p['path'])}")

# 4. Complex Join - Route details with all information
print("\n4. Chi tiết đầy đủ của Tuyến 01:")
aql = """
FOR route IN routes
    FILTER route.route_code == "01"
    LET stations = (
        FOR v, e IN OUTBOUND route serves
            SORT e.stop_order
            RETURN {
                name: v.name,
                order: e.stop_order,
                arrival: e.arrival_offset,
                main: e.is_main_stop
            }
    )
    LET assigned_vehicles = (
        FOR v, e IN INBOUND route operates_on
            RETURN {
                plate: v.license_plate,
                shift: e.shift
            }
    )
    RETURN {
        route: route.route_name,
        type: route.type,
        frequency: route.frequency,
        stations: stations,
        vehicles: assigned_vehicles
    }
"""
result = db.AQLQuery(aql, rawResults=True)
route_detail = list(result)[0]
print(f"   Tuyến: {route_detail['route']}")
print(f"   Loại: {route_detail['type']}")
print(f"   Tần suất: {route_detail['frequency']} phút")
print(f"\n   Danh sách trạm:")
for s in route_detail['stations']:
    main = " (TRẠM CHÍNH)" if s['main'] else ""
    print(f"   {s['order']}. {s['name']} - {s['arrival']} phút{main}")
print(f"\n   Xe được phân công:")
for v in route_detail['vehicles']:
    print(f"   - {v['plate']} (Ca {v['shift']})")

# 5. Top busiest stations
print("\n5. Top 10 trạm bận rộn nhất (nhiều tuyến đi qua):")
aql = """
FOR station IN stations
    LET route_count = LENGTH(
        FOR route IN routes
            FOR v, e IN OUTBOUND route serves
                FILTER v._key == station._key
                RETURN 1
    )
    SORT route_count DESC
    LIMIT 10
    RETURN {
        name: station.name,
        routes: route_count,
        type: station.type
    }
"""
result = db.AQLQuery(aql, rawResults=True)
busiest = list(result)
for i, s in enumerate(busiest):
    print(f"   {i+1}. {s['name']}: {s['routes']} tuyến ({s['type']})")

# 6. Vehicle utilization rate
print("\n6. Tỷ lệ sử dụng xe:")
aql = """
LET total = LENGTH(vehicles)
LET assigned = LENGTH(
    FOR v IN vehicles
        LET has_route = LENGTH(FOR r IN OUTBOUND v operates_on RETURN 1) > 0
        FILTER has_route
        RETURN 1
)
RETURN {
    total: total,
    assigned: assigned,
    unassigned: total - assigned,
    utilization_rate: (assigned / total) * 100
}
"""
result = db.AQLQuery(aql, rawResults=True)
util = list(result)[0]
print(f"   Tổng số xe: {util['total']}")
print(f"   Đã phân công: {util['assigned']}")
print(f"   Chưa phân công: {util['unassigned']}")
print(f"   Tỷ lệ sử dụng: {util['utilization_rate']:.2f}%")

# 7. Route coverage analysis
print("\n7. Phân tích độ phủ của các tuyến:")
aql = """
FOR route IN routes
    LET stations = (
        FOR v, e IN OUTBOUND route serves
            RETURN v
    )
    LET wards = UNIQUE(stations[*].address.ward)
    RETURN {
        code: route.route_code,
        name: route.route_name,
        total_stops: LENGTH(stations),
        wards_covered: LENGTH(wards),
        coverage_score: LENGTH(wards) * LENGTH(stations)
    }
"""
result = db.AQLQuery(aql, rawResults=True)
coverage = sorted(list(result), key=lambda x: x['coverage_score'], reverse=True)
for r in coverage[:10]:
    print(f"   Tuyến {r['code']}: {r['total_stops']} trạm, {r['wards_covered']} phường/xã (Score: {r['coverage_score']})")

# 8. Find alternative routes between two stations
print("\n8. Các tuyến có thể đi từ Bến Thành đến Landmark:")
aql = """
FOR start IN stations
    FILTER start.name == "Chợ Bến Thành"
    FOR end IN stations
        FILTER end.name == "Landmark 81"
        FOR route IN routes
            LET has_start = LENGTH(
                FOR v, e IN OUTBOUND route serves
                    FILTER v._key == start._key
                    RETURN 1
            ) > 0
            LET has_end = LENGTH(
                FOR v, e IN OUTBOUND route serves
                    FILTER v._key == end._key
                    RETURN 1
            ) > 0
            FILTER has_start AND has_end
            RETURN {
                code: route.route_code,
                name: route.route_name,
                type: route.type
            }
"""
result = db.AQLQuery(aql, rawResults=True)
alternative_routes = list(result)
if len(alternative_routes) > 0:
    print(f"   Tìm thấy {len(alternative_routes)} tuyến:")
    for r in alternative_routes:
        print(f"   - Tuyến {r['code']}: {r['name']} ({r['type']})")
else:
    print("   Không có tuyến trực tiếp. Cần đổi tuyến.")

print("\n" + "=" * 80)
print("✅ HOÀN THÀNH TẤT CẢ TRUY VẤN!")
print("=" * 80)