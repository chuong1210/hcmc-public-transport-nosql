from pyArango.connection import Connection
from app.config import Config

class DatabaseConnection:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
            cls._instance.connection = None
            cls._instance.db = None
        return cls._instance
    
    def connect(self):
        """Establish connection to ArangoDB"""
        try:
            self.connection = Connection(
                arangoURL=Config.ARANGO_HOST,
                username=Config.ARANGO_USERNAME,
                password=Config.ARANGO_PASSWORD
            )
            self.db = self.connection[Config.ARANGO_DATABASE]
            print(f"✅ Connected to ArangoDB database: {Config.ARANGO_DATABASE}")
            return self.db
        except Exception as e:
            print(f"❌ Error connecting to ArangoDB: {str(e)}")
            raise
    
    def get_db(self):
        """Get database instance"""
        if self.db is None:
            self.connect()
        return self.db
    
    def get_collection(self, collection_name):
        """Get a specific collection"""
        db = self.get_db()
        return db[collection_name]

# Singleton instance
db_connection = DatabaseConnection()