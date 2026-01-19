import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
import json
import re
from config import Config

class MarketService:
    """Market data service for fetching prices"""
    
    # Cache for market data
    _cache = {}
    _cache_timeout = 30  # seconds
    _symbols_cache = None
    _symbols_cache_time = 0
    _symbols_cache_ttl = 24 * 60 * 60  # 24 hours
    _screener_cache = None
    _screener_cache_time = 0
    _screener_cache_timeout = 60  # Cache screener data for 60 seconds
    
    def _fetch_tradingview_screener(self):
        """Fetch top 30 international stocks from CSV file (refreshed by scheduler)."""
        # Read from CSV file first (updated every minute by scheduler)
        try:
            from utils.bvcscrap import BVCscrap
            scraper = BVCscrap(market_type='stocks')
            csv_data = scraper.read_from_csv()
            if csv_data:
                print(f"[MarketService] Loaded {len(csv_data)} stocks from CSV")
                return csv_data
        except Exception as e:
            print(f"[MarketService] Error reading from CSV: {e}")
        
        # Fallback to cache if CSV read fails
        current_time = time.time()
        if self._screener_cache and (current_time - self._screener_cache_time) < self._screener_cache_timeout:
            print("[MarketService] Using cached data")
            return self._screener_cache
        
        # If CSV read failed, try demo data as fallback
        print("[MarketService] CSV read failed, trying demo data fallback")
        try:
            from services.demo_stocks import get_demo_stocks_with_timestamp
            demo_data = get_demo_stocks_with_timestamp()
            print(f"[MarketService] Using {len(demo_data)} demo stocks as fallback")
            return demo_data
        except ImportError:
            print("[MarketService] Could not import demo stocks fallback")
            return []
    
    def get_international_price(self, symbol):
        """Fetch international stock price using TradingView screener data."""
        cache_key = f"int_{symbol}"
        current_time = time.time()
        
        # Check cache
        if cache_key in self._cache:
            cached_data, cache_time = self._cache[cache_key]
            if current_time - cache_time < self._cache_timeout:
                return cached_data
        
        # Fetch from TradingView screener (returns multiple stocks)
        screener_data = self._fetch_tradingview_screener()
        
        # Find the requested symbol in screener data
        for stock in screener_data:
            if stock['symbol'].upper() == symbol.upper():
                self._cache[cache_key] = (stock, current_time)
                return stock
        
        return None
    
    def get_moroccan_stock_price(self, symbol):
        """No Moroccan data source available."""
        return None
    
    def get_price(self, symbol):
        """Get price for any symbol"""
        return self.get_international_price(symbol)
    
    def get_multiple_prices(self, symbols):
        """Get prices for multiple symbols from TradingView screener (all at once)."""
        # Fetch all screener data once (gets 30 stocks)
        screener_data = self._fetch_tradingview_screener()
        
        # Create a lookup dict
        screener_dict = {stock['symbol'].upper(): stock for stock in screener_data}
        
        results = {}
        current_time = time.time()
        
        for sym in symbols:
            sym_upper = sym.upper()
            if sym_upper in screener_dict:
                stock = screener_dict[sym_upper]
                # Update cache
                cache_key = f"int_{sym_upper}"
                self._cache[cache_key] = (stock, current_time)
                results[sym] = stock
        
        return results

    def get_all_symbols(self, query=None, limit=50):
        """Get all US-listed symbols (cached), optionally filtered by query."""
        now = time.time()
        if self._symbols_cache and (now - self._symbols_cache_time) < self._symbols_cache_ttl:
            symbols = self._symbols_cache
        else:
            try:
                url = "https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/master/all/all_tickers.txt"
                response = requests.get(url, timeout=15)
                response.raise_for_status()
                lines = [line.strip().upper() for line in response.text.splitlines() if line.strip()]
                symbols = [
                    {
                        "symbol": ticker,
                        "name": "",
                        "exchange": "US"
                    }
                    for ticker in lines
                ]
                symbols = sorted(symbols, key=lambda s: s["symbol"])
                self._symbols_cache = symbols
                self._symbols_cache_time = now
            except Exception:
                symbols = self._symbols_cache or []

        # If cache is empty (e.g., previous fetch failed), force refresh once
        if not symbols:
            try:
                url = "https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/master/all/all_tickers.txt"
                response = requests.get(url, timeout=15)
                response.raise_for_status()
                lines = [line.strip().upper() for line in response.text.splitlines() if line.strip()]
                symbols = [
                    {
                        "symbol": ticker,
                        "name": "",
                        "exchange": "US"
                    }
                    for ticker in lines
                ]
                symbols = sorted(symbols, key=lambda s: s["symbol"])
                self._symbols_cache = symbols
                self._symbols_cache_time = now
            except Exception:
                symbols = self._symbols_cache or []

        if query:
            q = query.upper()
            symbols = [s for s in symbols if q in s["symbol"]]

        if limit:
            return symbols[:limit]
        return symbols
