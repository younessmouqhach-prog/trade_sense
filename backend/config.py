import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Handle Render/Heroku DATABASE_URL which often starts with postgres:// instead of postgresql://
    db_url = os.environ.get('DATABASE_URL')
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = db_url or 'sqlite:///tradesense.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # PayPal Configuration (configured by SuperAdmin)
    PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID') or ''
    PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET') or ''
    PAYPAL_MODE = os.environ.get('PAYPAL_MODE') or 'sandbox'  # sandbox or live
    
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS') or '*'
    
    # Challenge Configuration
    INITIAL_BALANCE = 5000.0
    MAX_DAILY_LOSS_PERCENT = 5.0
    MAX_TOTAL_DRAWDOWN_PERCENT = 10.0
    PROFIT_TARGET_PERCENT = 10.0
    
    # Pricing Tiers (in MAD)
    PRICING_TIERS = {
        'starter': 200.0,
        'pro': 500.0,
        'elite': 1000.0
    }
    
    # Market Data Refresh Rate (seconds)
    MARKET_DATA_REFRESH_RATE = 30
    
    # Alpha Vantage Configuration
    ALPHA_VANTAGE_API_KEY = os.environ.get('ALPHA_VANTAGE_API_KEY') or 'UBS29NS8S6LTOKKU'

    # NewsAPI Configuration
    NEWSAPI_API_KEY = os.environ.get('NEWSAPI_API_KEY') or 'demo-key-change-in-production'
    NEWSAPI_BASE_URL = 'https://newsapi.org/v2'
    NEWS_CACHE_TTL = 120  # seconds

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
