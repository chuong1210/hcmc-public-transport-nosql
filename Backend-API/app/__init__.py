from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import config
from app.utils.db_connection import db_connection
def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)
    app.url_map.strict_slashes = False  # ← Thêm dòng này
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    # CORS(app)
  
    # CORS(
    #         app,
    #         resources={
    #             r"/api/*": {
    #                 "origins": ["http://localhost:3000"],
    #                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    #                 "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
    #                 "supports_credentials": True
    #             }
    #         }
    #     )
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:3000"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
                "expose_headers": ["Authorization"],  # Nếu cần expose token trong response
                "supports_credentials": True,
                "send_wildcard": False  # Explicit tránh wildcard
                
            }
        },
        # origins=["http://localhost:3000"],  # ← App-level origins
        supports_credentials=True,
        automatic_options=True,
        always_send_vary=True,
        intercept_exceptions=False  # ← Thêm: Tránh CORS override exceptions
    )
    JWTManager(app)
    
    # Initialize database connection
    with app.app_context():
        db_connection.connect()
    
    from app.routes.route_routes import route_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.vehicle_routes import vehicle_bp
    from app.routes.schedule_routes import schedule_bp
    from app.routes.journey_routes import journey_bp
    from app.routes.analytics_routes import analytics_bp
    from app.routes.query_routes import query_bp
    from app.routes.station_routes import station_bp
    from app.routes.redis_routes import redis_bp

    # Register blueprints
    app.register_blueprint(redis_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(station_bp)

    app.register_blueprint(vehicle_bp)
    app.register_blueprint(schedule_bp)
    app.register_blueprint(journey_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(query_bp)

    
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
    # @app.after_request
    # def after_request(response):
    #     response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    #     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    #     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    #     response.headers.add('Access-Control-Allow-Credentials', 'true')
    #     return response
    return app