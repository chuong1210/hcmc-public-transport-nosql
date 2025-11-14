import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    
    # ArangoDB Configuration
    ARANGO_HOST = os.getenv('ARANGO_HOST', 'http://localhost:8529')
    ARANGO_USERNAME = os.getenv('ARANGO_USERNAME', 'root')
    ARANGO_PASSWORD = os.getenv('ARANGO_PASSWORD', '')
    ARANGO_DATABASE = os.getenv('ARANGO_DATABASE', 'bus_management_hcm')
    
    # Flask Configuration
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    PORT = int(os.getenv('PORT', 5000))

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}