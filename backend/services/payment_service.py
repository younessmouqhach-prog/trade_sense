import uuid
import requests
from datetime import datetime
from extensions import db
from models import Payment, PayPalConfig, Challenge
from config import Config

class PaymentService:
    """Payment processing service"""
    
    def process_cmi_payment(self, user_id, challenge_id):
        """Process CMI payment (mock with simulation)"""
        import time
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        # Simulate payment processing delay (2-3 seconds)
        time.sleep(2.5)

        # Generate mock transaction ID
        transaction_id = f"CMI_{uuid.uuid4().hex[:16].upper()}"

        payment = Payment(
            user_id=user_id,
            challenge_id=challenge_id,
            amount_mad=challenge.price_mad,
            payment_method='cmi',
            status='completed',
            transaction_id=transaction_id,
            completed_at=datetime.utcnow()
        )

        db.session.add(payment)
        db.session.commit()

        return payment
    
    def process_crypto_payment(self, user_id, challenge_id):
        """Process Crypto payment (mock with simulation)"""
        import time
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        # Simulate payment processing delay (3-4 seconds for crypto)
        time.sleep(3.5)

        # Generate mock transaction ID
        transaction_id = f"CRYPTO_{uuid.uuid4().hex[:16].upper()}"

        payment = Payment(
            user_id=user_id,
            challenge_id=challenge_id,
            amount_mad=challenge.price_mad,
            payment_method='crypto',
            status='completed',
            transaction_id=transaction_id,
            completed_at=datetime.utcnow()
        )

        db.session.add(payment)
        db.session.commit()

        return payment

    def _mock_paypal_payment(self, user_id, challenge_id):
        """Mock PayPal payment for testing when credentials aren't configured"""
        import time
        from models import Challenge, UserChallenge
        from services.challenge_engine import ChallengeEngine
        import uuid

        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        # Simulate payment processing delay (1.5-2.5 seconds for PayPal)
        time.sleep(2.0)

        # Generate mock transaction ID
        transaction_id = f"PAYPAL_MOCK_{uuid.uuid4().hex[:16].upper()}"

        payment = Payment(
            user_id=user_id,
            challenge_id=challenge_id,
            amount_mad=challenge.price_mad,
            payment_method='paypal',
            status='completed',
            transaction_id=transaction_id,
            completed_at=datetime.utcnow()
        )

        db.session.add(payment)
        db.session.commit()

        # Create user challenge with status 'active'
        challenge_engine = ChallengeEngine()
        user_challenge = challenge_engine.create_user_challenge(user_id, challenge_id)

        return {
            'order_id': f'mock_order_{uuid.uuid4().hex[:8]}',
            'approval_url': None,  # Mock - no redirect needed
            'payment_id': payment.id,
            'mock_payment': True,
            'message': 'Mock PayPal payment processed successfully'
        }

    def create_paypal_order(self, user_id, challenge_id):
        """Create PayPal order"""
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        # Get PayPal config from environment
        from config import Config
        config = Config()
        client_id = config.PAYPAL_CLIENT_ID
        client_secret = config.PAYPAL_CLIENT_SECRET
        mode = config.PAYPAL_MODE

        if not client_id or not client_secret:
            # Fallback to mock payment for testing
            return self._mock_paypal_payment(user_id, challenge_id)

        # PayPal API endpoint
        base_url = 'https://api-m.sandbox.paypal.com' if mode == 'sandbox' else 'https://api-m.paypal.com'

        # Get access token
        access_token = self._get_paypal_access_token_env(client_id, client_secret, base_url)
        if not access_token:
            raise ValueError("Failed to get PayPal access token")
        
        # Create order
        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": "MAD",
                    "value": str(float(challenge.price_mad))
                }
            }]
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        response = requests.post(
            f'{base_url}/v2/checkout/orders',
            json=order_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            order = response.json()
            
            # Create payment record
            payment = Payment(
                user_id=user_id,
                challenge_id=challenge_id,
                amount_mad=challenge.price_mad,
                payment_method='paypal',
                status='pending',
                paypal_order_id=order['id']
            )
            
            db.session.add(payment)
            db.session.commit()
            
            # Find approval link
            approval_url = None
            for link in order.get('links', []):
                if link.get('rel') == 'approve':
                    approval_url = link.get('href')
                    break
            
            return {
                'order_id': order['id'],
                'approval_url': approval_url,
                'payment_id': payment.id
            }
        else:
            raise ValueError(f"PayPal API error: {response.text}")
    
    def capture_paypal_order(self, order_id):
        """Capture PayPal order"""
        paypal_config = PayPalConfig.query.first()
        if not paypal_config:
            raise ValueError("PayPal not configured")
        
        base_url = 'https://api-m.sandbox.paypal.com' if paypal_config.mode == 'sandbox' else 'https://api-m.paypal.com'
        access_token = self._get_paypal_access_token(paypal_config)
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        response = requests.post(
            f'{base_url}/v2/checkout/orders/{order_id}/capture',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            capture_data = response.json()
            
            # Update payment status
            payment = Payment.query.filter_by(paypal_order_id=order_id).first()
            if payment:
                payment.status = 'completed'
                payment.transaction_id = capture_data.get('id')
                payment.completed_at = datetime.utcnow()
                db.session.commit()
            
            return capture_data
        else:
            raise ValueError(f"PayPal capture error: {response.text}")
    
    def _get_paypal_access_token_env(self, client_id, client_secret, base_url):
        """Get PayPal access token using environment credentials"""
        auth = (client_id, client_secret)
        headers = {'Accept': 'application/json', 'Accept-Language': 'en_US'}
        data = {'grant_type': 'client_credentials'}

        response = requests.post(
            f'{base_url}/v1/oauth2/token',
            auth=auth,
            headers=headers,
            data=data,
            timeout=10
        )

        if response.status_code == 200:
            return response.json().get('access_token')
        return None

    def _get_paypal_access_token(self, paypal_config):
        """Legacy method for database config (deprecated)"""
        return None
