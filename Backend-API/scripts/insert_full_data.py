from pyArango.connection import Connection
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

def get_db_connection():
    """Connect to ArangoDB"""
    conn = Connection(
        arangoURL=os.getenv('ARANGO_HOST'),
        username=os.getenv('ARANGO_USERNAME'),
        password=os.getenv('ARANGO_PASSWORD')
    )
    return conn[os.getenv('ARANGO_DATABASE')]
def clear_all_data(db):
    """Clear all existing data using truncate"""
    print("🗑️  Clearing existing data...")
    
    collections = ['stations', 'routes', 'vehicles', 'users', 'schedules']
    edge_collections = ['connects', 'serves', 'operates_on']
    
    # Xóa dữ liệu Edge trước
    for col in edge_collections:
        if db.hasCollection(col):
            db[col].truncate()
            print(f"   ✅ Truncated {col}")

    # Xóa dữ liệu Document sau
    for col in collections:
        if db.hasCollection(col):
            db[col].truncate()
            print(f"   ✅ Truncated {col}")

def insert_stations(db):
    """Insert 30+ stations across Ho Chi Minh City"""
    print("\n📍 Inserting stations...")
    
    stations = [
        # Khu vực trung tâm
        {
            "station_id": "ST001",
            "name": "Bến Xe Miền Đông",
            "address": {
                "street": "292 Đinh Bộ Lĩnh",
                "ward": "Phường 26",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.8142, "longitude": 106.7115},
            "type": "terminal",
            "status": "active",
            "capacity": 50,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST002",
            "name": "Bến Xe An Sương",
            "address": {
                "street": "Quốc lộ 22",
                "ward": "Phường Tây Thạnh",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.8543, "longitude": 106.6055},
            "type": "terminal",
            "status": "active",
            "capacity": 40,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST003",
            "name": "Chợ Bến Thành",
            "address": {
                "street": "Lê Lợi",
                "ward": "Phường Bến Thành",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7720, "longitude": 106.6980},
            "type": "intermediate",
            "status": "active",
            "capacity": 20,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": False,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST004",
            "name": "Nhà Hát Thành Phố",
            "address": {
                "street": "7 Công Trường Lam Sơn",
                "ward": "Phường Bến Nghé",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7769, "longitude": 106.7009},
            "type": "intermediate",
            "status": "active",
            "capacity": 15,
            "facilities": {
                "waiting_area": False,
                "wifi": False,
                "toilet": False,
                "atm": False,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST005",
            "name": "Công Viên 23/9",
            "address": {
                "street": "Đường Phạm Ngũ Lão",
                "ward": "Phường Phạm Ngũ Lão",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7688, "longitude": 106.6918},
            "type": "intermediate",
            "status": "active",
            "capacity": 12,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": False,
                "atm": False,
                "wheelchair_accessible": False
            }
        },
        {
            "station_id": "ST006",
            "name": "Công Viên Tao Đàn",
            "address": {
                "street": "Đường Trương Định",
                "ward": "Phường Bến Thành",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7825, "longitude": 106.6935},
            "type": "stop",
            "status": "active",
            "capacity": 8,
            "facilities": {
                "waiting_area": False,
                "wifi": False,
                "toilet": False,
                "atm": False,
                "wheelchair_accessible": False
            }
        },
        {
            "station_id": "ST007",
            "name": "Thảo Cầm Viên",
            "address": {
                "street": "2 Nguyễn Bỉnh Khiêm",
                "ward": "Phường Bến Nghé",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7878, "longitude": 106.7051},
            "type": "intermediate",
            "status": "active",
            "capacity": 15,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": True,
                "atm": False,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST008",
            "name": "Đại Học Bách Khoa",
            "address": {
                "street": "268 Lý Thường Kiệt",
                "ward": "Phường 14",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7724, "longitude": 106.6574},
            "type": "intermediate",
            "status": "active",
            "capacity": 25,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST009",
            "name": "Bệnh Viện Chợ Rẫy",
            "address": {
                "street": "201B Nguyễn Chí Thanh",
                "ward": "Phường 12",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7548, "longitude": 106.6632},
            "type": "intermediate",
            "status": "active",
            "capacity": 20,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST010",
            "name": "Chợ An Đông",
            "address": {
                "street": "34 An Dương Vương",
                "ward": "Phường 9",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7545, "longitude": 106.6714},
            "type": "intermediate",
            "status": "active",
            "capacity": 18,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": False
            }
        },
        # Thêm 20 trạm nữa
        {
            "station_id": "ST011",
            "name": "Bến Thành Market",
            "address": {
                "street": "Lê Lợi",
                "ward": "Phường Bến Thành",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7722, "longitude": 106.6981},
            "type": "intermediate",
            "status": "active",
            "capacity": 20,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST012",
            "name": "Ngã Tư Hàng Xanh",
            "address": {
                "street": "Điện Biên Phủ",
                "ward": "Phường 25",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7992, "longitude": 106.7041},
            "type": "intermediate",
            "status": "active",
            "capacity": 25,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": False,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST013",
            "name": "Bến Xe Chợ Lớn",
            "address": {
                "street": "Hồng Bàng",
                "ward": "Phường 16",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7496, "longitude": 106.6471},
            "type": "terminal",
            "status": "active",
            "capacity": 35,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST014",
            "name": "Suối Tiên",
            "address": {
                "street": "Tân Thới Nhất 8",
                "ward": "Phường Tân Thới Nhất",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.8492, "longitude": 106.8042},
            "type": "stop",
            "status": "active",
            "capacity": 15,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": True,
                "atm": False,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST015",
            "name": "Cầu Khánh Hội",
            "address": {
                "street": "Võ Văn Kiệt",
                "ward": "Phường 3",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7503, "longitude": 106.6849},
            "type": "intermediate",
            "status": "active",
            "capacity": 12,
            "facilities": {
                "waiting_area": False,
                "wifi": False,
                "toilet": False,
                "atm": False,
                "wheelchair_accessible": False
            }
        },
        {
            "station_id": "ST016",
            "name": "Đầm Sen",
            "address": {
                "street": "Hòa Bình",
                "ward": "Phường 3",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7697, "longitude": 106.6366},
            "type": "intermediate",
            "status": "active",
            "capacity": 20,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST017",
            "name": "Sân Bay Tân Sơn Nhất",
            "address": {
                "street": "Trường Sơn",
                "ward": "Phường 2",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.8184, "longitude": 106.6519},
            "type": "terminal",
            "status": "active",
            "capacity": 50,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST018",
            "name": "Vincom Center",
            "address": {
                "street": "72 Lê Thánh Tôn",
                "ward": "Phường Bến Nghé",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7792, "longitude": 106.7011},
            "type": "stop",
            "status": "active",
            "capacity": 10,
            "facilities": {
                "waiting_area": False,
                "wifi": True,
                "toilet": False,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST019",
            "name": "Landmark 81",
            "address": {
                "street": "720A Điện Biên Phủ",
                "ward": "Phường 22",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7946, "longitude": 106.7218},
            "type": "intermediate",
            "status": "active",
            "capacity": 25,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST020",
            "name": "Cầu Sài Gòn",
            "address": {
                "street": "Võ Văn Kiệt",
                "ward": "Phường Cầu Kho",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7581, "longitude": 106.6889},
            "type": "intermediate",
            "status": "active",
            "capacity": 15,
            "facilities": {
                "waiting_area": False,
                "wifi": False,
                "toilet": False,
                "atm": False,
                "wheelchair_accessible": False
            }
        },
        {
            "station_id": "ST021",
            "name": "Nhà Văn Hóa Thanh Niên",
            "address": {
                "street": "4 Phạm Ngọc Thạch",
                "ward": "Phường 6",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7901, "longitude": 106.6944},
            "type": "stop",
            "status": "active",
            "capacity": 12,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": False,
                "atm": False,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST022",
            "name": "Thủ Thiêm",
            "address": {
                "street": "Mai Chí Thọ",
                "ward": "Phường Thủ Thiêm",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7901, "longitude": 106.7287},
            "type": "intermediate",
            "status": "active",
            "capacity": 20,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": False,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST023",
            "name": "Phú Mỹ Hưng",
            "address": {
                "street": "Nguyễn Văn Linh",
                "ward": "Phường Tân Phú",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7290, "longitude": 106.7013},
            "type": "intermediate",
            "status": "active",
            "capacity": 25,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST024",
            "name": "Công Viên Văn Hóa",
            "address": {
                "street": "Nguyễn Văn Cừ",
                "ward": "Phường An Khánh",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7435, "longitude": 106.7221},
            "type": "stop",
            "status": "active",
            "capacity": 10,
            "facilities": {
                "waiting_area": False,
                "wifi": False,
                "toilet": False,
                "atm": False,
                "wheelchair_accessible": False
            }
        },
        {
            "station_id": "ST025",
            "name": "Công Viên Gia Định",
            "address": {
                "street": "Hoàng Minh Giám",
                "ward": "Phường 9",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.8012, "longitude": 106.6821},
            "type": "intermediate",
            "status": "active",
            "capacity": 18,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": True,
                "atm": False,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST026",
            "name": "Đại Học Quốc Gia",
            "address": {
                "street": "Linh Trung",
                "ward": "Phường Linh Trung",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.8708, "longitude": 106.8029},
            "type": "intermediate",
            "status": "active",
            "capacity": 30,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST027",
            "name": "Công Viên Lê Văn Tám",
            "address": {
                "street": "Đinh Tiên Hoàng",
                "ward": "Phường Đa Kao",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7917, "longitude": 106.6987},
            "type": "stop",
            "status": "active",
            "capacity": 8,
            "facilities": {
                "waiting_area": False,
                "wifi": False,
                "toilet": False,
                "atm": False,
                "wheelchair_accessible": False
            }
        },
        {
            "station_id": "ST028",
            "name": "Siêu Thị Co.opMart",
            "address": {
                "street": "Cách Mạng Tháng 8",
                "ward": "Phường 7",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7769, "longitude": 106.6678},
            "type": "intermediate",
            "status": "active",
            "capacity": 20,
            "facilities": {
                "waiting_area": True,
                "wifi": True,
                "toilet": True,
                "atm": True,
                "wheelchair_accessible": True
            }
        },
        {
            "station_id": "ST029",
            "name": "Chợ Tân Định",
            "address": {
                "street": "Hai Bà Trưng",
                "ward": "Phường Tân Định",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7889, "longitude": 106.6924},
            "type": "intermediate",
            "status": "active",
            "capacity": 15,
            "facilities": {
                "waiting_area": True,
                "wifi": False,
                "toilet": False,
                "atm": True,
                "wheelchair_accessible": False
            }
        },
        {
            "station_id": "ST030",
            "name": "Bitexco Financial Tower",
            "address": {
                "street": "2 Hải Triều",
                "ward": "Phường Bến Nghé",
                "city": "TP.HCM"
            },
            "location": {"latitude": 10.7718, "longitude": 106.7038},
            "type": "stop",
            "status": "active",
            "capacity": 12,
            "facilities": {
                "waiting_area": False,
                "wifi": True,
                "toilet": False,
                "atm": True,
                "wheelchair_accessible": True
            }
        }
    ]
    
    stations_collection = db['stations']
    for station in stations:
        try:
            stations_collection.createDocument(station).save()
            print(f"   ✅ {station['name']}")
        except Exception as e:
            print(f"   ❌ Error: {station['name']} - {e}")
    
    print(f"\n   📊 Total: {len(stations)} stations inserted")

def insert_routes(db):
    """Insert 15+ bus routes"""
    print("\n🚌 Inserting routes...")
    
    routes = [
        {
            "route_id": "R001",
            "route_code": "01",
            "route_name": "Bến Xe Miền Đông - Bến Xe Chợ Lớn",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:00", "end": "22:00"},
            "frequency": 10,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Tuyến chính nối 2 bến xe lớn"
        },
        {
            "route_id": "R002",
            "route_code": "02",
            "route_name": "Bến Xe An Sương - Chợ Bến Thành",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:00", "end": "21:30"},
            "frequency": 12,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Tuyến từ An Sương vào trung tâm"
        },
        {
            "route_id": "R003",
            "route_code": "03",
            "route_name": "Sân Bay Tân Sơn Nhất - Chợ Bến Thành",
            "type": "express",
            "direction": "two-way",
            "operating_hours": {"start": "05:30", "end": "23:00"},
            "frequency": 15,
            "fare": {
                "adult": 10000,
                "student": 5000,
                "senior": 5000
            },
            "operator": "FUTA",
            "status": "active",
            "description": "Tuyến express từ sân bay"
        },
        {
            "route_id": "R004",
            "route_code": "04",
            "route_name": "Đại Học Bách Khoa - Landmark 81",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:00", "end": "22:00"},
            "frequency": 10,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Kết nối khu đại học với khu thương mại"
        },
        {
            "route_id": "R005",
            "route_code": "05",
            "route_name": "Suối Tiên - Chợ Bến Thành",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:30", "end": "21:00"},
            "frequency": 20,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Từ khu vui chơi vào trung tâm"
        },
        {
            "route_id": "R006",
            "route_code": "06",
            "route_name": "Phú Mỹ Hưng - Ngã Tư Hàng Xanh",
            "type": "rapid",
            "direction": "two-way",
            "operating_hours": {"start": "06:00", "end": "22:00"},
            "frequency": 8,
            "fare": {
                "adult": 12000,
                "student": 6000,
                "senior": 6000
            },
            "operator": "Phương Trang",
            "status": "active",
            "description": "Tuyến rapid nối Phú Mỹ Hưng"
        },
        {
            "route_id": "R007",
            "route_code": "07",
            "route_name": "Đại Học Quốc Gia - Bệnh Viện Chợ Rẫy",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:00", "end": "21:30"},
            "frequency": 15,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Nối khu đại học với bệnh viện"
        },
        {
            "route_id": "R008",
            "route_code": "08",
            "route_name": "Thủ Thiêm - Chợ Bến Thành",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:30", "end": "22:00"},
            "frequency": 12,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Qua cầu Thủ Thiêm"
        },
        {
            "route_id": "R009",
            "route_code": "09",
            "route_name": "Đầm Sen - Nhà Hát Thành Phố",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:00", "end": "21:00"},
            "frequency": 10,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Từ công viên vào trung tâm"
        },
        {
            "route_id": "R010",
            "route_code": "10",
            "route_name": "Vòng quanh Trung Tâm",
            "type": "express",
            "direction": "one-way",
            "operating_hours": {"start": "06:00", "end": "23:00"},
            "frequency": 20,
            "fare": {
                "adult": 10000,
                "student": 5000,
                "senior": 5000
            },
            "operator": "FUTA",
            "status": "active",
            "description": "Tuyến vòng quanh khu trung tâm"
        },
        {
            "route_id": "R011",
            "route_code": "11",
            "route_name": "Công Viên Gia Định - Landmark 81",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:30", "end": "21:30"},
            "frequency": 12,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Nối công viên với khu thương mại"
        },
        {
            "route_id": "R012",
            "route_code": "12",
            "route_name": "Chợ An Đông - Bitexco Tower",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:00", "end": "22:00"},
            "frequency": 10,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Từ chợ đến tòa nhà cao nhất"
        },
        {
            "route_id": "R013",
            "route_code": "13",
            "route_name": "Sân Bay - Phú Mỹ Hưng",
            "type": "express",
            "direction": "two-way",
            "operating_hours": {"start": "06:00", "end": "23:00"},
            "frequency": 15,
            "fare": {
                "adult": 15000,
                "student": 7500,
                "senior": 7500
            },
            "operator": "Mai Linh",
            "status": "active",
            "description": "Express từ sân bay đến khu đô thị"
        },
        {
            "route_id": "R014",
            "route_code": "14",
            "route_name": "Thảo Cầm Viên - Đại Học Quốc Gia",
            "type": "normal",
            "direction": "two-way",
            "operating_hours": {"start": "05:00", "end": "21:00"},
            "frequency": 15,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Nối công viên với đại học"
        },
        {
            "route_id": "R015",
            "route_code": "15",
            "route_name": "Vòng Ngoại Ô",
            "type": "normal",
            "direction": "one-way",
            "operating_hours": {"start": "05:30", "end": "20:30"},
            "frequency": 25,
            "fare": {
                "adult": 7000,
                "student": 3500,
                "senior": 3500
            },
            "operator": "SAMCO",
            "status": "active",
            "description": "Tuyến vòng ngoại thành"
        }
    ]
    
    routes_collection = db['routes']
    for route in routes:
        try:
            routes_collection.createDocument(route).save()
            print(f"   ✅ Tuyến {route['route_code']}: {route['route_name']}")
        except Exception as e:
            print(f"   ❌ Error: {route['route_code']} - {e}")
    
    print(f"\n   📊 Total: {len(routes)} routes inserted")

def insert_vehicles(db):
    """Insert 40+ vehicles"""
    print("\n🚐 Inserting vehicles...")
    
    vehicles = []
    
    # Generate 40 vehicles
    manufacturers = ['Thaco', 'Hyundai', 'Daewoo', 'Isuzu', 'Mercedes']
    types = ['bus_16', 'bus_40', 'bus_60']
    statuses = ['active', 'active', 'active', 'maintenance']  # More active vehicles
    
    for i in range(1, 41):
        vehicle = {
            "vehicle_id": f"V{i:03d}",
            "license_plate": f"51B-{10000 + i}",
            "type": types[i % 3],
            "capacity": [16, 40, 60][i % 3],
            "manufacturer": manufacturers[i % 5],
            "model": f"Model {chr(65 + (i % 5))}",
            "year": 2018 + (i % 7),
            "fuel_type": "diesel" if i % 3 == 0 else "cng" if i % 3 == 1 else "electric",
            "features": {
                "air_conditioning": True if i % 2 == 0 else False,
                "wifi": True if i % 3 == 0 else False,
                "usb_charging": True if i % 4 == 0 else False,
                "wheelchair_lift": True if i % 5 == 0 else False
            },
            "status": statuses[i % 4],
            "condition": "good" if i % 3 == 0 else "fair" if i % 3 == 1 else "needs_maintenance",
            "last_maintenance": "2024-10-01",
            "next_maintenance": "2025-01-01"
        }
        vehicles.append(vehicle)
    
    vehicles_collection = db['vehicles']
    for vehicle in vehicles:
        try:
            vehicles_collection.createDocument(vehicle).save()
            print(f"   ✅ {vehicle['license_plate']} - {vehicle['type']}")
        except Exception as e:
            print(f"   ❌ Error: {vehicle['license_plate']} - {e}")
    
    print(f"\n   📊 Total: {len(vehicles)} vehicles inserted")

def insert_users(db):
    """Insert system users"""
    print("\n👥 Inserting users...")
    
    def hash_password(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    users = [
        {
            "username": "admin",
            "password_hash": hash_password("admin123"),
            "email": "admin@busmanagement.vn",
            "full_name": "Administrator",
            "role": "admin",
            "phone": "0901234567",
            "status": "active",
            "permissions": ["read", "write", "delete", "manage_users"],
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "username": "manager",
            "password_hash": hash_password("manager123"),
            "email": "manager@busmanagement.vn",
            "full_name": "Manager User",
            "role": "manager",
            "phone": "0901234568",
            "status": "active",
            "permissions": ["read", "write"],
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "username": "user",
            "password_hash": hash_password("user123"),
            "email": "user@busmanagement.vn",
            "full_name": "Regular User",
            "role": "user",
            "phone": "0901234569",
            "status": "active",
            "permissions": ["read"],
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    users_collection = db['users']
    for user in users:
        try:
            users_collection.createDocument(user).save()
            print(f"   ✅ {user['username']} ({user['role']})")
        except Exception as e:
            print(f"   ❌ Error: {user['username']} - {e}")
    
    print(f"\n   📊 Total: {len(users)} users inserted")

def insert_connects(db):
    """Insert physical connections between stations"""
    print("\n🔗 Inserting station connections (connects)...")
    
    # Define connections with distance and duration
    connections = [
        # Main routes connections
        {"from": "ST001", "to": "ST012", "distance": 5200, "duration": 15},  # Miền Đông -> Hàng Xanh
        {"from": "ST012", "to": "ST003", "distance": 3800, "duration": 12},  # Hàng Xanh -> Bến Thành
        {"from": "ST003", "to": "ST004", "distance": 800, "duration": 3},    # Bến Thành -> Nhà Hát
        {"from": "ST004", "to": "ST007", "distance": 1200, "duration": 4},   # Nhà Hát -> Thảo Cầm Viên
        {"from": "ST007", "to": "ST019", "distance": 2500, "duration": 8},   # Thảo Cầm Viên -> Landmark
        {"from": "ST019", "to": "ST022", "distance": 1800, "duration": 6},   # Landmark -> Thủ Thiêm
        
        # Airport connections
        {"from": "ST017", "to": "ST025", "distance": 4500, "duration": 15},  # Sân bay -> CV Gia Định
        {"from": "ST025", "to": "ST008", "distance": 3200, "duration": 10},  # CV Gia Định -> Bách Khoa
        {"from": "ST008", "to": "ST003", "distance": 2800, "duration": 9},   # Bách Khoa -> Bến Thành
        
        # West side connections
        {"from": "ST002", "to": "ST016", "distance": 3500, "duration": 12},  # An Sương -> Đầm Sen
        {"from": "ST016", "to": "ST013", "distance": 2200, "duration": 8},   # Đầm Sen -> Chợ Lớn
        {"from": "ST013", "to": "ST010", "distance": 1800, "duration": 6},   # Chợ Lớn -> An Đông
        {"from": "ST010", "to": "ST003", "distance": 1500, "duration": 5},   # An Đông -> Bến Thành
        
        # Hospital route
        {"from": "ST009", "to": "ST010", "distance": 1200, "duration": 4},   # Chợ Rẫy -> An Đông
        {"from": "ST008", "to": "ST009", "distance": 1800, "duration": 6},   # Bách Khoa -> Chợ Rẫy
        
        # University connections
        {"from": "ST026", "to": "ST014", "distance": 2500, "duration": 8},   # ĐH Quốc Gia -> Suối Tiên
        {"from": "ST014", "to": "ST001", "distance": 4200, "duration": 14},  # Suối Tiên -> Miền Đông
        {"from": "ST026", "to": "ST012", "distance": 6500, "duration": 20},  # ĐH QG -> Hàng Xanh
        
        # South connections
        {"from": "ST023", "to": "ST024", "distance": 2800, "duration": 9},   # Phú Mỹ Hưng -> CV Văn Hóa
        {"from": "ST024", "to": "ST019", "distance": 3500, "duration": 12},  # CV VH -> Landmark
        {"from": "ST019", "to": "ST012", "distance": 2200, "duration": 7},   # Landmark -> Hàng Xanh
        
        # Central area connections
        {"from": "ST003", "to": "ST011", "distance": 200, "duration": 1},    # Bến Thành -> Market
        {"from": "ST011", "to": "ST018", "distance": 600, "duration": 2},    # Market -> Vincom
        {"from": "ST018", "to": "ST030", "distance": 400, "duration": 2},    # Vincom -> Bitexco
        {"from": "ST030", "to": "ST004", "distance": 500, "duration": 2},    # Bitexco -> Nhà Hát
        
        # Additional connections
        {"from": "ST004", "to": "ST005", "distance": 800, "duration": 3},    # Nhà Hát -> CV 23/9
        {"from": "ST005", "to": "ST020", "distance": 1200, "duration": 4},   # CV 23/9 -> Cầu SG
        {"from": "ST020", "to": "ST015", "distance": 800, "duration": 3},    # Cầu SG -> Cầu Khánh Hội
        {"from": "ST015", "to": "ST013", "distance": 1500, "duration": 5},   # Cầu KH -> Chợ Lớn
        
        {"from": "ST006", "to": "ST029", "distance": 1000, "duration": 4},   # Tao Đàn -> Tân Định
        {"from": "ST029", "to": "ST021", "distance": 800, "duration": 3},    # Tân Định -> NVH TN
        {"from": "ST021", "to": "ST027", "duration": 600, "distance": 2},    # NVH TN -> Lê Văn Tám
        {"from": "ST027", "to": "ST007", "distance": 700, "duration": 3},    # Lê Văn Tám -> Thảo Cầm Viên
        
        {"from": "ST008", "to": "ST028", "distance": 1500, "duration": 5},   # Bách Khoa -> Co.op
        {"from": "ST028", "to": "ST009", "distance": 1200, "duration": 4},   # Co.op -> Chợ Rẫy
        
        # Reverse connections (for two-way routes)
        {"from": "ST012", "to": "ST001", "distance": 5200, "duration": 15},
        {"from": "ST003", "to": "ST012", "distance": 3800, "duration": 12},
        {"from": "ST004", "to": "ST003", "distance": 800, "duration": 3},
        {"from": "ST007", "to": "ST004", "distance": 1200, "duration": 4},
        {"from": "ST019", "to": "ST007", "distance": 2500, "duration": 8},
        {"from": "ST022", "to": "ST019", "distance": 1800, "duration": 6},
        {"from": "ST025", "to": "ST017", "distance": 4500, "duration": 15},
        {"from": "ST008", "to": "ST025", "distance": 3200, "duration": 10},
        {"from": "ST003", "to": "ST008", "distance": 2800, "duration": 9},
        {"from": "ST016", "to": "ST002", "distance": 3500, "duration": 12},
        {"from": "ST013", "to": "ST016", "distance": 2200, "duration": 8},
        {"from": "ST010", "to": "ST013", "distance": 1800, "duration": 6},
        {"from": "ST003", "to": "ST010", "distance": 1500, "duration": 5},
        {"from": "ST010", "to": "ST009", "distance": 1200, "duration": 4},
        {"from": "ST009", "to": "ST008", "distance": 1800, "duration": 6},
        {"from": "ST014", "to": "ST026", "distance": 2500, "duration": 8},
        {"from": "ST001", "to": "ST014", "distance": 4200, "duration": 14},
        {"from": "ST012", "to": "ST026", "distance": 6500, "duration": 20},
        {"from": "ST024", "to": "ST023", "distance": 2800, "duration": 9},
        {"from": "ST019", "to": "ST024", "distance": 3500, "duration": 12},
        {"from": "ST012", "to": "ST019", "distance": 2200, "duration": 7},
        {"from": "ST011", "to": "ST003", "distance": 200, "duration": 1},
        {"from": "ST018", "to": "ST011", "distance": 600, "duration": 2},
        {"from": "ST030", "to": "ST018", "distance": 400, "duration": 2},
        {"from": "ST004", "to": "ST030", "distance": 500, "duration": 2},
        {"from": "ST005", "to": "ST004", "distance": 800, "duration": 3},
        {"from": "ST020", "to": "ST005", "distance": 1200, "duration": 4},
        {"from": "ST015", "to": "ST020", "distance": 800, "duration": 3},
        {"from": "ST013", "to": "ST015", "distance": 1500, "duration": 5},
        {"from": "ST029", "to": "ST006", "distance": 1000, "duration": 4},
        {"from": "ST021", "to": "ST029", "distance": 800, "duration": 3},
        {"from": "ST027", "to": "ST021", "distance": 600, "duration": 2},
        {"from": "ST007", "to": "ST027", "distance": 700, "duration": 3},
        {"from": "ST028", "to": "ST008", "distance": 1500, "duration": 5},
        {"from": "ST009", "to": "ST028", "distance": 1200, "duration": 4},
    ]
    
    # Get station _keys mapping
    stations_collection = db['stations']
    station_keys = {}
    for station in stations_collection.fetchAll():
        station_keys[station['station_id']] = station['_key']
    
    connects_collection = db['connects']
    count = 0
    for conn in connections:
        try:
            edge_data = {
                '_from': f"stations/{station_keys[conn['from']]}",
                '_to': f"stations/{station_keys[conn['to']]}",
                'distance': conn['distance'],
                'duration': conn['duration'],
                'road_condition': 'good'
            }
            connects_collection.createDocument(edge_data).save()
            count += 1
            if count % 10 == 0:
                print(f"   ✅ Inserted {count} connections...")
        except Exception as e:
            print(f"   ❌ Error: {conn['from']} -> {conn['to']}: {e}")
    
    print(f"\n   📊 Total: {count} connections inserted")

def insert_serves(db):
    """Insert route-station relationships (serves edges)"""
    print("\n🛣️  Inserting route serves...")
    
    # Define which stations each route serves
    route_stations = {
        "R001": [  # Miền Đông - Chợ Lớn
            ("ST001", 1, 0, True),
            ("ST012", 2, 15, True),
            ("ST003", 3, 27, True),
            ("ST010", 4, 32, False),
            ("ST013", 5, 38, True)
        ],
        "R002": [  # An Sương - Bến Thành
            ("ST002", 1, 0, True),
            ("ST016", 2, 12, False),
            ("ST013", 3, 20, True),
            ("ST010", 4, 26, False),
            ("ST003", 5, 31, True)
        ],
        "R003": [  # Sân Bay - Bến Thành
            ("ST017", 1, 0, True),
            ("ST025", 2, 15, False),
            ("ST008", 3, 25, True),
            ("ST003", 4, 34, True)
        ],
        "R004": [  # Bách Khoa - Landmark
            ("ST008", 1, 0, True),
            ("ST009", 2, 6, True),
            ("ST010", 3, 10, False),
            ("ST003", 4, 15, True),
            ("ST012", 5, 27, False),
            ("ST019", 6, 34, True)
        ],
        "R005": [  # Suối Tiên - Bến Thành
            ("ST014", 1, 0, True),
            ("ST001", 2, 14, True),
            ("ST012", 3, 29, True),
            ("ST003", 4, 41, True)
        ],
        "R006": [  # Phú Mỹ Hưng - Hàng Xanh
            ("ST023", 1, 0, True),
            ("ST024", 2, 9, False),
            ("ST019", 3, 21, True),
            ("ST012", 4, 28, True)
        ],
        "R007": [  # ĐH Quốc Gia - Chợ Rẫy
            ("ST026", 1, 0, True),
            ("ST012", 2, 20, True),
            ("ST008", 3, 29, True),
            ("ST009", 4, 35, True)
        ],
        "R008": [  # Thủ Thiêm - Bến Thành
            ("ST022", 1, 0, True),
            ("ST019", 2, 6, True),
            ("ST012", 3, 13, False),
            ("ST003", 4, 25, True)
        ],
        "R009": [  # Đầm Sen - Nhà Hát
            ("ST016", 1, 0, True),
            ("ST013", 2, 8, True),
            ("ST010", 3, 14, False),
            ("ST003", 4, 19, True),
            ("ST004", 5, 22, True)
        ],
        "R010": [  # Vòng Trung Tâm
            ("ST003", 1, 0, True),
            ("ST011", 2, 1, False),
            ("ST018", 3, 3, False),
            ("ST030", 4, 5, False),
            ("ST004", 5, 7, True),
            ("ST007", 6, 11, False),
            ("ST019", 7, 19, True),
            ("ST012", 8, 26, True),
            ("ST003", 9, 38, True)
        ],
        "R011": [  # CV Gia Định - Landmark
            ("ST025", 1, 0, True),
            ("ST008", 2, 10, True),
            ("ST003", 3, 19, True),
            ("ST012", 4, 31, False),
            ("ST019", 5, 38, True)
        ],
        "R012": [  # An Đông - Bitexco
            ("ST010", 1, 0, True),
            ("ST003", 2, 5, True),
            ("ST011", 3, 6, False),
            ("ST018", 4, 8, False),
            ("ST030", 5, 10, True)
        ],
        "R013": [  # Sân Bay - Phú Mỹ Hưng
            ("ST017", 1, 0, True),
            ("ST025", 2, 15, False),
            ("ST019", 3, 35, True),
            ("ST024", 4, 47, False),
            ("ST023", 5, 56, True)
        ],
        "R014": [  # Thảo Cầm Viên - ĐH Quốc Gia
            ("ST007", 1, 0, True),
            ("ST027", 2, 3, False),
            ("ST021", 3, 5, False),
            ("ST012", 4, 15, True),
            ("ST026", 5, 35, True)
        ],
        "R015": [  # Vòng Ngoại Ô
            ("ST002", 1, 0, True),
            ("ST016", 2, 12, False),
            ("ST013", 3, 20, True),
            ("ST015", 4, 25, False),
            ("ST023", 5, 35, True),
            ("ST024", 6, 44, False),
            ("ST026", 7, 60, True),
            ("ST014", 8, 68, False),
            ("ST001", 9, 82, True),
            ("ST002", 10, 95, True)
        ]
    }
    
    # Get route and station _keys
    routes_collection = db['routes']
    stations_collection = db['stations']
    
    route_keys = {}
    for route in routes_collection.fetchAll():
        route_keys[route['route_id']] = route['_key']
    
    station_keys = {}
    for station in stations_collection.fetchAll():
        station_keys[station['station_id']] = station['_key']
    
    serves_collection = db['serves']
    count = 0
    
    for route_id, stops in route_stations.items():
        for station_id, stop_order, arrival_offset, is_main in stops:
            try:
                edge_data = {
                    '_from': f"routes/{route_keys[route_id]}",
                    '_to': f"stations/{station_keys[station_id]}",
                    'stop_order': stop_order,
                    'arrival_offset': arrival_offset,
                    'is_main_stop': is_main
                }
                serves_collection.createDocument(edge_data).save()
                count += 1
            except Exception as e:
                print(f"   ❌ Error: {route_id} -> {station_id}: {e}")
    
    print(f"   📊 Total: {count} route-station relationships inserted")

def insert_operates_on(db):
    """Assign vehicles to routes (operates_on edges)"""
    print("\n🚐 Assigning vehicles to routes...")
    
    # Assign vehicles to routes
    assignments = [
        ("V001", "R001", "morning", "05:00", "11:00", "2024-01-01"),
        ("V002", "R001", "afternoon", "11:00", "17:00", "2024-01-01"),
        ("V003", "R001", "evening", "17:00", "22:00", "2024-01-01"),
        
        ("V004", "R002", "morning", "05:00", "11:00", "2024-01-01"),
        ("V005", "R002", "afternoon", "11:00", "17:00", "2024-01-01"),
        ("V006", "R002", "evening", "17:00", "21:30", "2024-01-01"),
        
        ("V007", "R003", "morning", "05:30", "11:30", "2024-01-01"),
        ("V008", "R003", "afternoon", "11:30", "17:30", "2024-01-01"),
        ("V009", "R003", "evening", "17:30", "23:00", "2024-01-01"),
        
        ("V010", "R004", "morning", "05:00", "11:00", "2024-01-01"),
        ("V011", "R004", "afternoon", "11:00", "17:00", "2024-01-01"),
        ("V012", "R004", "evening", "17:00", "22:00", "2024-01-01"),
        
        ("V013", "R005", "morning", "05:30", "11:30", "2024-01-01"),
        ("V014", "R005", "afternoon", "11:30", "17:30", "2024-01-01"),
        
        ("V015", "R006", "morning", "06:00", "12:00", "2024-01-01"),
        ("V016", "R006", "afternoon", "12:00", "18:00", "2024-01-01"),
        ("V017", "R006", "evening", "18:00", "22:00", "2024-01-01"),
        
        ("V018", "R007", "morning", "05:00", "11:00", "2024-01-01"),
        ("V019", "R007", "afternoon", "11:00", "17:00", "2024-01-01"),
        ("V020", "R007", "evening", "17:00", "21:30", "2024-01-01"),
        
        ("V021", "R008", "morning", "05:30", "11:30", "2024-01-01"),
        ("V022", "R008", "afternoon", "11:30", "17:30", "2024-01-01"),
        ("V023", "R008", "evening", "17:30", "22:00", "2024-01-01"),
        
        ("V024", "R009", "morning", "05:00", "11:00", "2024-01-01"),
        ("V025", "R009", "afternoon", "11:00", "17:00", "2024-01-01"),
        
        ("V026", "R010", "morning", "06:00", "12:00", "2024-01-01"),
        ("V027", "R010", "afternoon", "12:00", "18:00", "2024-01-01"),
        ("V028", "R010", "evening", "18:00", "23:00", "2024-01-01"),
        
        ("V029", "R011", "morning", "05:30", "11:30", "2024-01-01"),
        ("V030", "R011", "afternoon", "11:30", "17:30", "2024-01-01"),
        
        ("V031", "R012", "morning", "05:00", "11:00", "2024-01-01"),
        ("V032", "R012", "afternoon", "11:00", "17:00", "2024-01-01"),
        
        ("V033", "R013", "morning", "06:00", "12:00", "2024-01-01"),
        ("V034", "R013", "afternoon", "12:00", "18:00", "2024-01-01"),
        ("V035", "R013", "evening", "18:00", "23:00", "2024-01-01"),
    ]
    
    # Get vehicle and route _keys
    vehicles_collection = db['vehicles']
    routes_collection = db['routes']
    
    vehicle_keys = {}
    for vehicle in vehicles_collection.fetchAll():
        vehicle_keys[vehicle['vehicle_id']] = vehicle['_key']
    
    route_keys = {}
    for route in routes_collection.fetchAll():
        route_keys[route['route_id']] = route['_key']
    
    operates_on_collection = db['operates_on']
    count = 0
    
    for vehicle_id, route_id, shift, start, end, date in assignments:
        try:
            edge_data = {
                '_from': f"vehicles/{vehicle_keys[vehicle_id]}",
                '_to': f"routes/{route_keys[route_id]}",
                'shift': shift,
                'start_time': start,
                'end_time': end,
                'assignment_date': date
            }
            operates_on_collection.createDocument(edge_data).save()
            count += 1
        except Exception as e:
            print(f"   ❌ Error: {vehicle_id} -> {route_id}: {e}")
    
    print(f"   📊 Total: {count} vehicle assignments inserted")

def insert_schedules(db):
    """Insert detailed schedules"""
    print("\n📅 Inserting schedules...")
    
    days_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    
    schedules = [
        {
            "route_id": "R001",
            "vehicle_id": "V001",
            "departure_time": "05:00",
            "shift": "morning",
            "day_of_week": weekdays,
            "driver": {
                "name": "Nguyễn Văn A",
                "license_number": "51-123456"
            },
            "status": "scheduled"
        },
        {
            "route_id": "R001",
            "vehicle_id": "V002",
            "departure_time": "11:00",
            "shift": "afternoon",
            "day_of_week": weekdays,
            "driver": {
                "name": "Trần Văn B",
                "license_number": "51-123457"
            },
            "status": "scheduled"
        },
        {
            "route_id": "R002",
            "vehicle_id": "V004",
            "departure_time": "05:00",
            "shift": "morning",
            "day_of_week": days_of_week,
            "driver": {
                "name": "Lê Văn C",
                "license_number": "51-123458"
            },
            "status": "scheduled"
        },
        {
            "route_id": "R003",
            "vehicle_id": "V007",
            "departure_time": "05:30",
            "shift": "morning",
            "day_of_week": days_of_week,
            "driver": {
                "name": "Phạm Văn D",
                "license_number": "51-123459"
            },
            "status": "scheduled"
        },
        {
            "route_id": "R003",
            "vehicle_id": "V008",
            "departure_time": "11:30",
            "shift": "afternoon",
            "day_of_week": days_of_week,
            "driver": {
                "name": "Hoàng Văn E",
                "license_number": "51-123460"
            },
            "status": "scheduled"
        },
        # Add more schedules...
    ]
    
    schedules_collection = db['schedules']
    for schedule in schedules:
        try:
            schedules_collection.createDocument(schedule).save()
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"   📊 Total: {len(schedules)} schedules inserted")
import requests
import json

# ... (giữ nguyên các phần import khác)

def create_graph_definition(db):
    """
    Tạo Named Graph bằng cách gọi trực tiếp API ArangoDB (Bypass hạn chế của pyArango)
    """
    print("\n🕸️  Defining Graph 'bus_network'...")
    
    graph_name = "bus_network"
    
    # Lấy thông tin kết nối từ biến môi trường hoặc từ đối tượng db
    base_url = os.getenv('ARANGO_HOST')
    db_name = os.getenv('ARANGO_DATABASE')
    username = os.getenv('ARANGO_USERNAME')
    password = os.getenv('ARANGO_PASSWORD')
    
    # URL API để quản lý Graph
    # Lưu ý: URL phải có định dạng /_db/{dbname}/_api/gharial
    api_url = f"{base_url}/_db/{db_name}/_api/gharial"
    
    # 1. Xóa Graph cũ nếu tồn tại (để cập nhật mới)
    try:
        requests.delete(
            f"{api_url}/{graph_name}", 
            auth=(username, password)
        )
        print(f"   🗑️  Deleted old graph '{graph_name}' (if existed)")
    except:
        pass

    # 2. Định nghĩa Payload chuẩn của ArangoDB
    # Lưu ý: API yêu cầu key là "from" và "to", KHÔNG PHẢI "fromCollections"
    payload = {
        "name": graph_name,
        "edgeDefinitions": [
            {
                "collection": "connects",
                "from": ["stations"],
                "to": ["stations"]
            },
            {
                "collection": "serves",
                "from": ["routes"],
                "to": ["stations"]
            },
            {
                "collection": "operates_on",
                "from": ["vehicles"],
                "to": ["routes"]
            }
        ],
        "orphanCollections": ["users", "schedules"]
    }

    # 3. Gọi API tạo Graph
    response = requests.post(
        api_url, 
        auth=(username, password),
        json=payload
    )

    if response.status_code in [201, 202]:
        print(f"   ✅ Graph '{graph_name}' created successfully!")
    else:
        # Nếu lỗi là do graph đã tồn tại (conflict) thì bỏ qua
        if "duplicate name" in response.text:
             print(f"   ⚠️ Graph '{graph_name}' already exists.")
        else:
            print(f"   ❌ Error creating graph: {response.status_code} - {response.text}")

# Nhớ gọi hàm này trong main() sau khi insert xong dữ liệu
# insert_schedules(db)
# create_graph_definition(db)  <-- GỌI Ở ĐÂY
def main():
    """Main execution"""
    print("=" * 60)
    print("🚀 INSERTING FULL DATA INTO BUS MANAGEMENT SYSTEM")
    print("=" * 60)
    
    try:
        db = get_db_connection()
        print(f"✅ Connected to database: {db.name}\n")
        
        # Clear existing data
        clear_all_data(db)
        
        # Insert data
        insert_stations(db)
        insert_routes(db)
        insert_vehicles(db)
        insert_users(db)
        insert_connects(db)
        insert_serves(db)
        insert_operates_on(db)
        insert_schedules(db)
        create_graph_definition(db)  

        print("\n" + "=" * 60)
        print("✅ DATA INSERTION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()