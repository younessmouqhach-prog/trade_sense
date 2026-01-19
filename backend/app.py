from flask import Flask
from dotenv import load_dotenv
import os
from config import config
from extensions import db, jwt, cors
from utils.scheduler import scheduler

# Import blueprints
from resources.auth import auth_bp
from resources.users import users_bp
from resources.challenges import challenges_bp
from resources.trades import trades_bp
from resources.market_data import market_data_bp
from resources.payments import payments_bp
from resources.leaderboard import leaderboard_bp
from resources.admin import admin_bp
from resources.news import news_bp
print("NEWS BLUEPRINT IMPORTED")
from resources.masterclass import masterclass_bp

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def create_app(config_name='default'):
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'].split(','))
    
    # Initialize scheduler
    scheduler.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(challenges_bp, url_prefix='/api/challenges')
    app.register_blueprint(trades_bp, url_prefix='/api/trades')
    app.register_blueprint(market_data_bp, url_prefix='/api/market')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    try:
        app.register_blueprint(news_bp, url_prefix='/api/news')
        print("NEWS BLUEPRINT REGISTERED SUCCESSFULLY")
    except Exception as e:
        print(f"ERROR REGISTERING NEWS BLUEPRINT: {e}")
    app.register_blueprint(masterclass_bp, url_prefix='/api/masterclass')
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Initialize default challenge templates
        from models import Challenge
        if Challenge.query.count() == 0:
            starter = Challenge(
                name='Starter Challenge',
                tier='starter',
                initial_balance=5000.0,
                max_daily_loss_percent=5.0,
                max_total_drawdown_percent=10.0,
                profit_target_percent=10.0,
                price_mad=200.0,
                is_active=True
            )
            pro = Challenge(
                name='Pro Challenge',
                tier='pro',
                initial_balance=5000.0,
                max_daily_loss_percent=5.0,
                max_total_drawdown_percent=10.0,
                profit_target_percent=10.0,
                price_mad=500.0,
                is_active=True
            )
            elite = Challenge(
                name='Elite Challenge',
                tier='elite',
                initial_balance=5000.0,
                max_daily_loss_percent=5.0,
                max_total_drawdown_percent=10.0,
                profit_target_percent=10.0,
                price_mad=1000.0,
                is_active=True
            )
            db.session.add_all([starter, pro, elite])
            db.session.commit()
        
        # Start scheduler
        scheduler.start()
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'service': 'TradeSense API'}, 200

    @app.route('/ping', methods=['GET'])
    def ping():
        return {'status': 'ping endpoint working'}

    @app.route('/', methods=['GET'])
    def index():
        return {'message': 'TradeSense API', 'version': '1.0.0'}, 200

    
    return app

if __name__ == '__main__':
    import os
    config_name = os.environ.get('FLASK_ENV', 'default')
    app = create_app(config_name)

    app.run(host='0.0.0.0', port=5000, debug=config_name == 'development')
