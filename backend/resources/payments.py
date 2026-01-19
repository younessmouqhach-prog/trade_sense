from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Payment, Challenge
from services.payment_service import PaymentService
from services.challenge_engine import ChallengeEngine
from utils.helpers import get_current_user

payments_bp = Blueprint('payments', __name__)

@payments_bp.route('/process/cmi', methods=['POST'])
@jwt_required()
def process_cmi_payment():
    """Process CMI payment"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('challenge_id'):
        return jsonify({'error': 'Challenge ID is required'}), 400
    
    challenge_id = data['challenge_id']
    
    try:
        payment_service = PaymentService()
        payment = payment_service.process_cmi_payment(user.id, challenge_id)
        
        # Create user challenge
        challenge_engine = ChallengeEngine()
        user_challenge = challenge_engine.create_user_challenge(user.id, challenge_id)
        
        return jsonify({
            'message': 'Payment processed successfully',
            'payment': payment.to_dict(),
            'challenge': user_challenge.to_dict()
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@payments_bp.route('/process/crypto', methods=['POST'])
@jwt_required()
def process_crypto_payment():
    """Process Crypto payment"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('challenge_id'):
        return jsonify({'error': 'Challenge ID is required'}), 400
    
    challenge_id = data['challenge_id']
    
    try:
        payment_service = PaymentService()
        payment = payment_service.process_crypto_payment(user.id, challenge_id)
        
        # Create user challenge
        challenge_engine = ChallengeEngine()
        user_challenge = challenge_engine.create_user_challenge(user.id, challenge_id)
        
        return jsonify({
            'message': 'Payment processed successfully',
            'payment': payment.to_dict(),
            'challenge': user_challenge.to_dict()
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@payments_bp.route('/paypal/create', methods=['POST'])
@jwt_required()
def create_paypal_order():
    """Create PayPal order"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('challenge_id'):
        return jsonify({'error': 'Challenge ID is required'}), 400
    
    challenge_id = data['challenge_id']
    
    try:
        payment_service = PaymentService()
        order_data = payment_service.create_paypal_order(user.id, challenge_id)
        
        return jsonify({
            'message': 'PayPal order created',
            **order_data
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@payments_bp.route('/paypal/capture', methods=['POST'])
@jwt_required()
def capture_paypal_order():
    """Capture PayPal order"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('order_id'):
        return jsonify({'error': 'Order ID is required'}), 400
    
    order_id = data['order_id']
    
    # Verify payment belongs to user
    payment = Payment.query.filter_by(paypal_order_id=order_id).first()
    if not payment or payment.user_id != user.id:
        return jsonify({'error': 'Payment not found or access denied'}), 404
    
    try:
        payment_service = PaymentService()
        capture_data = payment_service.capture_paypal_order(order_id)
        
        # Create user challenge if payment completed
        if payment.status == 'completed':
            challenge_engine = ChallengeEngine()
            user_challenge = challenge_engine.create_user_challenge(user.id, payment.challenge_id)
            
            return jsonify({
                'message': 'Payment captured successfully',
                'payment': payment.to_dict(),
                'challenge': user_challenge.to_dict()
            }), 200
        else:
            return jsonify({
                'message': 'Payment capture initiated',
                'payment': payment.to_dict()
            }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@payments_bp.route('/history', methods=['GET'])
@jwt_required()
def get_payment_history():
    """Get user's payment history"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    payments = Payment.query.filter_by(user_id=user.id).order_by(
        Payment.created_at.desc()
    ).all()
    
    return jsonify({
        'payments': [payment.to_dict() for payment in payments]
    }), 200
