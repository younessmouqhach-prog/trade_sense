#!/usr/bin/env python3
"""Generate historical OHLC data for all symbols in CSV files"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.bvcscrap import BVCscrap

def generate_all_historical_data():
    """Generate historical data for all symbols across all markets"""

    markets = ['stocks', 'forex', 'crypto', 'morocco']

    for market in markets:
        print(f"\n[*] Processing {market} market...")

        scraper = BVCscrap(market_type=market)
        symbols = scraper.read_from_csv()

        print(f"[+] Found {len(symbols)} symbols in {market}")

        for i, symbol_data in enumerate(symbols):
            symbol = symbol_data['symbol']
            print(f"  [{i+1}/{len(symbols)}] Generating data for {symbol}...")

            try:
                # Generate 365 days of historical data
                historical_data = scraper.generate_historical_data(symbol, days=365)

                if historical_data and len(historical_data) > 0:
                    # Save to CSV
                    filepath = scraper.save_historical_data(symbol, historical_data, 'daily')
                    if filepath:
                        print(f"    [+] Saved {len(historical_data)} days to {filepath}")
                    else:
                        print(f"    [-] Failed to save data for {symbol}")
                else:
                    print(f"    [!] No historical data generated for {symbol}")

            except Exception as e:
                print(f"    [-] Error generating data for {symbol}: {e}")

    print("\n[+] Historical data generation complete!")

if __name__ == "__main__":
    generate_all_historical_data()