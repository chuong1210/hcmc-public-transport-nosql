import os
import sys
from dotenv import load_dotenv
from pyArango.connection import Connection

# --- CẤU HÌNH ĐƯỜNG DẪN ĐỂ TÌM FILE .ENV ---
# Lấy đường dẫn thư mục hiện tại (scripts)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Lấy đường dẫn thư mục cha (Backend-API)
parent_dir = os.path.dirname(current_dir)

# Load file .env từ thư mục cha (Backend-API/.env)
env_path = os.path.join(parent_dir, '.env')
load_dotenv(env_path)

print(f"📂 Loading config from: {env_path}")
print(f"🔌 Host: {os.getenv('ARANGO_HOST')}")
print(f"🗄️  DB: {os.getenv('ARANGO_DATABASE')}")

def debug_data():
    try:
        # Kết nối trực tiếp không qua app
        conn = Connection(
            arangoURL=os.getenv('ARANGO_HOST', 'http://127.0.0.1:8529'),
            username=os.getenv('ARANGO_USERNAME', 'root'),
            password=os.getenv('ARANGO_PASSWORD', '')
        )
        
        db_name = os.getenv('ARANGO_DATABASE', 'bus_db')
        if not db_name in conn.databases:
             print(f"❌ Database '{db_name}' chưa được tạo!")
             return

        db = conn[db_name]

        print("\n" + "="*30)
        print("🛠️  KẾT QUẢ KIỂM TRA DỮ LIỆU")
        print("="*30)

        # 1. Kiểm tra Stations
        if 'stations' in db.collections:
            stations_count = db['stations'].count()
            print(f"📍 Stations count: {stations_count}")
        else:
            print("❌ Collection 'stations' KHÔNG TỒN TẠI")

        # 2. Kiểm tra Connects
        if 'connects' in db.collections:
            connects_count = db['connects'].count()
            print(f"🔗 Connects count: {connects_count}")
            
            if connects_count > 0:
                # Lấy mẫu 1 cạnh
                aql = "FOR c IN connects LIMIT 1 RETURN c"
                edge = list(db.AQLQuery(aql, rawResults=True))
                print(f"👀 Mẫu cạnh: {edge}")
                
                # Kiểm tra đường đi cụ thể từ ST001 -> ST012 (Dữ liệu mẫu có đoạn này)
                check_path_aql = """
                LET start = (FOR s IN stations FILTER s.station_id == 'ST001' LIMIT 1 RETURN s._id)[0]
                LET end = (FOR s IN stations FILTER s.station_id == 'ST012' LIMIT 1 RETURN s._id)[0]
                
                FOR p IN OUTBOUND SHORTEST_PATH start TO end connects
                RETURN p
                """
                path_test = list(db.AQLQuery(check_path_aql, rawResults=True))
                if path_test:
                    print("✅ Test nhanh: Tìm thấy đường từ ST001 -> ST012")
                else:
                    print("⚠️ Test nhanh: KHÔNG thấy đường từ ST001 -> ST012 (Cạnh bị đứt hoặc sai ID)")
            else:
                print("❌ Cảnh báo: Bảng 'connects' đang RỖNG! Hãy chạy lại script insert.")
        else:
            print("❌ Collection 'connects' KHÔNG TỒN TẠI (Bạn chưa tạo Graph?)")

    except Exception as e:
        print(f"❌ Lỗi kết nối: {e}")

if __name__ == "__main__":
    debug_data()