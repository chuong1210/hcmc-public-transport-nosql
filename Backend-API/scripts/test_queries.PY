from pyArango.connection import Connection
import os
from dotenv import load_dotenv
import json
from datetime import datetime

load_dotenv()

def get_db():
    """Get database connection"""
    conn = Connection(
        arangoURL=os.getenv('ARANGO_HOST'),
        username=os.getenv('ARANGO_USERNAME'),
        password=os.getenv('ARANGO_PASSWORD')
    )
    return conn[os.getenv('ARANGO_DATABASE')]

def print_section(title):
    """Print section header"""
    print("\n" + "=" * 80)
    print(f" {title}")
    print("=" * 80)

def print_subsection(title):
    """Print subsection header"""
    print(f"\n📋 {title}")
    print("-" * 80)

# ============================================================================
# PHẦN 1: TRUY VẤN CƠ BẢN
# ============================================================================

def test_basic_queries():
    """Test basic CRUD and filter queries"""
    print_section("PHẦN 1: TRUY VẤN CƠ BẢN")
    db = get_db()
    
    # 1. Read all stations
    print_subsection("1. Lấy tất cả các trạm xe buýt")
    aql = """
    FOR station IN stations
        SORT station.name
        LIMIT 10
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
    print(f"✅ Tìm thấy {len(stations)} trạm (hiển thị 10 đầu tiên)")
    for s in stations:
        print(f"   • {s['name']} ({s['type']}) - {s['address']}")
    
    # 2. Filter - Active routes
    print_subsection("2. Các tuyến xe đang hoạt động")
    aql = """
    FOR route IN routes
        FILTER route.status == "active"
        SORT route.route_code
        RETURN {
            code: route.route_code,
            name: route.route_name,
            type: route.type,
            frequency: route.frequency
        }
    """
    result = db.AQLQuery(aql, rawResults=True)
    routes = list(result)
    print(f"✅ Tổng số tuyến hoạt động: {len(routes)}")
    for r in routes[:5]:
        print(f"   • Tuyến {r['code']}: {r['name']} ({r['type']}) - {r['frequency']} phút/chuyến")
    
    # 3. Count by type
    print_subsection("3. Thống kê trạm theo loại")
    aql = """
    FOR station IN stations
        COLLECT type = station.type WITH COUNT INTO total
        SORT total DESC
        RETURN {
            type: type,
            count: total
        }
    """
    result = db.AQLQuery(aql, rawResults=True)
    stats = list(result)
    for s in stats:
        type_label = {
            'terminal': 'Bến xe đầu cuối',
            'intermediate': 'Trạm trung gian',
            'stop': 'Điểm dừng'
        }.get(s['type'], s['type'])
        print(f"   • {type_label}: {s['count']} trạm")
    
    # 4. Vehicles by manufacturer
    print_subsection("4. Số xe theo hãng sản xuất")
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
        print(f"   • {m['manufacturer']}: {m['count']} xe")
    
    # 5. Complex filter
    print_subsection("5. Xe hoạt động có điều hòa và WiFi")
    aql = """
    FOR vehicle IN vehicles
        FILTER vehicle.status == "active" 
            AND vehicle.features.air_conditioning == true
            AND vehicle.features.wifi == true
        RETURN {
            plate: vehicle.license_plate,
            type: vehicle.type,
            year: vehicle.year,
            capacity: vehicle.capacity
        }
    """
    result = db.AQLQuery(aql, rawResults=True)
    vehicles = list(result)
    print(f"✅ Tìm thấy {len(vehicles)} xe")
    for v in vehicles[:5]:
        print(f"   • {v['plate']} ({v['type']}) - Năm {v['year']} - {v['capacity']} chỗ")


# ============================================================================
# PHẦN 2: TRUY VẤN GRAPH CƠ BẢN
# ============================================================================

def test_graph_basic():
    """Test basic graph queries"""
    print_section("PHẦN 2: TRUY VẤN GRAPH CƠ BẢN")
    db = get_db()
    
    # 1. Routes with station count
    print_subsection("1. Số lượng trạm của mỗi tuyến")
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
    for r in routes_with_stops[:10]:
        print(f"   • Tuyến {r['code']}: {r['total_stops']} trạm")
    
    # 2. Find routes at a station
    print_subsection("2. Tìm tuyến đi qua một trạm")
    station_name = "Chợ Bến Thành"
    aql = """
    FOR station IN stations
        FILTER station.name == @station_name
        FOR route, e IN INBOUND station serves
            SORT e.stop_order
            RETURN {
                code: route.route_code,
                name: route.route_name,
                stop_order: e.stop_order,
                arrival: e.arrival_offset
            }
    """
    result = db.AQLQuery(aql, bindVars={'station_name': station_name}, rawResults=True)
    routes_through = list(result)
    print(f"✅ Có {len(routes_through)} tuyến đi qua {station_name}")
    for r in routes_through[:5]:
        print(f"   • Tuyến {r['code']}: Dừng thứ {r['stop_order']} (+{r['arrival']} phút)")
    
    # 3. Top busiest stations
    print_subsection("3. Top 10 trạm bận rộn nhất")
    aql = """
    FOR station IN stations
        LET route_count = LENGTH(
            FOR route IN routes
                FOR v, e IN OUTBOUND route serves
                    FILTER v._key == station._key
                    RETURN 1
        )
        FILTER route_count > 0
        SORT route_count DESC
        LIMIT 10
        RETURN {
            name: station.name,
            routes: route_count,
            type: station.type,
            location: station.address.ward
        }
    """
    result = db.AQLQuery(aql, rawResults=True)
    busiest = list(result)
    for i, s in enumerate(busiest, 1):
        print(f"   {i:2d}. {s['name']}: {s['routes']} tuyến ({s['location']})")
    
    # 4. Vehicle utilization
    print_subsection("4. Tỷ lệ sử dụng xe")
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
    print(f"   • Tổng số xe: {util['total']}")
    print(f"   • Đã phân công: {util['assigned']}")
    print(f"   • Chưa phân công: {util['unassigned']}")
    print(f"   • Tỷ lệ sử dụng: {util['utilization_rate']:.2f}%")


# ============================================================================
# PHẦN 3: TRUY VẤN GRAPH NÂNG CAO
# ============================================================================

def test_graph_advanced():
    """Test advanced graph queries"""
    print_section("PHẦN 3: TRUY VẤN GRAPH NÂNG CAO")
    db = get_db()
    
    # 1. Graph traversal
    print_subsection("1. Các trạm có thể đến từ một trạm (trong 3 bước)")
    start_station = "Bến Xe Miền Đông"
    aql = """
    FOR station IN stations
        FILTER station.name == @start_station
        FOR v, e, p IN 1..3 OUTBOUND station connects
            RETURN DISTINCT {
                name: v.name,
                steps: LENGTH(p.edges),
                distance: SUM(p.edges[*].distance),
                duration: SUM(p.edges[*].duration)
            }
    """
    result = db.AQLQuery(aql, bindVars={'start_station': start_station}, rawResults=True)
    reachable = list(result)
    print(f"✅ Từ {start_station} có thể đến {len(reachable)} trạm")
    for r in reachable[:10]:
        print(f"   • {r['name']}: {r['distance']:.0f}m, {r['duration']:.0f} phút ({r['steps']} bước)")
    
    # 2. Shortest path
    print_subsection("2. Đường đi ngắn nhất giữa 2 trạm")
    start = "Bến Xe Miền Đông"
    end = "Chợ Bến Thành"
    aql = """
    FOR start IN stations
        FILTER start.name == @start
        FOR end_station IN stations
            FILTER end_station.name == @end
            LET path = (
                FOR v, e IN OUTBOUND SHORTEST_PATH start TO end_station connects
                    RETURN {
                        station: v.name,
                        distance: e.distance,
                        duration: e.duration
                    }
            )
            FILTER LENGTH(path) > 0
            RETURN {
                path: path,
                total_distance: SUM(path[*].distance),
                total_duration: SUM(path[*].duration)
            }
    """
    result = db.AQLQuery(aql, bindVars={'start': start, 'end': end}, rawResults=True)
    paths = list(result)
    
    if paths:
        path_data = paths[0]
        print(f"✅ Tìm thấy đường đi từ {start} đến {end}")
        print(f"   • Khoảng cách: {path_data['total_distance']:.0f}m")
        print(f"   • Thời gian: {path_data['total_duration']:.0f} phút")
        print(f"   • Lộ trình:")
        for i, p in enumerate(path_data['path'], 1):
            print(f"      {i}. {p['station']}")
    else:
        print(f"❌ Không tìm thấy đường đi trực tiếp")
    
    # 3. K Shortest Paths
    print_subsection("3. Top 3 đường đi ngắn nhất")
    start = "Sân Bay Tân Sơn Nhất"
    end = "Landmark 81"
    aql = """
    FOR start IN stations
        FILTER start.name == @start
        FOR end_station IN stations
            FILTER end_station.name == @end
            FOR path IN OUTBOUND K_SHORTEST_PATHS start TO end_station connects
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
    result = db.AQLQuery(aql, bindVars={'start': start, 'end': end}, rawResults=True)
    k_paths = list(result)
    
    if k_paths:
        print(f"✅ Tìm thấy {len(k_paths)} lộ trình từ {start} đến {end}")
        for i, p in enumerate(k_paths, 1):
            print(f"\n   Lộ trình {i}:")
            print(f"   • Khoảng cách: {p['distance']:.0f}m")
            print(f"   • Thời gian: {p['duration']:.0f} phút")
            print(f"   • Số trạm: {p['stops']}")
            print(f"   • Đường đi: {' → '.join(p['path'][:3])} ... {p['path'][-1]}")
    else:
        print(f"❌ Không tìm thấy đường đi")


# ============================================================================
# PHẦN 4: TRUY VẤN PHỨC TẠP
# ============================================================================

def test_complex_queries():
    """Test complex business queries"""
    print_section("PHẦN 4: TRUY VẤN PHỨC TẠP")
    db = get_db()
    
    # 1. Complete route details
    print_subsection("1. Chi tiết đầy đủ của một tuyến")
    route_code = "01"
    aql = """
    FOR route IN routes
        FILTER route.route_code == @route_code
        LET stations = (
            FOR v, e IN OUTBOUND route serves
                SORT e.stop_order
                RETURN {
                    name: v.name,
                    order: e.stop_order,
                    arrival: e.arrival_offset,
                    main: e.is_main_stop,
                    type: v.type
                }
        )
        LET assigned_vehicles = (
            FOR v, e IN INBOUND route operates_on
                RETURN {
                    plate: v.license_plate,
                    shift: e.shift,
                    type: v.type
                }
        )
        RETURN {
            route: route.route_name,
            code: route.route_code,
            type: route.type,
            frequency: route.frequency,
            fare: route.fare,
            stations: stations,
            vehicles: assigned_vehicles
        }
    """
    result = db.AQLQuery(aql, bindVars={'route_code': route_code}, rawResults=True)
    
    if result:
        route_detail = list(result)[0]
        print(f"✅ Tuyến {route_detail['code']}: {route_detail['route']}")
        print(f"   • Loại: {route_detail['type']}")
        print(f"   • Tần suất: {route_detail['frequency']} phút")
        print(f"   • Giá vé: {route_detail['fare']['adult']:,}đ (người lớn)")
        
        print(f"\n   📍 Danh sách trạm ({len(route_detail['stations'])} trạm):")
        for s in route_detail['stations'][:10]:
            main = " ⭐" if s['main'] else ""
            print(f"      {s['order']:2d}. {s['name']} (+{s['arrival']}'){main}")
        
        print(f"\n   🚌 Xe được phân công ({len(route_detail['vehicles'])} xe):")
        for v in route_detail['vehicles'][:5]:
            print(f"      • {v['plate']} ({v['type']}) - Ca {v['shift']}")
    else:
        print(f"❌ Không tìm thấy tuyến {route_code}")
    
    # 2. Route coverage analysis
    print_subsection("2. Phân tích độ phủ của các tuyến")
    aql = """
    FOR route IN routes
        LET stations = (
            FOR v, e IN OUTBOUND route serves
                RETURN v
        )
        LET wards = UNIQUE(stations[*].address.ward)
        LET coverage_score = LENGTH(wards) * LENGTH(stations)
        SORT coverage_score DESC
        LIMIT 10
        RETURN {
            code: route.route_code,
            name: route.route_name,
            total_stops: LENGTH(stations),
            wards_covered: LENGTH(wards),
            coverage_score: coverage_score
        }
    """
    result = db.AQLQuery(aql, rawResults=True)
    coverage = list(result)
    
    print(f"✅ Top 10 tuyến có độ phủ cao nhất:")
    for i, r in enumerate(coverage, 1):
        print(f"   {i:2d}. Tuyến {r['code']}: {r['total_stops']} trạm, {r['wards_covered']} phường (Score: {r['coverage_score']})")
    
    # 3. Find alternative routes
    print_subsection("3. Tìm các tuyến thay thế")
    start = "Chợ Bến Thành"
    end = "Landmark 81"
    aql = """
    FOR start IN stations
        FILTER start.name == @start
        FOR end_station IN stations
            FILTER end_station.name == @end
            FOR route IN routes
                LET has_start = LENGTH(
                    FOR v, e IN OUTBOUND route serves
                        FILTER v._key == start._key
                        RETURN 1
                ) > 0
                LET has_end = LENGTH(
                    FOR v, e IN OUTBOUND route serves
                        FILTER v._key == end_station._key
                        RETURN 1
                ) > 0
                FILTER has_start AND has_end
                RETURN {
                    code: route.route_code,
                    name: route.route_name,
                    type: route.type,
                    frequency: route.frequency
                }
    """
    result = db.AQLQuery(aql, bindVars={'start': start, 'end': end}, rawResults=True)
    alternative_routes = list(result)
    
    if alternative_routes:
        print(f"✅ Tìm thấy {len(alternative_routes)} tuyến trực tiếp từ {start} đến {end}:")
        for r in alternative_routes:
            print(f"   • Tuyến {r['code']}: {r['name']} ({r['type']}) - {r['frequency']}'/chuyến")
    else:
        print(f"⚠️  Không có tuyến trực tiếp. Cần đổi tuyến.")


# ============================================================================
# PHẦN 5: JOURNEY PLANNING QUERIES
# ============================================================================

def test_journey_queries():
    """Test journey planning specific queries"""
    print_section("PHẦN 5: JOURNEY PLANNING QUERIES")
    db = get_db()
    
    # 1. Find routes at a specific station
    print_subsection("1. Tìm tuyến đi qua một trạm cụ thể")
    station_id = "ST001"
    aql = """
    LET station = FIRST(
        FOR s IN stations
            FILTER s.station_id == @station_id
            RETURN s
    )
    
    FOR route, edge IN INBOUND station serves
        FILTER route.status == "active"
        
        LET all_stops = (
            FOR v, e IN OUTBOUND route serves
                SORT e.stop_order
                RETURN {
                    station_name: v.name,
                    stop_order: e.stop_order
                }
        )
        
        RETURN {
            route_code: route.route_code,
            route_name: route.route_name,
            stop_order: edge.stop_order,
            total_stops: LENGTH(all_stops),
            is_main_stop: edge.is_main_stop
        }
    """
    result = db.AQLQuery(aql, bindVars={'station_id': station_id}, rawResults=True)
    routes_at_station = list(result)
    
    if routes_at_station:
        print(f"✅ Tìm thấy {len(routes_at_station)} tuyến đi qua trạm {station_id}:")
        for r in routes_at_station:
            main = " ⭐" if r['is_main_stop'] else ""
            print(f"   • Tuyến {r['route_code']}: Dừng {r['stop_order']}/{r['total_stops']}{main}")
    else:
        print(f"⚠️  Không có tuyến nào đi qua trạm này")
    
    # 2. Find transfer stations between two routes
    print_subsection("2. Tìm trạm chuyển tiếp giữa 2 tuyến")
    route1_code = "01"
    route2_code = "09"
    aql = """
    LET route1_stations = (
        FOR route IN routes
            FILTER route.route_code == @route1_code
            FOR station, edge IN OUTBOUND route serves
                RETURN {
                    station: station,
                    stop_order: edge.stop_order
                }
    )
    
    LET route2_stations = (
        FOR route IN routes
            FILTER route.route_code == @route2_code
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
                station: s1.station,
                route1_stop: s1.stop_order,
                route2_stop: s2.stop_order
            }
    """
    result = db.AQLQuery(aql, bindVars={
        'route1_code': route1_code,
        'route2_code': route2_code
    }, rawResults=True)
    transfer_stations = list(result)
    
    if transfer_stations:
        print(f"✅ Tìm thấy {len(transfer_stations)} trạm chuyển tiếp:")
        for t in transfer_stations:
            print(f"   • {t['station']['name']}")
            print(f"     - Tuyến {route1_code}: Trạm thứ {t['route1_stop']}")
            print(f"     - Tuyến {route2_code}: Trạm thứ {t['route2_stop']}")
    else:
        print(f"⚠️  Không có trạm chuyển tiếp chung")
    
    # 3. Find nearby stations
    print_subsection("3. Tìm trạm gần một tọa độ")
    lat, lng = 10.7769, 106.7009  # Trung tâm Sài Gòn
    radius = 2  # km
    aql = """
    FOR station IN stations
        LET distance = DISTANCE(
            station.location.latitude,
            station.location.longitude,
            @lat,
            @lng
        ) / 1000
        FILTER distance <= @radius
        SORT distance
        LIMIT 10
        RETURN {
            name: station.name,
            distance: distance,
            address: CONCAT(station.address.street, ", ", station.address.ward),
            type: station.type
        }
    """
    result = db.AQLQuery(aql, bindVars={
        'lat': lat,
        'lng': lng,
        'radius': radius
    }, rawResults=True)
    nearby = list(result)
    
    print(f"✅ Tìm thấy {len(nearby)} trạm trong bán kính {radius}km:")
    for s in nearby:
        print(f"   • {s['name']}: {s['distance']:.2f}km ({s['type']})")


# ============================================================================
# PHẦN 6: STATISTICS & ANALYTICS
# ============================================================================

def test_analytics_queries():
    """Test analytics and statistics queries"""
    print_section("PHẦN 6: STATISTICS & ANALYTICS")
    db = get_db()
    
    # 1. Overall statistics
    print_subsection("1. Thống kê tổng quan hệ thống")
    aql = """
    RETURN {
        total_stations: LENGTH(stations),
        total_routes: LENGTH(routes),
        total_vehicles: LENGTH(vehicles),
        active_routes: LENGTH(FOR r IN routes FILTER r.status == "active" RETURN 1),
        active_vehicles: LENGTH(FOR v IN vehicles FILTER v.status == "active" RETURN 1),
        total_connections: LENGTH(connects),
        total_serves: LENGTH(serves)
    }
    """
    result = db.AQLQuery(aql, rawResults=True)
    stats = list(result)[0]
    
    print(f"✅ Thống kê tổng quan:")
    print(f"   • Tổng số trạm: {stats['total_stations']}")
    print(f"   • Tổng số tuyến: {stats['total_routes']} (Hoạt động: {stats['active_routes']})")
    print(f"   • Tổng số xe: {stats['total_vehicles']} (Hoạt động: {stats['active_vehicles']})")
    print(f"   • Kết nối giữa trạm: {stats['total_connections']}")
    print(f"   • Tuyến-Trạm: {stats['total_serves']}")
    
    # 2. Routes by type
    print_subsection("2. Phân loại tuyến theo loại")
    aql = """
    FOR route IN routes
        COLLECT type = route.type WITH COUNT INTO total
        RETURN {
            type: type,
            count: total,
            percentage: (total / LENGTH(routes)) * 100
        }
    """
    result = db.AQLQuery(aql, rawResults=True)
    route_types = list(result)
    
    for rt in route_types:
        type_label = {
            'normal': 'Thường',
            'express': 'Nhanh',
            'rapid': 'Express'
        }.get(rt['type'], rt['type'])
        print(f"   • {type_label}: {rt['count']} tuyến ({rt['percentage']:.1f}%)")
    
    # 3. Vehicle age distribution
    print_subsection("3. Phân bố tuổi xe")
    current_year = datetime.now().year
    aql = """
    FOR vehicle IN vehicles
        LET age = @current_year - vehicle.year
        COLLECT age_group = FLOOR(age / 5) * 5 WITH COUNT INTO total
        SORT age_group
        RETURN {
            age_range: CONCAT(age_group, "-", age_group + 4, " năm"),
            count: total
        }
    """
    result = db.AQLQuery(aql, bindVars={'current_year': current_year}, rawResults=True)
    age_dist = list(result)
    
    for ad in age_dist:
        print(f"   • {ad['age_range']}: {ad['count']} xe")
    
    # 4. Average route metrics
    print_subsection("4. Chỉ số trung bình của tuyến")
    aql = """
    FOR route IN routes
        LET stops_count = LENGTH(FOR v IN OUTBOUND route serves RETURN 1)
        COLLECT AGGREGATE
            avg_stops = AVG(stops_count),
            min_stops = MIN(stops_count),
            max_stops = MAX(stops_count),
            avg_frequency = AVG(route.frequency),
            avg_fare = AVG(route.fare.adult)
        RETURN {
            avg_stops: avg_stops,
            min_stops: min_stops,
            max_stops: max_stops,
            avg_frequency: avg_frequency,
            avg_fare: avg_fare
        }
    """
    result = db.AQLQuery(aql, rawResults=True)
    metrics = list(result)[0]
    
    print(f"   • Số trạm trung bình: {metrics['avg_stops']:.1f}")
    print(f"   • Số trạm ít nhất: {metrics['min_stops']}")
    print(f"   • Số trạm nhiều nhất: {metrics['max_stops']}")
    print(f"   • Tần suất trung bình: {metrics['avg_frequency']:.1f} phút")
    print(f"   • Giá vé trung bình: {metrics['avg_fare']:,.0f}đ")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Run all test queries"""
    print("\n")
    print("🚌" * 40)
    print(" " * 20 + "BUS MANAGEMENT SYSTEM")
    print(" " * 20 + "TEST QUERIES")
    print("🚌" * 40)
    
    try:
        # Test connection
        db = get_db()
        print("\n✅ Kết nối database thành công!")
        print(f"   Database: {os.getenv('ARANGO_DATABASE')}")
        print(f"   Host: {os.getenv('ARANGO_HOST')}")
        
        # Run all test suites
        test_basic_queries()
        test_graph_basic()
        test_graph_advanced()
        test_complex_queries()
        test_journey_queries()
        test_analytics_queries()
        
        # Summary
        print_section("✅ HOÀN THÀNH TẤT CẢ TRUY VẤN")
        print("\n🎉 Tất cả các truy vấn đã được kiểm tra thành công!")
        print("📊 Hệ thống hoạt động bình thường")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ LỖI: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())