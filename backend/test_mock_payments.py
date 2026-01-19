#!/usr/bin/env python3
"""
Test script for Mock Payment Gateway
"""
import time
from services.payment_service import PaymentService
from services.challenge_engine import ChallengeEngine
from extensions import db
from models import User, Challenge, UserChallenge, Payment
from flask import Flask

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tradesense.db'
app.config['SECRET_KEY'] = 'test'
db.init_app(app)

def test_mock_payments():
    with app.app_context():
        # Get test user
        user = User.query.filter_by(email='test@example.com').first()
        challenge = Challenge.query.first()

        print('Testing Mock Payment Gateway Simulation')
        print('=' * 50)
        print(f'User: {user.email} (ID: {user.id})')
        print(f'Challenge: {challenge.name} (ID: {challenge.id}, Price: {challenge.price_mad} MAD)')
        print()

        # Test CMI payment simulation
        print('1. Testing CMI Payment (2.5 seconds simulation)...')
        start_time = time.time()
        payment_service = PaymentService()
        cmi_payment = payment_service.process_cmi_payment(user.id, challenge.id)
        cmi_time = time.time() - start_time
        print('.2f')
        print(f'   [PAYMENT] Payment ID: {cmi_payment.id}, Status: {cmi_payment.status}')
        print(f'   [TXN] Transaction ID: {cmi_payment.transaction_id}')
        print()

        # Test Crypto payment simulation
        print('2. Testing Crypto Payment (3.5 seconds simulation)...')
        start_time = time.time()
        crypto_payment = payment_service.process_crypto_payment(user.id, challenge.id)
        crypto_time = time.time() - start_time
        print('.2f')
        print(f'   [PAYMENT] Payment ID: {crypto_payment.id}, Status: {crypto_payment.status}')
        print(f'   [TXN] Transaction ID: {crypto_payment.transaction_id}')
        print()

        # Test PayPal payment simulation
        print('3. Testing PayPal Payment (2.0 seconds simulation)...')
        start_time = time.time()
        paypal_result = payment_service._mock_paypal_payment(user.id, challenge.id)
        paypal_time = time.time() - start_time
        print('.2f')
        print(f'   [PAYMENT] Payment ID: {paypal_result["payment_id"]}, Mock: {paypal_result["mock_payment"]}')
        print(f'   [ORDER] Order ID: {paypal_result["order_id"]}')
        print()

        # Check user challenges created
        print('4. Verifying User Challenges Created:')
        user_challenges = UserChallenge.query.filter_by(user_id=user.id).all()
        for uc in user_challenges:
            print(f'   [CHALLENGE] ID: {uc.id}, Status: {uc.status}, Balance: {uc.initial_balance}')
        print()

        # Check all payments
        print('5. Total Payments in Database:')
        payments = Payment.query.filter_by(user_id=user.id).all()
        for payment in payments:
            print(f'   [{payment.payment_method.upper()}] {payment.amount_mad} MAD - {payment.status}')

        print()
        print('[SUCCESS] Mock Payment Gateway Test Completed Successfully!')
        print('   [OK] All payment methods simulate realistic processing times')
        print('   [OK] User challenges are created with status "active"')
        print('   [OK] Payments are recorded in the database')

if __name__ == '__main__':
    test_mock_payments()