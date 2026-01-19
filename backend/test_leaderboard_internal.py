#!/usr/bin/env python3
"""Test leaderboard internally without HTTP"""

from app import create_app
from resources.leaderboard import get_monthly_leaderboard

def test_leaderboard_internal():
    """Test leaderboard function directly"""
    app = create_app('default')

    with app.app_context():
        print("[TEST] Testing leaderboard internally...")

        try:
            # Mock the request context for the function
            with app.test_request_context():
                result = get_monthly_leaderboard()

                if isinstance(result, tuple):
                    # Flask response tuple (data, status_code)
                    data, status_code = result
                    print(f"[RESPONSE] Status: {status_code}")

                    if status_code == 200 and data.get_json():
                        json_data = data.get_json()
                        if json_data.get('success'):
                            leaderboard = json_data.get('data', [])
                            print(f"[SUCCESS] Found {len(leaderboard)} leaderboard entries")

                            if leaderboard:
                                top = leaderboard[0]
                                print(f"[TOP] #{top['rank']}: {top['traderName']} - {top['profitPercent']:.2f}%")
                                print(f"[DETAILS] PnL: ${top['totalPnl']:.2f}, {top['tradeCount']} trades")
                        else:
                            print(f"[ERROR] API error: {json_data.get('error', 'Unknown')}")
                    else:
                        print(f"[ERROR] Bad status code: {status_code}")
                else:
                    print(f"[ERROR] Unexpected response type: {type(result)}")

        except Exception as e:
            print(f"[ERROR] Exception: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_leaderboard_internal()