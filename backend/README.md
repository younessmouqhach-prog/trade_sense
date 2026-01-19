# TradeSense Backend API

Flask REST API for TradeSense Prop Trading Platform.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize database:
```bash
python -c "from app import create_app; app = create_app(); app.app_context().push(); from extensions import db; db.create_all()"
```

4. Run the application:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Challenges
- `GET /api/challenges/templates` - Get challenge templates
- `GET /api/challenges/my-challenges` - Get user's challenges
- `GET /api/challenges/active` - Get active challenge

### Trades
- `POST /api/trades/buy` - Execute buy trade
- `POST /api/trades/sell` - Execute sell trade
- `GET /api/trades/` - Get user's trades

### Market Data
- `GET /api/market/price/<symbol>` - Get price for symbol
- `POST /api/market/prices` - Get multiple prices
- `GET /api/market/popular` - Get popular symbols
- `GET /api/market/moroccan` - Get Moroccan stocks

### Payments
- `POST /api/payments/process/cmi` - Process CMI payment
- `POST /api/payments/process/crypto` - Process crypto payment
- `POST /api/payments/paypal/create` - Create PayPal order
- `POST /api/payments/paypal/capture` - Capture PayPal order

### Leaderboard
- `GET /api/leaderboard/` - Get monthly leaderboard
- `GET /api/leaderboard/all-time` - Get all-time leaderboard

### Admin
- `GET /api/admin/challenges` - Get all challenges
- `PUT /api/admin/challenges/<id>/status` - Update challenge status
- `GET /api/admin/paypal/config` - Get PayPal config (SuperAdmin)
- `POST /api/admin/paypal/config` - Update PayPal config (SuperAdmin)

## Database

The application uses SQLAlchemy ORM. For production, use PostgreSQL:

```bash
DATABASE_URL=postgresql://user:password@localhost/tradesense
```

## Deployment

Deploy to Render/Railway with:
- Python 3.10+
- PostgreSQL database
- Environment variables configured
