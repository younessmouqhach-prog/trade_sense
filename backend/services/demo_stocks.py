"""Demo stock data as fallback when API calls fail"""
from datetime import datetime

DEMO_STOCKS = [
    {'symbol': 'AAPL', 'price': 195.89, 'change': 2.34, 'change_percent': 1.21, 'source': 'demo'},
    {'symbol': 'MSFT', 'price': 378.85, 'change': -1.23, 'change_percent': -0.32, 'source': 'demo'},
    {'symbol': 'GOOGL', 'price': 140.25, 'change': 3.45, 'change_percent': 2.52, 'source': 'demo'},
    {'symbol': 'AMZN', 'price': 151.94, 'change': -0.87, 'change_percent': -0.57, 'source': 'demo'},
    {'symbol': 'TSLA', 'price': 248.50, 'change': 12.30, 'change_percent': 5.20, 'source': 'demo'},
    {'symbol': 'META', 'price': 485.39, 'change': 8.21, 'change_percent': 1.72, 'source': 'demo'},
    {'symbol': 'NVDA', 'price': 875.28, 'change': 45.67, 'change_percent': 5.51, 'source': 'demo'},
    {'symbol': 'NFLX', 'price': 492.98, 'change': -5.43, 'change_percent': -1.09, 'source': 'demo'},
    {'symbol': 'AMD', 'price': 162.51, 'change': 3.21, 'change_percent': 2.01, 'source': 'demo'},
    {'symbol': 'INTC', 'price': 44.62, 'change': -0.32, 'change_percent': -0.71, 'source': 'demo'},
    {'symbol': 'DIS', 'price': 95.67, 'change': 1.45, 'change_percent': 1.54, 'source': 'demo'},
    {'symbol': 'V', 'price': 270.83, 'change': 2.18, 'change_percent': 0.81, 'source': 'demo'},
    {'symbol': 'JPM', 'price': 189.42, 'change': -1.23, 'change_percent': -0.64, 'source': 'demo'},
    {'symbol': 'WMT', 'price': 161.08, 'change': 0.89, 'change_percent': 0.56, 'source': 'demo'},
    {'symbol': 'JNJ', 'price': 155.73, 'change': 1.12, 'change_percent': 0.72, 'source': 'demo'},
    {'symbol': 'PG', 'price': 162.85, 'change': -0.45, 'change_percent': -0.28, 'source': 'demo'},
    {'symbol': 'MA', 'price': 446.52, 'change': 5.67, 'change_percent': 1.29, 'source': 'demo'},
    {'symbol': 'UNH', 'price': 523.47, 'change': -3.21, 'change_percent': -0.61, 'source': 'demo'},
    {'symbol': 'HD', 'price': 386.22, 'change': 4.32, 'change_percent': 1.13, 'source': 'demo'},
    {'symbol': 'PYPL', 'price': 63.45, 'change': 1.23, 'change_percent': 1.98, 'source': 'demo'},
    {'symbol': 'BAC', 'price': 35.78, 'change': -0.32, 'change_percent': -0.89, 'source': 'demo'},
    {'symbol': 'CMCSA', 'price': 45.67, 'change': 0.56, 'change_percent': 1.24, 'source': 'demo'},
    {'symbol': 'XOM', 'price': 108.45, 'change': 2.34, 'change_percent': 2.20, 'source': 'demo'},
    {'symbol': 'COST', 'price': 729.56, 'change': 8.90, 'change_percent': 1.24, 'source': 'demo'},
    {'symbol': 'AVGO', 'price': 1324.78, 'change': 25.43, 'change_percent': 1.96, 'source': 'demo'},
    {'symbol': 'PEP', 'price': 176.23, 'change': -0.87, 'change_percent': -0.49, 'source': 'demo'},
    {'symbol': 'TMO', 'price': 565.34, 'change': 3.21, 'change_percent': 0.57, 'source': 'demo'},
    {'symbol': 'ABBV', 'price': 175.89, 'change': 2.45, 'change_percent': 1.41, 'source': 'demo'},
    {'symbol': 'CSCO', 'price': 53.21, 'change': 0.67, 'change_percent': 1.27, 'source': 'demo'},
    {'symbol': 'ADBE', 'price': 585.67, 'change': 12.34, 'change_percent': 2.15, 'source': 'demo'},
]

def get_demo_stocks_with_timestamp():
    """Return demo stocks with current timestamp"""
    now = datetime.utcnow().isoformat()
    return [{**stock, 'timestamp': now} for stock in DEMO_STOCKS]
