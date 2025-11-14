from datetime import datetime

class Station:
    def __init__(self, station_id, name, address, location, 
                 type="intermediate", status="active", facilities=None, capacity=10):
        self.station_id = station_id
        self.name = name
        self.address = address
        self.location = location
        self.type = type
        self.status = status
        self.facilities = facilities or {}
        self.capacity = capacity
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
    
    def to_dict(self):
        """Convert to dictionary for ArangoDB"""
        return {
            "_key": self.station_id,
            "station_id": self.station_id,
            "name": self.name,
            "address": self.address,
            "location": self.location,
            "type": self.type,
            "status": self.status,
            "facilities": self.facilities,
            "capacity": self.capacity,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create Station from dictionary"""
        return Station(
            station_id=data.get('station_id'),
            name=data.get('name'),
            address=data.get('address'),
            location=data.get('location'),
            type=data.get('type', 'intermediate'),
            status=data.get('status', 'active'),
            facilities=data.get('facilities', {}),
            capacity=data.get('capacity', 10)
        )