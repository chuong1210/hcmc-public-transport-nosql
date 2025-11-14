from datetime import datetime

class Route:
    def __init__(self, route_id, route_name, route_code, type="normal",
                 operating_hours=None, frequency=15, fare=None, 
                 total_distance=0, status="active", operator="SAMCO"):
        self.route_id = route_id
        self.route_name = route_name
        self.route_code = route_code
        self.type = type
        self.operating_hours = operating_hours or {"start": "05:00", "end": "23:00"}
        self.frequency = frequency
        self.fare = fare or {"adult": 7000, "student": 3500, "senior": 3500}
        self.total_distance = total_distance
        self.status = status
        self.operator = operator
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
    
    def to_dict(self):
        """Convert to dictionary for ArangoDB"""
        return {
            "_key": self.route_id,
            "route_id": self.route_id,
            "route_name": self.route_name,
            "route_code": self.route_code,
            "type": self.type,
            "operating_hours": self.operating_hours,
            "frequency": self.frequency,
            "fare": self.fare,
            "total_distance": self.total_distance,
            "status": self.status,
            "operator": self.operator,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create Route from dictionary"""
        return Route(
            route_id=data.get('route_id'),
            route_name=data.get('route_name'),
            route_code=data.get('route_code'),
            type=data.get('type', 'normal'),
            operating_hours=data.get('operating_hours'),
            frequency=data.get('frequency', 15),
            fare=data.get('fare'),
            total_distance=data.get('total_distance', 0),
            status=data.get('status', 'active'),
            operator=data.get('operator', 'SAMCO')
        )