#!/usr/bin/env python3
"""Leaderboard API endpoints"""

from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from extensions import db
from models import Trade, UserChallenge, User
from sqlalchemy import text, func
from flask_jwt_extended import jwt_required
import logging

leaderboard_bp = Blueprint('leaderboard', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@leaderboard_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly_leaderboard():
    """Get monthly leaderboard based on profit percentage from closed trades"""
    try:
        logger.info("Fetching monthly leaderboard")

        # Calculate current month start and end
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = month_start.replace(month=month_start.month + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1)
        month_end = next_month - timedelta(seconds=1)

        logger.info(f"Leaderboard period: {month_start} to {month_end}")

        # SQLite compatible query for monthly performance
        # Using raw trades instead of challenge equity
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
                HAVING COUNT(t.id) >= 3  -- Minimum 3 trades to prevent gaming
            ),
            user_balances AS (
                SELECT
                    uc.user_id,
                    uc.initial_balance
                FROM user_challenges uc
                WHERE uc.status IN ('active', 'passed', 'completed')
                GROUP BY uc.user_id
                HAVING MAX(uc.started_at)  -- Get latest challenge per user
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
                AND profit_percent > -100  -- Exclude unrealistic losses
            ORDER BY profit_percent DESC, mp.total_pnl DESC
            LIMIT 10
        """)

        # Execute query
        result = db.session.execute(query, {
            'month_start': month_start,
            'month_end': month_end
        })

        # Format results
        leaderboard = []
        for row in result:
            # Skip invalid results
            if row.profit_percent is None or row.profit_percent < -100:
                continue

            # Get user details (anonymized)
            user = User.query.get(row.user_id)
            trader_name = f"Trader #{row.user_id}" if not user else f"{user.full_name.split()[0]}***"

            leaderboard.append({
                'rank': len(leaderboard) + 1,
                'userId': str(row.user_id),  # Anonymized
                'traderName': trader_name,
                'profitPercent': float(row.profit_percent),
                'totalPnl': float(row.total_pnl),
                'tradeCount': int(row.trade_count),
                'initialBalance': float(row.initial_balance)
            })

        logger.info(f"Monthly leaderboard generated: {len(leaderboard)} traders")

        return jsonify({
            'success': True,
            'data': leaderboard,
            'period': {
                'month': month_start.strftime('%B %Y'),
                'startDate': month_start.isoformat(),
                'endDate': month_end.isoformat()
            },
            'updatedAt': datetime.utcnow().isoformat(),
            'formula': 'Profit % = (Total PnL / Initial Balance) × 100'
        }), 200

    except Exception as e:
        logger.error(f"Error fetching monthly leaderboard: {e}")
        import traceback
        traceback.print_exc()

        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@leaderboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_leaderboard_stats():
    """Get leaderboard statistics"""
    try:
        # Calculate current month
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Get total active traders this month (with at least 3 trades)
        active_traders_query = text("""
            SELECT COUNT(DISTINCT t.user_id) as active_traders
            FROM trades t
            WHERE t.status = 'closed'
                AND t.closed_at >= :month_start
                AND (
                    SELECT COUNT(*)
                    FROM trades t2
                    WHERE t2.user_id = t.user_id
                        AND t2.status = 'closed'
                        AND t2.closed_at >= :month_start
                ) >= 3
        """)

        result = db.session.execute(active_traders_query, {'month_start': month_start})
        active_traders = result.scalar() or 0

        # Get total trades this month
        total_trades_query = text("""
            SELECT COUNT(*) as total_trades
            FROM trades t
            WHERE t.status = 'closed'
                AND t.closed_at >= :month_start
        """)

        result = db.session.execute(total_trades_query, {'month_start': month_start})
        total_trades = result.scalar() or 0

        # Get average profit %
        avg_profit_query = text("""
            WITH monthly_stats AS (
                SELECT
                    t.user_id,
                    SUM(t.pnl) as total_pnl,
                    COUNT(t.id) as trade_count
                FROM trades t
                WHERE t.status = 'closed'
                    AND t.closed_at >= :month_start
                GROUP BY t.user_id
                HAVING COUNT(t.id) >= 3
            ),
            user_balances AS (
                SELECT uc.user_id, uc.initial_balance
                FROM user_challenges uc
                WHERE uc.status IN ('active', 'passed', 'completed')
                GROUP BY uc.user_id
            )
            SELECT AVG(
                CASE
                    WHEN ub.initial_balance > 0 THEN (ms.total_pnl / ub.initial_balance) * 100
                    ELSE 0
                END
            ) as avg_profit
            FROM monthly_stats ms
            JOIN user_balances ub ON ub.user_id = ms.user_id
            WHERE ub.initial_balance > 0
        """)

        result = db.session.execute(avg_profit_query, {'month_start': month_start})
        avg_profit = result.scalar() or 0

        return jsonify({
            'success': True,
            'stats': {
                'activeTraders': active_traders,
                'totalTrades': total_trades,
                'averageTradesPerTrader': round(total_trades / max(active_traders, 1), 1),
                'averageProfitPercent': round(float(avg_profit), 2) if avg_profit else 0
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching leaderboard stats: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@leaderboard_bp.route('/all-time', methods=['GET'])
def get_all_time_leaderboard():
    """Get all-time top 10 traders (legacy endpoint)"""
    try:
        # All-time leaderboard based on best single challenge performance
        leaderboard_query = text("""
            WITH best_challenges AS (
                SELECT
                    uc.user_id,
                    MAX(uc.equity) as max_equity,
                    uc.initial_balance,
                    uc.id as challenge_id
                FROM user_challenges uc
                WHERE uc.status IN ('active', 'passed', 'completed')
                    AND uc.initial_balance > 0
                GROUP BY uc.user_id, uc.initial_balance, uc.id
            ),
            ranked_challenges AS (
                SELECT
                    bc.*,
                    ROW_NUMBER() OVER (PARTITION BY bc.user_id ORDER BY
                        CASE
                            WHEN bc.initial_balance > 0 THEN (bc.max_equity - bc.initial_balance) / bc.initial_balance * 100
                            ELSE 0
                        END DESC
                    ) as rn
                FROM best_challenges bc
            )
            SELECT
                rc.user_id,
                rc.max_equity,
                rc.initial_balance,
                rc.challenge_id,
                ROUND(
                    CASE
                        WHEN rc.initial_balance > 0 THEN (rc.max_equity - rc.initial_balance) / rc.initial_balance * 100
                        ELSE 0
                    END, 2
                ) as profit_percent
            FROM ranked_challenges rc
            WHERE rc.rn = 1
                AND profit_percent > 0
            ORDER BY profit_percent DESC
            LIMIT 10
        """)

        result = db.session.execute(leaderboard_query)

        leaderboard = []
        for row in result:
            user = User.query.get(row.user_id)
            trader_name = f"Trader #{row.user_id}" if not user else f"{user.full_name.split()[0]}***"

            leaderboard.append({
                'rank': len(leaderboard) + 1,
                'userId': str(row.user_id),
                'traderName': trader_name,
                'profitPercent': float(row.profit_percent),
                'equity': float(row.max_equity),
                'initialBalance': float(row.initial_balance)
            })

        return jsonify({
            'success': True,
            'data': leaderboard,
            'period': 'all-time',
            'updatedAt': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error fetching all-time leaderboard: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
