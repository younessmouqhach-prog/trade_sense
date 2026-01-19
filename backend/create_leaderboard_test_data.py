#!/usr/bin/env python3
"""Create test data for leaderboard functionality"""

import os
import sys
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Add the current directory to the path
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db, User, UserChallenge, Trade

def create_test_leaderboard_data():
    """Create realistic test data for monthly leaderboard"""

    app = create_app('default')

    with app.app_context():
        print("[TEST] Creating test data for Leaderboard...")

        # Get existing users
        users = User.query.all()
        if not users:
            print("[ERROR] No users found. Please create users first.")
            return

        # Get current month
        from datetime import timezone
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Clear existing test trades for current month (optional - uncomment if needed)
        # Trade.query.filter(Trade.closed_at >= month_start, Trade.status == 'closed').delete()

        symbols = ['NVDA', 'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NFLX']
        trade_count = 0

        for user in users:
            # Get or create user challenge
            challenge = UserChallenge.query.filter_by(user_id=user.id, status='active').first()
            if not challenge:
                challenge = UserChallenge.query.filter_by(user_id=user.id).first()
                if not challenge:
                    # Create a basic challenge for testing
                    challenge = UserChallenge(
                        user_id=user.id,
                        challenge_id=1,  # Assume challenge ID 1 exists
                        status='active',
                        initial_balance=Decimal('10000.00'),
                        current_balance=Decimal('10000.00'),
                        equity=Decimal('10000.00'),
                        peak_balance=Decimal('10000.00'),
                        daily_loss_limit=Decimal('500.00'),
                        max_drawdown_limit=Decimal('1000.00'),
                        profit_target=Decimal('1000.00'),
                        started_at=month_start - timedelta(days=30),
                        current_day=now.date(),
                        daily_loss=Decimal('0.00')
                    )
                    db.session.add(challenge)
                    db.session.commit()

            # Generate 3-15 random trades per user for current month
            num_trades = random.randint(3, 15)

            for i in range(num_trades):
                # Random trade parameters
                symbol = random.choice(symbols)
                trade_type = random.choice(['buy', 'sell'])
                quantity = Decimal(str(random.uniform(0.1, 5.0)))
                entry_price = Decimal(str(random.uniform(100, 500)))

                # Simulate realistic PnL distribution
                # Most trades small profit/loss, few big winners/losers
                pnl_distribution = random.choices(
                    ['small_win', 'small_loss', 'medium_win', 'medium_loss', 'big_win', 'big_loss'],
                    weights=[30, 30, 15, 15, 5, 5]
                )[0]

                if pnl_distribution == 'small_win':
                    pnl = Decimal(str(random.uniform(10, 100)))
                elif pnl_distribution == 'small_loss':
                    pnl = Decimal(str(random.uniform(-100, -10)))
                elif pnl_distribution == 'medium_win':
                    pnl = Decimal(str(random.uniform(100, 500)))
                elif pnl_distribution == 'medium_loss':
                    pnl = Decimal(str(random.uniform(-500, -100)))
                elif pnl_distribution == 'big_win':
                    pnl = Decimal(str(random.uniform(500, 2000)))
                else:  # big_loss
                    pnl = Decimal(str(random.uniform(-2000, -500)))

                # Calculate exit price based on PnL
                exit_price = entry_price + (pnl / quantity)

                # Random close date within current month
                days_in_month = random.randint(0, now.day - 1) if now.day > 1 else 0
                close_date = month_start + timedelta(
                    days=days_in_month,
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )

                # Create trade
                trade = Trade(
                    user_id=user.id,
                    user_challenge_id=challenge.id,
                    symbol=symbol,
                    trade_type=trade_type,
                    quantity=quantity,
                    entry_price=entry_price,
                    exit_price=exit_price,
                    pnl=pnl,
                    status='closed',
                    opened_at=close_date - timedelta(hours=random.randint(1, 24)),
                    closed_at=close_date
                )

                db.session.add(trade)
                trade_count += 1

        db.session.commit()
        print(f"[SUCCESS] Created {trade_count} test trades for {len(users)} users")

        # Show leaderboard preview
        print("\n[TOP] Monthly Leaderboard Preview:")
        print("-" * 50)

        from sqlalchemy import text
        query = text("""
            WITH monthly_performance AS (
                SELECT
                    t.user_id,
                    SUM(t.pnl) AS total_pnl,
                    COUNT(t.id) AS trade_count
                FROM trades t
                WHERE t.status = 'closed'
                    AND t.closed_at >= :month_start
                    AND t.closed_at <= :month_end
                    AND t.pnl IS NOT NULL
                GROUP BY t.user_id
                HAVING COUNT(t.id) >= 3
            ),
            user_balances AS (
                SELECT
                    uc.user_id,
                    uc.initial_balance
                FROM user_challenges uc
                WHERE uc.status IN ('active', 'passed', 'completed')
                GROUP BY uc.user_id
            )
            SELECT
                mp.user_id,
                mp.total_pnl,
                mp.trade_count,
                ub.initial_balance,
                ROUND(
                    CASE
                        WHEN ub.initial_balance > 0 THEN (mp.total_pnl / ub.initial_balance) * 100
                        ELSE 0
                    END, 2
                ) AS profit_percent
            FROM monthly_performance mp
            JOIN user_balances ub ON ub.user_id = mp.user_id
            WHERE ub.initial_balance > 0
            ORDER BY profit_percent DESC, mp.total_pnl DESC
            LIMIT 10
        """)

        result = db.session.execute(query, {
            'month_start': month_start,
            'month_end': now
        })

        rank = 1
        for row in result:
            user = User.query.get(row.user_id)
            trader_name = f"{user.full_name.split()[0]}***" if user else f"User {row.user_id}"
            print("2d")

        print(f"\n[STATS] {len(users)} users, {trade_count} trades this month")
        print("[READY] Ready to test leaderboard at /api/leaderboard/monthly")

if __name__ == '__main__':
    create_test_leaderboard_data()