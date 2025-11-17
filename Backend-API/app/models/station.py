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
        
    def create_station_document(data):
        """Create station document for ArangoDB (without district)"""
        return {
            "station_id": data.get('station_id'),
            "name": data.get('name'),
            "address": {
                "street": data.get('address', {}).get('street'),
                "ward": data.get('address', {}).get('ward'),
                # "district": REMOVED - Không còn quận sau sát nhập 9/2025
                "city": data.get('address', {}).get('city', 'TP.HCM')
            },
            "location": {
                "latitude": float(data.get('location', {}).get('latitude', 0)),
                "longitude": float(data.get('location', {}).get('longitude', 0))
            },
            "type": data.get('type', 'intermediate'),
            "status": data.get('status', 'active'),
            "capacity": int(data.get('capacity', 10)),
            "facilities": {
                "waiting_area": data.get('facilities', {}).get('waiting_area', False),
                "wifi": data.get('facilities', {}).get('wifi', False),
                "toilet": data.get('facilities', {}).get('toilet', False),
                "atm": data.get('facilities', {}).get('atm', False),
                "wheelchair_accessible": data.get('facilities', {}).get('wheelchair_accessible', False)
            }
        }

    def validate_station_data(data):
        """Validate station data"""
        required_fields = ['station_id', 'name', 'address', 'location', 'type', 'status']
        
        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"
        
        # Validate address
        address = data.get('address', {})
        if not all(k in address for k in ['street', 'ward', 'city']):
            return False, "Address must contain street, ward, and city"
        
        # Validate location
        location = data.get('location', {})
        if not all(k in location for k in ['latitude', 'longitude']):
            return False, "Location must contain latitude and longitude"
        
        # Validate type
        if data.get('type') not in ['terminal', 'intermediate', 'stop']:
            return False, "Invalid station type"
        
        # Validate status
        if data.get('status') not in ['active', 'maintenance', 'inactive']:
            return False, "Invalid station status"
        
        return True, None
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