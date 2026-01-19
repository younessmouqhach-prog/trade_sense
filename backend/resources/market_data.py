from flask import Blueprint, request, jsonify
from datetime import datetime
from services.market_service import MarketService

market_data_bp = Blueprint('market_data', __name__)

@market_data_bp.route('/price/<symbol>', methods=['GET'])
def get_price(symbol):
    """Get price for a symbol"""
    try:
        symbol = symbol.upper()
        market_service = MarketService()
        
        price_data = market_service.get_price(symbol)
        if not price_data:
            return jsonify({'error': 'No market data available. The symbol may be invalid or Alpha Vantage rate limit reached (5 calls/minute).'}), 404
        return jsonify({
            'data': price_data
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching price: {str(e)}'}), 500

@market_data_bp.route('/prices', methods=['POST'])
def get_prices():
    """Get prices for multiple symbols"""
    data = request.get_json()
    
    if not data or not data.get('symbols'):
        return jsonify({'error': 'Symbols array is required'}), 400
    
    symbols = [s.upper() for s in data['symbols']]
    market_service = MarketService()
    
    prices = market_service.get_multiple_prices(symbols)
    
    return jsonify({
        'prices': prices
    }), 200

@market_data_bp.route('/popular', methods=['GET'])
def get_popular_prices():
    """Get popular stocks from CSV file (refreshed by BVCscrap every minute)"""
    import traceback
    try:
        from utils.bvcscrap import BVCscrap
        
        print("[API] /popular endpoint: Starting to read CSV...")
        
        # Read stocks from CSV file
        scraper = BVCscrap(market_type='stocks')
        print(f"[API] /popular endpoint: CSV path = {scraper.csv_path}")
        
        stocks = scraper.read_from_csv()
        
        print(f"[API] /popular endpoint: Read {len(stocks) if stocks else 0} stocks from CSV")
        
        if not stocks or len(stocks) == 0:
            print("[API] /popular endpoint: No stocks found in CSV - returning empty")
            return jsonify({
                'prices': {}
            }), 200
        
        # Convert list to dict format (symbol -> stock data)
        prices = {stock['symbol']: stock for stock in stocks}
        
        print(f"[API] /popular endpoint: Successfully returning {len(prices)} stocks")
        
        return jsonify({
            'prices': prices
        }), 200
    except Exception as e:
        print(f"[ERROR] get_popular_prices exception: {e}")
        traceback.print_exc()
        return jsonify({
            'prices': {},
            'error': str(e)
        }), 200

@market_data_bp.route('/forex', methods=['GET'])
def get_forex_prices():
    """Get top 30 forex pairs from CSV file"""
    import traceback
    try:
        from utils.bvcscrap import BVCscrap
        
        print("[API] /forex endpoint: Starting to read CSV...")
        
        scraper = BVCscrap(market_type='forex')
        forex_pairs = scraper.read_from_csv()
        
        print(f"[API] /forex endpoint: Read {len(forex_pairs) if forex_pairs else 0} forex pairs from CSV")
        
        if not forex_pairs or len(forex_pairs) == 0:
            return jsonify({
                'prices': {}
            }), 200
        
        prices = {pair['symbol']: pair for pair in forex_pairs}
        
        return jsonify({
            'prices': prices
        }), 200
    except Exception as e:
        print(f"[ERROR] get_forex_prices exception: {e}")
        traceback.print_exc()
        return jsonify({
            'prices': {},
            'error': str(e)
        }), 200

@market_data_bp.route('/crypto', methods=['GET'])
def get_crypto_prices():
    """Get top 30 cryptocurrencies from CSV file"""
    import traceback
    try:
        from utils.bvcscrap import BVCscrap
        
        print("[API] /crypto endpoint: Starting to read CSV...")
        
        scraper = BVCscrap(market_type='crypto')
        crypto_coins = scraper.read_from_csv()
        
        print(f"[API] /crypto endpoint: Read {len(crypto_coins) if crypto_coins else 0} cryptocurrencies from CSV")
        
        if not crypto_coins or len(crypto_coins) == 0:
            return jsonify({
                'prices': {}
            }), 200
        
        prices = {coin['symbol']: coin for coin in crypto_coins}
        
        return jsonify({
            'prices': prices
        }), 200
    except Exception as e:
        print(f"[ERROR] get_crypto_prices exception: {e}")
        traceback.print_exc()
        return jsonify({
            'prices': {},
            'error': str(e)
        }), 200

@market_data_bp.route('/morocco', methods=['GET'])
@market_data_bp.route('/moroccan', methods=['GET'])
def get_moroccan_prices():
    """Get all Moroccan stocks from CSV file"""
    import traceback
    try:
        from utils.bvcscrap import BVCscrap
        
        print("[API] /morocco endpoint: Starting to read CSV...")
        
        scraper = BVCscrap(market_type='morocco')
        morocco_stocks = scraper.read_from_csv()
        
        print(f"[API] /morocco endpoint: Read {len(morocco_stocks) if morocco_stocks else 0} Moroccan stocks from CSV")
        
        if not morocco_stocks or len(morocco_stocks) == 0:
            return jsonify({
                'prices': {}
            }), 200
        
        prices = {stock['symbol']: stock for stock in morocco_stocks}
        
        return jsonify({
            'prices': prices
        }), 200
    except Exception as e:
        print(f"[ERROR] get_moroccan_prices exception: {e}")
        traceback.print_exc()
        return jsonify({
            'prices': {},
            'error': str(e)
        }), 200

@market_data_bp.route('/symbols', methods=['GET'])
def get_symbols():
    """Get all symbols (searchable)."""
    query = request.args.get('q', '').strip()
    limit = request.args.get('limit', '50').strip()
    try:
        limit = int(limit)
    except ValueError:
        limit = 50

    market_service = MarketService()
    symbols = market_service.get_all_symbols(query=query, limit=limit)
    return jsonify({
        'symbols': symbols,
        'count': len(symbols)
    }), 200

def apply_timeframe_filter(historical_data, timeframe):
    """Filter historical data based on timeframe"""
    from datetime import datetime, timedelta

    # Calculate cutoff based on timeframe
    now = datetime.utcnow()
    cutoff_days = {'1d': 1, '1w': 7, '1m': 30, '1y': 365}.get(timeframe.lower(), 365)
    cutoff = now - timedelta(days=cutoff_days)
    max_points = {'1d': 24, '1w': 7, '1m': 30, '1y': 52}.get(timeframe.lower(), 100)

    # Filter data to timeframe
    filtered_data = []
    for item in historical_data:
        try:
            date_str = item['date']
            if 'T' not in date_str:
                date_str += 'T00:00:00'
            item_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            if item_date >= cutoff:
                filtered_data.append(item)
        except (ValueError, KeyError):
            continue

    # Keep most recent data points
    filtered_data.sort(key=lambda x: x['date'], reverse=True)
    result = filtered_data[:max_points]
    result.sort(key=lambda x: x['date'])  # Oldest first for charts

    return result

@market_data_bp.route('/history/<symbol>', methods=['GET'])
def get_price_history(symbol):
    """Get historical OHLC data for a symbol (for candlestick charts)"""
    import traceback
    try:
        from utils.bvcscrap import BVCscrap

        symbol = symbol.upper()
        timeframe = request.args.get('timeframe', '1d')

        # Map frontend timeframes to backend file formats
        timeframe_mapping = {
            '1d': 'daily',
            '1w': 'daily',  # Use daily data for weekly view
            '1m': 'daily',  # Use daily data for monthly view
            '1y': 'daily',  # Use daily data for yearly view
            '1h': '1h'      # Hourly data if available
        }

        backend_timeframe = timeframe_mapping.get(timeframe.lower(), 'daily')

        # Determine market type from symbol
        market_type = None
        scraper = None

        # Try to find symbol in different markets
        for mt in ['stocks', 'forex', 'crypto', 'morocco']:
            test_scraper = BVCscrap(market_type=mt)
            data = test_scraper.read_from_csv()
            for item in data:
                if item['symbol'].upper() == symbol:
                    market_type = mt
                    scraper = test_scraper
                    break
            if market_type:
                break

        if not market_type:
            return jsonify({'error': f'Symbol {symbol} not found in any market'}), 404

        # Try to read existing historical data first
        historical_data = scraper.read_historical_data(symbol, backend_timeframe)

        # Apply timeframe filtering to loaded data
        if historical_data and len(historical_data) > 0:
            historical_data = apply_timeframe_filter(historical_data, timeframe)

        if not historical_data or len(historical_data) == 0:
            print(f"[History] No historical data found for {symbol}, generating...")

            # Generate historical data based on current price
            historical_data = scraper.generate_historical_data(symbol, days=365)

            # Apply timeframe filtering to generated data
            if historical_data and len(historical_data) > 0:
                historical_data = apply_timeframe_filter(historical_data, timeframe)
                # Save the generated data for future use
                scraper.save_historical_data(symbol, historical_data, backend_timeframe)
            else:
                return jsonify({'error': 'Failed to generate historical data'}), 500

        # Get current price info
        current_data = scraper.read_from_csv()
        current_price_data = None
        for item in current_data:
            if item['symbol'].upper() == symbol:
                current_price_data = item
                break

        current_price = float(current_price_data.get('price', 0)) if current_price_data else 0
        change_percent = float(current_price_data.get('change_percent', 0)) if current_price_data else 0

        # Convert historical data to chart format (Unix timestamps)
        candles = []
        from datetime import datetime

        for item in historical_data[-100:]:  # Last 100 data points for performance
            try:
                # Convert date string to timestamp with robust parsing
                date_str = item['date']
                try:
                    # Handle ISO format dates (YYYY-MM-DD)
                    if 'T' not in date_str:
                        date_str += 'T00:00:00'  # Add time if missing
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    timestamp = int(date_obj.timestamp())
                except (ValueError, TypeError) as e:
                    print(f"[History] Warning: invalid date format '{item['date']}', using sequential timestamp")
                    # Fallback: use sequential timestamps if date parsing fails
                    timestamp = int(datetime.utcnow().timestamp()) - (len(candles) * 86400)

                # Validate and convert numeric values
                try:
                    open_price = float(item['open'])
                    high_price = float(item['high'])
                    low_price = float(item['low'])
                    close_price = float(item['close'])
                    volume = int(float(item['volume']))  # Handle float strings

                    # Ensure positive values
                    if any(val <= 0 for val in [open_price, high_price, low_price, close_price]):
                        print(f"[History] Warning: non-positive OHLC values in row: {item}")
                        continue

                    if volume < 0:
                        print(f"[History] Warning: negative volume in row: {item}")
                        volume = 0

                except (ValueError, TypeError, KeyError) as e:
                    print(f"[History] Warning: invalid numeric data in row: {e} - {item}")
                    continue

                candles.append({
                    'time': timestamp,
                    'open': open_price,
                    'high': high_price,
                    'low': low_price,
                    'close': close_price,
                    'volume': volume
                })

            except Exception as e:
                print(f"[History] Error processing historical data row: {e} - {item}")
                continue

        # Sort by time (oldest first) and remove duplicates
        candles.sort(key=lambda x: x['time'])

        # Remove duplicate timestamps (keep the last occurrence)
        seen_times = set()
        unique_candles = []
        for candle in reversed(candles):  # Process in reverse to keep latest
            if candle['time'] not in seen_times:
                seen_times.add(candle['time'])
                unique_candles.append(candle)

        # Re-sort after deduplication
        unique_candles.sort(key=lambda x: x['time'])
        candles = unique_candles

        print(f"[History] Returning {len(candles)} historical candles for {symbol} ({timeframe})")

        return jsonify({
            'symbol': symbol,
            'timeframe': timeframe,
            'candles': candles,
            'current_price': current_price,
            'change_percent': change_percent
        }), 200

    except Exception as e:
        print(f"[ERROR] get_price_history exception: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@market_data_bp.route('/csv/<filename>', methods=['GET'])
def get_csv_file(filename):
    """Serve CSV files directly for chart loading"""
    try:
        import os
        from flask import send_file

        # Security: Validate filename to prevent directory traversal
        if not filename or '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Invalid filename'}), 400

        # Ensure it ends with .csv
        if not filename.endswith('.csv'):
            return jsonify({'error': 'Only CSV files are allowed'}), 400

        csv_path = os.path.join('data', 'historical', filename)

        # Check if file exists
        if not os.path.exists(csv_path):
            return jsonify({'error': f'CSV file not found: {filename}'}), 404

        print(f"[CSV] Serving file: {csv_path}")
        return send_file(csv_path, mimetype='text/csv', as_attachment=False)

    except Exception as e:
        print(f"[ERROR] CSV file serving error: {e}")
        return jsonify({'error': str(e)}), 500
