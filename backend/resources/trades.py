from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from decimal import Decimal
from extensions import db
from models import Trade, UserChallenge
from services.market_service import MarketService
from services.challenge_engine import ChallengeEngine
from services.risk_engine import RiskEngine
from utils.helpers import get_current_user

trades_bp = Blueprint('trades', __name__)

@trades_bp.route('/buy', methods=['POST'])
@jwt_required()
def buy_trade():
    """Execute buy trade"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('symbol') or not data.get('quantity'):
        return jsonify({'error': 'Symbol and quantity are required'}), 400

    symbol = data['symbol'].upper()
    quantity = Decimal(str(data['quantity']))
    stop_loss = data.get('stop_loss')
    take_profit = data.get('take_profit')

    # Validate stop loss and take profit if provided
    if stop_loss is not None:
        stop_loss = Decimal(str(stop_loss))
    if take_profit is not None:
        take_profit = Decimal(str(take_profit))
    
    # Get active challenge
    challenge_engine = ChallengeEngine()
    user_challenge = challenge_engine.get_active_challenge(user.id)
    
    if not user_challenge:
        return jsonify({'error': 'No active challenge found'}), 404
    
    if user_challenge.status != 'active':
        return jsonify({'error': 'Challenge is not active'}), 400
    
    # Get current market price
    market_service = MarketService()
    price_data = market_service.get_price(symbol)
    
    if not price_data:
        return jsonify({'error': f'Could not fetch price for {symbol}'}), 400
    
    entry_price = Decimal(str(price_data['price']))
    total_cost = entry_price * quantity
    
    # Check if user has enough balance
    if total_cost > user_challenge.equity:
        return jsonify({'error': 'Insufficient balance'}), 400
    
    # Create trade
    trade = Trade(
        user_id=user.id,
        stop_loss=stop_loss,
        take_profit=take_profit,
        user_challenge_id=user_challenge.id,
        symbol=symbol,
        trade_type='buy',
        quantity=quantity,
        entry_price=entry_price,
        status='open',
        pnl=Decimal('0.0')
    )
    
    # Update challenge equity (reserve the cost)
    new_equity = user_challenge.equity - total_cost
    challenge_engine.update_equity(user_challenge.id, new_equity)
    
    db.session.add(trade)
    db.session.commit()
    
    # Evaluate risk
    risk_engine = RiskEngine()
    evaluation = risk_engine.evaluate_challenge(user_challenge)
    
    if evaluation['status'] != 'active':
        challenge_engine.update_challenge_status(
            user_challenge.id,
            evaluation['status'],
            evaluation.get('reason', '')
        )
    
    return jsonify({
        'message': 'Trade executed successfully',
        'trade': trade.to_dict(),
        'challenge': user_challenge.to_dict()
    }), 201

@trades_bp.route('/sell', methods=['POST'])
@jwt_required()
def sell_trade():
    """Execute sell trade"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('trade_id'):
        return jsonify({'error': 'Trade ID is required'}), 400
    
    trade_id = data.get('trade_id')
    
    # Get trade
    trade = Trade.query.get(trade_id)
    
    if not trade:
        return jsonify({'error': 'Trade not found'}), 404
    
    if trade.user_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    if trade.status != 'open':
        return jsonify({'error': 'Trade is already closed'}), 400
    
    if trade.trade_type != 'buy':
        return jsonify({'error': 'Only buy trades can be sold'}), 400
    
    # Get active challenge
    user_challenge = UserChallenge.query.get(trade.user_challenge_id)
    
    if not user_challenge or user_challenge.status != 'active':
        return jsonify({'error': 'Challenge is not active'}), 400
    
    # Get current market price
    market_service = MarketService()
    price_data = market_service.get_price(trade.symbol)
    
    if not price_data:
        return jsonify({'error': f'Could not fetch price for {trade.symbol}'}), 400
    
    exit_price = Decimal(str(price_data['price']))
    
    # Calculate PnL
    if trade.trade_type == 'buy':
        pnl = (exit_price - trade.entry_price) * trade.quantity
    else:
        pnl = (trade.entry_price - exit_price) * trade.quantity
    
    # Update trade
    trade.exit_price = exit_price
    trade.pnl = pnl
    trade.status = 'closed'
    trade.closed_at = datetime.utcnow()
    
    # Update challenge equity (return the reserved amount + PnL)
    challenge_engine = ChallengeEngine()
    reserved_amount = trade.entry_price * trade.quantity
    new_equity = user_challenge.equity + reserved_amount + pnl
    challenge_engine.update_equity(user_challenge.id, new_equity)
    
    db.session.commit()
    
    # Refresh user_challenge from DB
    user_challenge = UserChallenge.query.get(trade.user_challenge_id)
    
    # Evaluate risk
    risk_engine = RiskEngine()
    evaluation = risk_engine.evaluate_challenge(user_challenge)
    
    if evaluation['status'] != 'active':
        challenge_engine.update_challenge_status(
            user_challenge.id,
            evaluation['status'],
            evaluation.get('reason', '')
        )
    
    return jsonify({
        'message': 'Trade closed successfully',
        'trade': trade.to_dict(),
        'challenge': user_challenge.to_dict()
    }), 200

@trades_bp.route('/', methods=['GET'])
@jwt_required()
def get_trades():
    """Get user's trades"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    challenge_id = request.args.get('challenge_id', type=int)
    status = request.args.get('status')
    symbol = request.args.get('symbol')
    
    query = Trade.query.filter_by(user_id=user.id)
    
    if challenge_id:
        query = query.filter_by(user_challenge_id=challenge_id)
    
    if status:
        query = query.filter_by(status=status)
    
    if symbol:
        query = query.filter_by(symbol=symbol.upper())
    
    trades = query.order_by(Trade.opened_at.desc()).limit(100).all()
    
    return jsonify({
        'trades': [trade.to_dict() for trade in trades]
    }), 200

@trades_bp.route('/<int:trade_id>', methods=['GET'])
@jwt_required()
def get_trade(trade_id):
    """Get trade by ID"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    trade = Trade.query.get(trade_id)
    
    if not trade:
        return jsonify({'error': 'Trade not found'}), 404
    
    if trade.user_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'trade': trade.to_dict()
    }), 200
