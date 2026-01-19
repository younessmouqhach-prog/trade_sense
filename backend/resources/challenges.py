from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Challenge, UserChallenge
from services.challenge_engine import ChallengeEngine
from utils.helpers import get_current_user

challenges_bp = Blueprint('challenges', __name__)

@challenges_bp.route('/templates', methods=['GET'])
def get_challenge_templates():
    """Get all available challenge templates"""
    challenges = Challenge.query.filter_by(is_active=True).all()
    
    return jsonify({
        'challenges': [challenge.to_dict() for challenge in challenges]
    }), 200

@challenges_bp.route('/templates/<int:challenge_id>', methods=['GET'])
def get_challenge_template(challenge_id):
    """Get challenge template by ID"""
    challenge = Challenge.query.get(challenge_id)
    
    if not challenge:
        return jsonify({'error': 'Challenge template not found'}), 404
    
    return jsonify({
        'challenge': challenge.to_dict()
    }), 200

@challenges_bp.route('/my-challenges', methods=['GET'])
@jwt_required()
def get_my_challenges():
    """Get current user's challenges"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    challenges = UserChallenge.query.filter_by(user_id=user.id).order_by(
        UserChallenge.started_at.desc()
    ).all()
    
    return jsonify({
        'challenges': [challenge.to_dict() for challenge in challenges]
    }), 200

@challenges_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_challenge():
    """Get current user's active challenge"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    challenge_engine = ChallengeEngine()
    user_challenge = challenge_engine.get_active_challenge(user.id)
    
    if not user_challenge:
        return jsonify({'error': 'No active challenge found'}), 404
    
    from services.risk_engine import RiskEngine
    risk_engine = RiskEngine()
    metrics = risk_engine.calculate_risk_metrics(user_challenge)
    
    return jsonify({
        'challenge': user_challenge.to_dict(),
        'risk_metrics': metrics
    }), 200

@challenges_bp.route('/<int:challenge_id>', methods=['GET'])
@jwt_required()
def get_challenge(challenge_id):
    """Get user challenge by ID"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_challenge = UserChallenge.query.get(challenge_id)
    
    if not user_challenge:
        return jsonify({'error': 'Challenge not found'}), 404
    
    # Check ownership
    if user_challenge.user_id != user.id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Access denied'}), 403
    
    from services.risk_engine import RiskEngine
    risk_engine = RiskEngine()
    metrics = risk_engine.calculate_risk_metrics(user_challenge)
    
    return jsonify({
        'challenge': user_challenge.to_dict(),
        'risk_metrics': metrics
    }), 200
