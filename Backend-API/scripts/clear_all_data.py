from pyArango.connection import Connection
import os
from dotenv import load_dotenv

load_dotenv()

def clear_all_data():
    """Clear all data from collections"""
    print("=" * 60)
    print("🗑️  CLEARING ALL DATA FROM DATABASE")
    print("=" * 60)
    
    # Connect to database
    conn = Connection(
        arangoURL=os.getenv('ARANGO_HOST'),
        username=os.getenv('ARANGO_USERNAME'),
        password=os.getenv('ARANGO_PASSWORD')
    )
    
    db = conn[os.getenv('ARANGO_DATABASE')]
    print(f"✅ Connected to database: {db.name}\n")
    
    # Define collections and edges
    collections = ['stations', 'routes', 'vehicles', 'users', 'schedules']
    edge_collections = ['connects', 'serves', 'operates_on']
    
    print("🗑️  Clearing document collections...")
    for col in collections:
        try:
            aql = f"FOR doc IN {col} REMOVE doc IN {col}"
            result = db.AQLQuery(aql, rawResults=True)
            count = len(list(result))
            print(f"   ✅ Cleared {col}: {count} documents removed")
        except Exception as e:
            print(f"   ⚠️  {col}: {e}")
    
    print("\n🗑️  Clearing edge collections...")
    for col in edge_collections:
        try:
            aql = f"FOR doc IN {col} REMOVE doc IN {col}"
            result = db.AQLQuery(aql, rawResults=True)
            count = len(list(result))
            print(f"   ✅ Cleared {col}: {count} edges removed")
        except Exception as e:
            print(f"   ⚠️  {col}: {e}")
    
    print("\n" + "=" * 60)
    print("✅ ALL DATA CLEARED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    confirm = input("⚠️  Are you sure you want to DELETE ALL DATA? (yes/no): ")
    if confirm.lower() == 'yes':
        clear_all_data()
    else:
        print("❌ Operation cancelled")