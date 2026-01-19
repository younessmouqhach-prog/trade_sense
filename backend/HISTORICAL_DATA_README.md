# Historical OHLC Data System

This system generates and serves historical OHLC (Open, High, Low, Close) data with volume for trading charts.

## Data Format

Each historical data file follows this exact format:
```csv
date,open,high,low,close,volume
2024-01-01,100.50,105.25,98.75,103.20,120000
2024-01-02,103.20,107.80,101.50,106.45,98000
```

## File Structure

```
backend/data/historical/
├── nvda_daily.csv          # NVIDIA daily data
├── aapl_daily.csv          # Apple daily data
├── btcusd_daily.csv        # Bitcoin USD daily data
├── eurusd_daily.csv        # EUR/USD forex daily data
└── [symbol]_daily.csv      # All other symbols
```

## Generation Process

1. **Data Source**: Current market prices from CSV files
2. **Algorithm**: Realistic price simulation based on volatility and trends
3. **Duration**: 365 days of historical data per symbol
4. **Timeframes**: Daily data (can be extended for intraday)

## Key Features

### Realistic Price Generation
- Uses actual market volatility from current data
- Maintains price trends and patterns
- Generates proper OHLC relationships
- Includes realistic trading volumes

### Automatic Updates
- Generated once via `generate_historical_data.py`
- Cached in CSV files for fast access
- Can be regenerated when needed

### API Integration
- Backend serves data via `/market/history/{symbol}` endpoint
- Frontend prioritizes real historical data over generated data
- Fallback system ensures charts always work

## Usage

### Generate Historical Data
```bash
cd backend
python generate_historical_data.py
```

### API Endpoints
```javascript
// Get historical data for a symbol
GET /market/history/NVDA?timeframe=1d

// Response format
{
  "symbol": "NVDA",
  "timeframe": "1d",
  "candles": [
    {
      "time": 1704067200,
      "open": 186.23,
      "high": 190.50,
      "low": 183.75,
      "close": 188.45,
      "volume": 45000000
    }
  ],
  "current_price": 186.23,
  "change_percent": -0.44
}
```

## Symbols Supported

All symbols from the main CSV files:
- **Stocks**: AAPL, NVDA, GOOGL, MSFT, TSLA, etc.
- **Forex**: EURUSD, GBPUSD, USDJPY, etc.
- **Crypto**: BTCUSD, ETHUSD, etc.
- **Morocco**: All Moroccan stock symbols

## Data Quality

### Realistic Features
- ✅ Proper OHLC relationships (High >= Open/Close, Low <= Open/Close)
- ✅ Realistic volatility based on actual market data
- ✅ Volume data with appropriate ranges
- ✅ Trend preservation from current market conditions
- ✅ Price boundaries to prevent extreme values

### Performance
- ✅ Fast CSV-based storage and retrieval
- ✅ Efficient API responses
- ✅ Minimal memory usage
- ✅ Scalable for thousands of symbols

## Future Enhancements

1. **Intraday Data**: Add 1H, 15M, 5M timeframes
2. **Real API Integration**: Connect to actual historical data providers
3. **Data Validation**: Ensure OHLC mathematical consistency
4. **Compression**: Optimize storage for large datasets
5. **Updates**: Automatic daily data updates