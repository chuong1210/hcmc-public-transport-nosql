from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import config
from app.utils.db_connection import db_connection
def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
    JWTManager(app)
    
    # Initialize database connection
    with app.app_context():
        db_connection.connect()
    
    # Register blueprints
    from app.routes.station_routes import station_bp
    from app.routes.route_routes import route_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.vehicle_routes import vehicle_bp
    from app.routes.schedule_routes import schedule_bp
    from app.routes.journey_routes import journey_bp
    from app.routes.analytics_routes import analytics_bp
    
    app.register_blueprint(station_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(vehicle_bp)
    app.register_blueprint(schedule_bp)
    app.register_blueprint(journey_bp)
    app.register_blueprint(analytics_bp)
    
    # Root endpoint
    @app.route('/')
    def index():
        return {
            "message": "Bus Management API",
            "version": "1.0",
            "endpoints": {
                "stations": "/api/stations",
                "routes": "/api/routes",
                "vehicles": "/api/vehicles",
                "schedules": "/api/schedules",
                "journey": "/api/journey",
                "analytics": "/api/analytics",
                "auth": "/api/auth",
                "users": "/api/users"
            }
        }
    
    # Health check
    @app.route('/health')
    def health():
        return {"status": "healthy"}
    
    return app