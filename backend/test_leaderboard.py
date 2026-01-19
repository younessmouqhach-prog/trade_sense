#!/usr/bin/env python3
"""Test the leaderboard API"""

import requests
import json

def test_leaderboard_api():
    """Test the monthly leaderboard endpoint"""
    try:
        print("[TEST] Testing leaderboard API...")
        response = requests.get('http://localhost:5000/api/leaderboard/monthly')

        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS] API Response Status: 200")

            if data.get('success'):
                leaderboard = data.get('data', [])
                print(f"[DATA] Leaderboard entries: {len(leaderboard)}")

                if leaderboard:
                    top_trader = leaderboard[0]
                    print(f"[TOP] #{top_trader['rank']}: {top_trader['traderName']} - {top_trader['profitPercent']:.2f}% profit")
                    print(f"[DETAILS] Total PnL: ${top_trader['totalPnl']:.2f}, {top_trader['tradeCount']} trades")

                    # Show top 3
                    print("\n[TOP 3]")
                    for i, trader in enumerate(leaderboard[:3], 1):
                        print("2d")

                # Show period info
                period = data.get('period', {})
                print(f"\n[PERIOD] {period.get('month', 'Unknown')}")

                # Show stats
                stats_response = requests.get('http://localhost:5000/api/leaderboard/stats')
                if stats_response.status_code == 200:
                    stats_data = stats_response.json()
                    if stats_data.get('success'):
                        stats = stats_data.get('stats', {})
                        print("\n[STATS]")
                        print(f"Active Traders: {stats.get('activeTraders', 0)}")
                        print(f"Total Trades: {stats.get('totalTrades', 0)}")
                        print(f"Avg Trades/User: {stats.get('averageTradesPerTrader', 0):.1f}")
                        print(f"Avg Profit %: {stats.get('averageProfitPercent', 0):.2f}%")

            else:
                print(f"[ERROR] API returned success=false: {data.get('error', 'Unknown error')}")

        else:
            print(f"[ERROR] HTTP {response.status_code}")
            print(f"[RESPONSE] {response.text[:200]}...")

    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to Flask server. Make sure it's running on port 5000")
        print("Run: python app.py")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_leaderboard_api()