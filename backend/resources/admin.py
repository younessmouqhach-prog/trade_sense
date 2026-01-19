from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import User, UserChallenge, PayPalConfig, Challenge
from services.challenge_engine import ChallengeEngine
from utils.helpers import get_current_user, admin_required, superadmin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/challenges', methods=['GET'])
@jwt_required()
@admin_required
def get_all_challenges():
    """Get all user challenges (Admin only)"""
    status = request.args.get('status')
    user_id = request.args.get('user_id', type=int)
    
    query = UserChallenge.query
    
    if status:
        query = query.filter_by(status=status)
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    challenges = query.order_by(UserChallenge.started_at.desc()).limit(100).all()
    
    return jsonify({
        'challenges': [challenge.to_dict() for challenge in challenges]
    }), 200

@admin_bp.route('/challenges/<int:challenge_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_challenge_status(challenge_id):
    """Manually update challenge status (Admin only)"""
    user_challenge = UserChallenge.query.get(challenge_id)
    
    if not user_challenge:
        return jsonify({'error': 'Challenge not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('status'):
        return jsonify({'error': 'Status is required'}), 400
    
    status = data['status'].lower()
    if status not in ['active', 'passed', 'failed']:
        return jsonify({'error': 'Invalid status'}), 400
    
    reason = data.get('reason', 'Manually updated by admin')
    
    challenge_engine = ChallengeEngine()
    challenge_engine.update_challenge_status(challenge_id, status, reason)
    
    user_challenge = UserChallenge.query.get(challenge_id)
    
    return jsonify({
        'message': 'Challenge status updated',
        'challenge': user_challenge.to_dict()
    }), 200

@admin_bp.route('/paypal/config', methods=['GET'])
@jwt_required()
@superadmin_required
def get_paypal_config():
    """Get PayPal configuration (SuperAdmin only)"""
    config = PayPalConfig.query.first()
    
    if not config:
        return jsonify({'error': 'PayPal not configured'}), 404
    
    return jsonify({
        'config': config.to_dict(include_secret=False)
    }), 200

@admin_bp.route('/paypal/config', methods=['POST'])
@jwt_required()
@superadmin_required
def update_paypal_config():
    """Update PayPal configuration (SuperAdmin only)"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('client_id') or not data.get('client_secret'):
        return jsonify({'error': 'Client ID and Client Secret are required'}), 400
    
    config = PayPalConfig.query.first()
    
    if not config:
        config = PayPalConfig(
            client_id=data['client_id'],
            client_secret=data['client_secret'],
            mode=data.get('mode', 'sandbox'),
            updated_by=user.id
        )
        db.session.add(config)
    else:
        config.client_id = data['client_id']
        config.client_secret = data['client_secret']
        config.mode = data.get('mode', config.mode)
        config.updated_by = user.id
    
    db.session.commit()
    
    return jsonify({
        'message': 'PayPal configuration updated',
        'config': config.to_dict(include_secret=False)
    }), 200

@admin_bp.route('/challenge-templates', methods=['GET'])
@jwt_required()
@admin_required
def get_challenge_templates_admin():
    """Get all challenge templates (Admin only)"""
    challenges = Challenge.query.all()
    
    return jsonify({
        'challenges': [challenge.to_dict() for challenge in challenges]
    }), 200

@admin_bp.route('/challenge-templates', methods=['POST'])
@jwt_required()
@admin_required
def create_challenge_template():
    """Create challenge template (Admin only)"""
    data = request.get_json()
    
    required_fields = ['name', 'tier', 'initial_balance', 'max_daily_loss_percent', 
                      'max_total_drawdown_percent', 'profit_target_percent', 'price_mad']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'All fields are required'}), 400
    
    challenge = Challenge(
        name=data['name'],
        tier=data['tier'],
        initial_balance=data['initial_balance'],
        max_daily_loss_percent=data['max_daily_loss_percent'],
        max_total_drawdown_percent=data['max_total_drawdown_percent'],
        profit_target_percent=data['profit_target_percent'],
        price_mad=data['price_mad'],
        is_active=data.get('is_active', True)
    )
    
    db.session.add(challenge)
    db.session.commit()
    
    return jsonify({
        'message': 'Challenge template created',
        'challenge': challenge.to_dict()
    }), 201

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_admin_stats():
    """Get admin statistics"""
    from sqlalchemy import func
    
    total_users = User.query.count()
    total_challenges = UserChallenge.query.count()
    active_challenges = UserChallenge.query.filter_by(status='active').count()
    passed_challenges = UserChallenge.query.filter_by(status='passed').count()
    failed_challenges = UserChallenge.query.filter_by(status='failed').count()
    
    total_payments = db.session.query(func.sum(Challenge.price_mad)).join(
        UserChallenge, Challenge.id == UserChallenge.challenge_id
    ).filter(UserChallenge.status != 'active').scalar() or 0
    
    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_challenges': total_challenges,
            'active_challenges': active_challenges,
            'passed_challenges': passed_challenges,
            'failed_challenges': failed_challenges,
            'total_revenue_mad': float(total_payments)
        }
    }), 200
