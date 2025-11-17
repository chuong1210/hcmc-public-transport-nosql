from pyArango.connection import Connection
import os
from dotenv import load_dotenv

load_dotenv()

def drop_and_recreate_collections():
    """Drop all collections and recreate them"""
    print("=" * 60)
    print("🔄 DROP AND RECREATE ALL COLLECTIONS")
    print("=" * 60)
    
    # Connect
    conn = Connection(
        arangoURL=os.getenv('ARANGO_HOST'),
        username=os.getenv('ARANGO_USERNAME'),
        password=os.getenv('ARANGO_PASSWORD')
    )
    
    db = conn[os.getenv('ARANGO_DATABASE')]
    print(f"✅ Connected to database: {db.name}\n")
    
    # Collections to drop
    collections = ['stations', 'routes', 'vehicles', 'users', 'schedules']
    edge_collections = ['connects', 'serves', 'operates_on']
    
    # Drop collections
    print("🗑️  Dropping collections...")
    for col_name in collections + edge_collections:
        try:
            if db.hasCollection(col_name):
                db[col_name].delete()
                print(f"   ✅ Dropped: {col_name}")
            else:
                print(f"   ⚠️  Not found: {col_name}")
        except Exception as e:
            print(f"   ❌ Error dropping {col_name}: {e}")
    
    # Create document collections
    print("\n📦 Creating document collections...")
    for col_name in collections:
        try:
            db.createCollection(name=col_name)
            print(f"   ✅ Created: {col_name}")
        except Exception as e:
            print(f"   ❌ Error creating {col_name}: {e}")
    
    # Create edge collections
    print("\n🔗 Creating edge collections...")
    for col_name in edge_collections:
        try:
            db.createCollection(className='Edges', name=col_name)
            print(f"   ✅ Created: {col_name}")
        except Exception as e:
            print(f"   ❌ Error creating {col_name}: {e}")
    
    # Create graph
    print("\n🕸️  Creating graph 'bus_network'...")
    try:
        # Drop existing graph if exists
        if db.hasGraph('bus_network'):
            db.graphs['bus_network'].delete()
            print("   🗑️  Dropped existing graph")
        
        # Create new graph
        graph_data = {
            'name': 'bus_network',
            'edgeDefinitions': [
                {
                    'collection': 'connects',
                    'from': ['stations'],
                    'to': ['stations']
                },
                {
                    'collection': 'serves',
                    'from': ['routes'],
                    'to': ['stations']
                },
                {
                    'collection': 'operates_on',
                    'from': ['vehicles'],
                    'to': ['routes']
                }
            ]
        }
        
        db.createGraph(graph_data)
        print("   ✅ Created graph: bus_network")
        
    except Exception as e:
        print(f"   ❌ Error creating graph: {e}")
    
    print("\n" + "=" * 60)
    print("✅ COLLECTIONS RECREATED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    confirm = input("⚠️  Are you sure you want to DROP ALL COLLECTIONS? (yes/no): ")
    if confirm.lower() == 'yes':
        drop_and_recreate_collections()
    else:
        print("❌ Operation cancelled")