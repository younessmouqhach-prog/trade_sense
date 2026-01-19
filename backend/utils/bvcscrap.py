"""BVCscrap - BeautifulSoup-based scraper for market data"""
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
import csv
import os
import time
import random

class BVCscrap:
    """Scraper for fetching market data from TradingView"""
    
    def __init__(self, market_type='stocks'):
        """
        Initialize scraper for a specific market type
        market_type: 'stocks', 'forex', 'crypto', or 'morocco'
        """
        self.market_type = market_type
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Define CSV paths for each market type
        csv_files = {
            'stocks': 'market_data_stocks.csv',
            'forex': 'market_data_forex.csv',
            'crypto': 'market_data_crypto.csv',
            'morocco': 'market_data_morocco.csv'
        }
        
        csv_filename = csv_files.get(market_type, 'market_data_stocks.csv')
        csv_path = os.path.join(base_dir, 'data', csv_filename)
        self.csv_path = os.path.abspath(csv_path)
        self.ensure_data_directory()
    
    def ensure_data_directory(self):
        """Create data directory if it doesn't exist"""
        data_dir = os.path.dirname(self.csv_path)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)
    
    def scrape_stocks(self):
        """Scrape top 30 stocks from TradingView screener"""
        try:
            url = "https://scanner.tradingview.com/america/scan"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://www.tradingview.com',
                'Referer': 'https://www.tradingview.com/screener/'
            }
            
            payload = {
                "filter": [
                    {
                        "left": "market_cap_basic",
                        "operation": "in_range",
                        "right": [1000000000, 10000000000000]
                    },
                    {
                        "left": "exchange",
                        "operation": "in_range",
                        "right": ["NYSE", "NASDAQ"]
                    }
                ],
                "options": {"lang": "en"},
                "markets": ["america"],
                "symbols": {"query": {"types": []}, "tickers": []},
                "columns": ["name", "close", "change", "change_abs"],
                "sort": {"sortBy": "market_cap_basic", "sortOrder": "desc"},
                "range": [0, 30]
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"[BVCscrap] Stocks API returned status {response.status_code}")
                return []
            
            data = response.json()
            
            if not data or 'data' not in data:
                print("[BVCscrap] No stocks data in response")
                return []
            
            items = []
            timestamp = datetime.utcnow().isoformat()
            
            for item in data['data']:
                d = item.get('d', [])
                if len(d) < 4:
                    continue
                
                try:
                    symbol = item.get('s', '')
                    name = d[0] if len(d) > 0 else ''
                    close = float(d[1]) if len(d) > 1 and d[1] is not None else 0
                    change_percent = float(d[2]) if len(d) > 2 and d[2] is not None else 0
                    change = float(d[3]) if len(d) > 3 and d[3] is not None else 0
                    
                    if symbol and close > 0:
                        clean_symbol = symbol.split(':')[1] if ':' in symbol else symbol
                        items.append({
                            'symbol': clean_symbol,
                            'name': name,
                            'price': close,
                            'change': change,
                            'change_percent': change_percent,
                            'timestamp': timestamp,
                            'source': 'tradingview'
                        })
                except (ValueError, IndexError, TypeError) as e:
                    print(f"[BVCscrap] Error parsing stock item: {e}")
                    continue
            
            print(f"[BVCscrap] Successfully scraped {len(items)} stocks")
            return items
            
        except Exception as e:
            print(f"[BVCscrap] Stocks scraper error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def scrape_forex(self):
        """Scrape top 30 forex pairs from TradingView"""
        try:
            url = "https://scanner.tradingview.com/forex/scan"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://www.tradingview.com',
                'Referer': 'https://www.tradingview.com/screener/'
            }
            
            # Top forex pairs by volume
            payload = {
                "filter": [],
                "options": {"lang": "en"},
                "markets": ["forex"],
                "symbols": {"query": {"types": []}, "tickers": []},
                "columns": ["name", "close", "change", "change_abs"],
                "sort": {"sortBy": "change", "sortOrder": "desc"},
                "range": [0, 30]
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"[BVCscrap] Forex API returned status {response.status_code}")
                return []
            
            data = response.json()
            
            if not data or 'data' not in data:
                print("[BVCscrap] No forex data in response")
                return []
            
            items = []
            timestamp = datetime.utcnow().isoformat()
            
            for item in data['data']:
                d = item.get('d', [])
                if len(d) < 4:
                    continue
                
                try:
                    symbol = item.get('s', '')
                    name = d[0] if len(d) > 0 else ''
                    close = float(d[1]) if len(d) > 1 and d[1] is not None else 0
                    change_percent = float(d[2]) if len(d) > 2 and d[2] is not None else 0
                    change = float(d[3]) if len(d) > 3 and d[3] is not None else 0
                    
                    if symbol and close > 0:
                        # Format: FX:GBPUSD, FX_IDC:GBPUSD, OANDA:GBPUSD -> GBPUSD
                        clean_symbol = symbol.replace('FX:', '').replace('FX_IDC:', '').replace('OANDA:', '').split(':')[-1]
                        items.append({
                            'symbol': clean_symbol,
                            'name': name or clean_symbol,
                            'price': close,
                            'change': change,
                            'change_percent': change_percent,
                            'timestamp': timestamp,
                            'source': 'tradingview'
                        })
                except (ValueError, IndexError, TypeError) as e:
                    print(f"[BVCscrap] Error parsing forex item: {e}")
                    continue
            
            print(f"[BVCscrap] Successfully scraped {len(items)} forex pairs")
            return items
            
        except Exception as e:
            print(f"[BVCscrap] Forex scraper error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def scrape_crypto(self):
        """Scrape top 30 cryptocurrencies from TradingView"""
        try:
            url = "https://scanner.tradingview.com/crypto/scan"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://www.tradingview.com',
                'Referer': 'https://www.tradingview.com/screener/'
            }
            
            payload = {
                "filter": [
                    {
                        "left": "market_cap_calc",
                        "operation": "in_range",
                        "right": [1000000, 1000000000000]
                    }
                ],
                "options": {"lang": "en"},
                "markets": ["crypto"],
                "symbols": {"query": {"types": []}, "tickers": []},
                "columns": ["name", "close", "change", "change_abs"],
                "sort": {"sortBy": "market_cap_calc", "sortOrder": "desc"},
                "range": [0, 30]
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"[BVCscrap] Crypto API returned status {response.status_code}")
                return []
            
            data = response.json()
            
            if not data or 'data' not in data:
                print("[BVCscrap] No crypto data in response")
                return []
            
            items = []
            seen_symbols = set()  # Track unique symbols
            timestamp = datetime.utcnow().isoformat()
            
            for item in data['data']:
                d = item.get('d', [])
                if len(d) < 4:
                    continue
                
                try:
                    symbol = item.get('s', '')
                    name = d[0] if len(d) > 0 else ''
                    close = float(d[1]) if len(d) > 1 and d[1] is not None else 0
                    change_percent = float(d[2]) if len(d) > 2 and d[2] is not None else 0
                    change = float(d[3]) if len(d) > 3 and d[3] is not None else 0
                    
                    if symbol and close > 0:
                        # Format: BINANCE:BTCUSDT -> BTCUSDT
                        clean_symbol = symbol.split(':')[-1] if ':' in symbol else symbol
                        
                        # Only add if we haven't seen this symbol yet (keep first occurrence)
                        if clean_symbol not in seen_symbols:
                            seen_symbols.add(clean_symbol)
                            items.append({
                                'symbol': clean_symbol,
                                'name': name or clean_symbol,
                                'price': close,
                                'change': change,
                                'change_percent': change_percent,
                                'timestamp': timestamp,
                                'source': 'tradingview'
                            })
                except (ValueError, IndexError, TypeError) as e:
                    print(f"[BVCscrap] Error parsing crypto item: {e}")
                    continue
            
            print(f"[BVCscrap] Successfully scraped {len(items)} cryptocurrencies (unique)")
            return items
            
        except Exception as e:
            print(f"[BVCscrap] Crypto scraper error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def scrape_morocco(self):
        """Scrape all Moroccan stocks from Casablanca Stock Exchange live market page"""
        try:
            items = []
            timestamp = datetime.utcnow().isoformat()
            
            url = "https://www.casablanca-bourse.com/en/live-market/marche-actions-groupement"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
            
            print(f"[BVCscrap] Fetching Moroccan stocks from: {url}")
            response = requests.get(url, headers=headers, timeout=15, verify=False)
            
            if response.status_code != 200:
                print(f"[BVCscrap] Morocco page returned status {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.text, 'html.parser')
            tables = soup.find_all('table')
            
            print(f"[BVCscrap] Found {len(tables)} tables on Morocco page")
            
            for table_idx, table in enumerate(tables):
                tbody = table.find('tbody')
                if not tbody:
                    continue
                
                rows = tbody.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) < 8:  # Need at least 8 columns (Instrument, Status, Reference, Opening, Close, Quantity, Volume, Change %)
                        continue
                    
                    try:
                        # Extract data from cells
                        # Column 0: Instrument name
                        instrument = cells[0].get_text(strip=True)
                        if not instrument or instrument == 'Instrument':
                            continue
                        
                        # Column 1: Status (T = Traded, N.T = Not Traded, S = Suspended)
                        status = cells[1].get_text(strip=True)
                        
                        # Column 2: Reference price
                        reference_text = cells[2].get_text(strip=True)
                        reference_price = self._parse_morocco_number(reference_text)
                        
                        # Column 3: Opening price
                        opening_text = cells[3].get_text(strip=True)
                        opening_price = self._parse_morocco_number(opening_text)
                        
                        # Column 4: Close price (current price)
                        close_text = cells[4].get_text(strip=True)
                        close_price = self._parse_morocco_number(close_text)
                        
                        # Column 7: Change in %
                        change_percent_text = cells[7].get_text(strip=True)
                        change_percent = self._parse_morocco_percent(change_percent_text)
                        
                        # Skip if no valid price data or status indicates not traded/suspended
                        if close_price <= 0 and status in ['N.T', 'S']:
                            continue
                        
                        # Use close price as current price, fallback to reference if close is 0
                        current_price = close_price if close_price > 0 else reference_price
                        
                        if current_price <= 0:
                            continue
                        
                        # Calculate change from reference price
                        change = current_price - reference_price if reference_price > 0 else 0.0
                        
                        # Extract symbol from instrument name (usually first word or acronym)
                        symbol = self._extract_symbol_from_instrument(instrument)
                        
                        # Convert MAD to USD (approximate rate: 1 MAD ≈ 0.10 USD)
                        # We'll use a cached rate or fetch it
                        usd_rate = self._get_usd_mad_rate()
                        price_usd = current_price * usd_rate
                        change_usd = change * usd_rate
                        
                        items.append({
                            'symbol': symbol,
                            'name': instrument,
                            'price': price_usd,  # Store USD price as main price
                            'price_mad': current_price,  # Keep MAD price for reference
                            'change': change_usd,  # Change in USD
                            'change_mad': change,  # Change in MAD
                            'change_percent': change_percent,
                            'timestamp': timestamp,
                            'source': 'casablanca-bourse',
                            'currency': 'USD'
                        })
                        
                    except (ValueError, IndexError, AttributeError) as e:
                        print(f"[BVCscrap] Error parsing row in table {table_idx + 1}: {e}")
                        continue
            
            print(f"[BVCscrap] Successfully scraped {len(items)} Moroccan stocks from Casablanca Bourse")
            return items
        
        except Exception as e:
            print(f"[BVCscrap] Morocco scraper error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _parse_morocco_number(self, text):
        """Helper to parse Moroccan number format (e.g., '2 194,00' or '950,10')"""
        if not text or text == '-' or text.strip() == '':
            return 0.0
        try:
            # Remove spaces (thousand separators) and replace comma with dot (decimal separator)
            cleaned = text.replace(' ', '').replace(',', '.').strip()
            return float(cleaned)
        except (ValueError, AttributeError):
            return 0.0
    
    def _parse_morocco_percent(self, text):
        """Helper to parse percentage change (e.g., '-0,68%' or '0,51%')"""
        if not text or text == '-' or text.strip() == '':
            return 0.0
        try:
            # Remove % and parse as number
            cleaned = text.replace('%', '').replace(' ', '').replace(',', '.').strip()
            return float(cleaned)
        except (ValueError, AttributeError):
            return 0.0
    
    def _extract_symbol_from_instrument(self, instrument_name):
        """Extract stock symbol from full instrument name"""
        if not instrument_name:
            return 'UNKNOWN'
        
        # Common patterns:
        # - "TAQA MOROCCO" -> "TAQA"
        # - "SODEP-Marsa Maroc" -> "SODEP" or extract from common abbreviations
        # - "ATTIJARIWAFA BANK" -> "ATW" (common abbreviation)
        
        # Remove common suffixes
        name = instrument_name.upper().strip()
        
        # Map common full names to symbols
        symbol_map = {
            'TAQA MOROCCO': 'TAQA',
            'SODEP-MARSA MAROC': 'SODEP',
            'ARADEI CAPITAL': 'ARADEI',
            'BALIMA': 'BALO',
            'CARTIER SAADA': 'CARTIER',
            'COSUMAR': 'COSUMAR',
            'AFMA': 'AFMA',
            'AGMA': 'AGMA',
            'AFRIC INDUSTRIES SA': 'AFRI',
            'ALUMINIUM DU MAROC': 'ALM',
            'ATTIJARIWAFA BANK': 'ATW',
            'BANK OF AFRICA': 'BOA',
            'OULMES': 'OULMES',
            'SOCIETE DES BOISSONS DU MAROC': 'SBM',
            'MAGHREB OXYGENE': 'MAGHREB',
            'SNEP': 'SNEP',
            'AUTO HALL': 'AUTO HALL',
            'AUTO NEJMA': 'NEJMA',
            'DELATTRE LEVIVIER MAROC': 'DELATTRE',
            'STROC INDUSTRIE': 'STROC',
            'ALLIANCES': 'ALLIANCES',
            'DOUJA PROM ADDOHA': 'DOUJA',
            'RISMA': 'RISMA',
            'DISTY TECHNOLOGIES': 'DISTY',
            'DISWAY': 'DISWAY',
            'MANAGEM': 'MANAGEM',
            'MINIERE TOUISSIT': 'MINIERE',
            'AFRIQUIA GAZ': 'AFRIQUIA',
            'SAMIR': 'SAMIR',
            'PROMOPHARM S.A.': 'PROMOPHARM',
            'SOTHEMA': 'SOTHEMA',
            'MED PAPER': 'MED PAPER',
            'CASH PLUS S.A': 'CASH PLUS',
            'DIAC SALAF': 'DIAC',
            'DELTA HOLDING': 'DELTA',
            'ZELLIDJA S.A': 'ZELLIDJA',
            'ITISALAT AL-MAGHRIB': 'IAM',
            'CTM': 'CTM',
            'AKDITAL': 'AKD',
            'VICENNE': 'VICENNE',
            'CMGP GROUP': 'CMGP',
        }
        
        # Check if we have a direct mapping
        if name in symbol_map:
            return symbol_map[name]
        
        # Try to extract from first word or acronym
        words = name.split()
        if words:
            # Take first word, up to 6 characters
            symbol = words[0][:6]
            return symbol
        
        # Fallback: use first 6 chars of name
        return name[:6] if len(name) > 6 else name
    
    def _parse_price(self, text):
        """Helper to parse price from text (legacy method, kept for compatibility)"""
        return self._parse_morocco_number(text)
    
    def _parse_change(self, text):
        """Helper to parse change from text (returns change and change_percent) (legacy method)"""
        if not text:
            return 0.0, 0.0
        try:
            percent = self._parse_morocco_percent(text)
            return 0.0, percent
        except (ValueError, AttributeError):
            return 0.0, 0.0
    
    _usd_mad_rate_cache = None
    _usd_mad_rate_cache_time = 0
    _usd_mad_rate_cache_ttl = 3600  # Cache for 1 hour
    
    def _get_usd_mad_rate(self):
        """Get USD/MAD exchange rate, with caching"""
        current_time = time.time()
        
        # Return cached rate if still valid
        if self._usd_mad_rate_cache and (current_time - self._usd_mad_rate_cache_time) < self._usd_mad_rate_cache_ttl:
            return self._usd_mad_rate_cache
        
        # Try to fetch live rate from free API
        try:
            # Using exchangerate-api.com (free tier: 1500 requests/month)
            response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=5)
            if response.status_code == 200:
                data = response.json()
                mad_rate = data.get('rates', {}).get('MAD', None)
                if mad_rate:
                    # Convert to USD per MAD (1 MAD = 1/USD_MAD_rate USD)
                    usd_per_mad = 1.0 / mad_rate
                    self._usd_mad_rate_cache = usd_per_mad
                    self._usd_mad_rate_cache_time = current_time
                    print(f"[BVCscrap] Fetched USD/MAD rate: {usd_per_mad:.6f}")
                    return usd_per_mad
        except Exception as e:
            print(f"[BVCscrap] Error fetching USD/MAD rate: {e}, using fallback rate")
        
        # Fallback to approximate rate (1 MAD ≈ 0.10 USD)
        fallback_rate = 0.10
        self._usd_mad_rate_cache = fallback_rate
        self._usd_mad_rate_cache_time = current_time
        return fallback_rate
    
    def scrape(self):
        """Scrape data based on market type"""
        if self.market_type == 'stocks':
            return self.scrape_stocks()
        elif self.market_type == 'forex':
            return self.scrape_forex()
        elif self.market_type == 'crypto':
            return self.scrape_crypto()
        elif self.market_type == 'morocco':
            return self.scrape_morocco()
        else:
            return []
    
    def save_to_csv(self, items):
        """Save market data to CSV file"""
        if not items:
            print(f"[BVCscrap] No {self.market_type} data to save")
            return False
        
        try:
            # Write to CSV
            with open(self.csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                # Determine fieldnames based on market type
                base_fieldnames = ['symbol', 'name', 'price', 'change', 'change_percent', 'timestamp', 'source']
                if self.market_type == 'morocco':
                    # Add MAD fields for Moroccan stocks
                    fieldnames = base_fieldnames + ['price_mad', 'change_mad', 'currency']
                else:
                    fieldnames = base_fieldnames
                
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for item in items:
                    writer.writerow(item)
            
            print(f"[BVCscrap] Saved {len(items)} {self.market_type} items to {self.csv_path}")
            return True
        except Exception as e:
            print(f"[BVCscrap] Error saving {self.market_type} to CSV: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def scrape_and_save(self):
        """Scrape data and save to CSV"""
        print(f"[BVCscrap] Starting {self.market_type} scrape at {datetime.utcnow()}")
        items = self.scrape()
        if items:
            return self.save_to_csv(items)
        return False
    
    def read_from_csv(self):
        """Read market data from CSV file"""
        # Normalize path to absolute path
        csv_path = os.path.abspath(self.csv_path)
        
        if not os.path.exists(csv_path):
            print(f"[BVCscrap] CSV file not found: {csv_path}")
            return []
        
        try:
            items = []
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    # Skip empty rows
                    if not row.get('symbol') or not row.get('price'):
                        continue
                    item = {
                        'symbol': row['symbol'],
                        'name': row.get('name', ''),
                        'price': float(row['price']),
                        'change': float(row.get('change', 0)),
                        'change_percent': float(row.get('change_percent', 0)),
                        'timestamp': row.get('timestamp', ''),
                        'source': row.get('source', 'tradingview')
                    }
                    # Add MAD fields if they exist (for Moroccan stocks)
                    if 'price_mad' in row and row['price_mad']:
                        item['price_mad'] = float(row['price_mad'])
                    if 'change_mad' in row and row['change_mad']:
                        item['change_mad'] = float(row['change_mad'])
                    if 'currency' in row:
                        item['currency'] = row['currency']
                    items.append(item)
            print(f"[BVCscrap] Successfully read {len(items)} {self.market_type} items from CSV: {csv_path}")
            return items
        except Exception as e:
            import traceback
            print(f"[BVCscrap] Error reading {self.market_type} from CSV: {e}")
            traceback.print_exc()
            return []

    def generate_historical_data(self, symbol, days=365):
        """Generate historical OHLC data for a symbol"""
        try:
            # Get current price data
            current_data = self.read_from_csv()
            symbol_data = None

            for item in current_data:
                if item['symbol'].upper() == symbol.upper():
                    symbol_data = item
                    break

            if not symbol_data:
                print(f"[BVCscrap] Symbol {symbol} not found in current data")
                return []

            # Start from current price and work backwards
            current_price = float(symbol_data['price'])
            base_date = datetime.utcnow().date()

            historical_data = []

            # Generate data for the specified number of days
            for i in range(days):
                date = base_date - timedelta(days=i)
                date_str = date.isoformat()

                # For the most recent data (i=0), use current price
                if i == 0:
                    price = current_price
                else:
                    # Generate realistic price movements
                    # Use a random walk with some trend and volatility
                    volatility = 0.02  # 2% daily volatility
                    trend = random.uniform(-0.001, 0.001)  # Small daily trend
                    change = random.gauss(0, volatility)  # Normal distribution
                    price = price * (1 + trend + change)

                    # Ensure price doesn't go negative or too extreme
                    price = max(price, 0.01)
                    price = min(price, current_price * 10)  # Cap at 10x current price

                # Generate OHLC data
                daily_volatility = abs(random.gauss(0, 0.01))  # Daily volatility

                # Create realistic OHLC
                open_price = price * (1 + random.uniform(-daily_volatility, daily_volatility))
                close_price = price

                # High and low based on intraday movement
                intraday_range = abs(random.gauss(0, daily_volatility * 2))
                high_price = max(open_price, close_price) * (1 + intraday_range)
                low_price = min(open_price, close_price) * (1 - intraday_range)

                # Generate volume (realistic trading volume)
                base_volume = random.randint(10000, 1000000)  # 10K to 1M shares
                volume = int(base_volume * (1 + random.uniform(-0.5, 0.5)))

                historical_data.append({
                    'date': date_str,
                    'open': round(open_price, 4),
                    'high': round(high_price, 4),
                    'low': round(low_price, 4),
                    'close': round(close_price, 4),
                    'volume': volume
                })

            # Sort by date (oldest first)
            historical_data.sort(key=lambda x: x['date'])

            print(f"[BVCscrap] Generated {len(historical_data)} days of historical data for {symbol}")
            return historical_data

        except Exception as e:
            print(f"[BVCscrap] Error generating historical data: {e}")
            import traceback
            traceback.print_exc()
            return []

    def save_historical_data(self, symbol, historical_data, timeframe='daily'):
        """Save historical data to CSV file"""
        try:
            # Create historical data directory
            historical_dir = os.path.join(os.path.dirname(self.csv_path), 'historical')
            os.makedirs(historical_dir, exist_ok=True)

            # Create filename with symbol and timeframe
            filename = f"{symbol.lower()}_{timeframe}.csv"
            filepath = os.path.join(historical_dir, filename)

            # Write to CSV
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['date', 'open', 'high', 'low', 'close', 'volume']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()

                for row in historical_data:
                    writer.writerow(row)

            print(f"[BVCscrap] Saved {len(historical_data)} historical records to {filepath}")
            return filepath

        except Exception as e:
            print(f"[BVCscrap] Error saving historical data: {e}")
            import traceback
            traceback.print_exc()
            return None

    def read_historical_data(self, symbol, timeframe='daily'):
        """Read historical data from CSV file with robust error handling"""
        try:
            historical_dir = os.path.join(os.path.dirname(self.csv_path), 'historical')
            filename = f"{symbol.lower()}_{timeframe}.csv"
            filepath = os.path.join(historical_dir, filename)

            if not os.path.exists(filepath):
                print(f"[BVCscrap] Historical data file not found: {filepath}")
                return []

            historical_data = []
            row_count = 0
            valid_rows = 0

            with open(filepath, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row_num, row in enumerate(reader, start=2):  # Start at 2 to account for header
                    row_count += 1

                    try:
                        # Validate required fields exist and are not empty
                        required_fields = ['date', 'open', 'high', 'low', 'close', 'volume']
                        if not all(field in row and row[field] and row[field].strip() for field in required_fields):
                            print(f"[BVCscrap] Skipping row {row_num}: missing required fields - {row}")
                            continue

                        # Parse and validate date
                        date_str = row['date'].strip()
                        try:
                            # Try to parse the date to ensure it's valid
                            datetime.fromisoformat(date_str)
                        except ValueError as e:
                            print(f"[BVCscrap] Skipping row {row_num}: invalid date format '{date_str}' - {e}")
                            continue

                        # Parse and validate numeric fields
                        try:
                            open_price = float(row['open'].strip())
                            high_price = float(row['high'].strip())
                            low_price = float(row['low'].strip())
                            close_price = float(row['close'].strip())
                            volume = int(float(row['volume'].strip()))  # Handle float strings that should be int

                            # Validate OHLC relationships
                            if high_price < max(open_price, close_price):
                                print(f"[BVCscrap] Warning: row {row_num} high ({high_price}) < max(open,close) ({max(open_price, close_price)})")
                            if low_price > min(open_price, close_price):
                                print(f"[BVCscrap] Warning: row {row_num} low ({low_price}) > min(open,close) ({min(open_price, close_price)})")

                            # Ensure positive values
                            if any(val <= 0 for val in [open_price, high_price, low_price, close_price, volume]):
                                print(f"[BVCscrap] Skipping row {row_num}: non-positive values - {row}")
                                continue

                        except (ValueError, TypeError) as e:
                            print(f"[BVCscrap] Skipping row {row_num}: invalid numeric data - {e}")
                            continue

                        historical_data.append({
                            'date': date_str,
                            'open': open_price,
                            'high': high_price,
                            'low': low_price,
                            'close': close_price,
                            'volume': volume
                        })

                        valid_rows += 1

                    except Exception as e:
                        print(f"[BVCscrap] Error processing row {row_num}: {e} - {row}")
                        continue

            print(f"[BVCscrap] Processed {row_count} rows, {valid_rows} valid for {symbol}")
            return historical_data

        except Exception as e:
            print(f"[BVCscrap] Error reading historical data: {e}")
            import traceback
            traceback.print_exc()
            return []
