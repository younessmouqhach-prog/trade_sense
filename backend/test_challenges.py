#!/usr/bin/env python3
"""
Test script for challenge templates endpoint
"""
from flask import Flask
from resources.challenges import challenges_bp
from extensions import db
from models import Challenge
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tradesense.db'
app.config['SECRET_KEY'] = 'test'
db.init_app(app)

app.register_blueprint(challenges_bp, url_prefix='/api/challenges')

def test_challenges():
    with app.app_context():
        print('Testing challenge templates endpoint...')

        # Check what's in the database
        challenges = Challenge.query.all()
        print(f'Challenges in database: {len(challenges)}')
        for challenge in challenges:
            print(f'- ID: {challenge.id}, Name: {challenge.name}, Tier: {challenge.tier}')

        # Test the endpoint
        with app.test_client() as client:
            response = client.get('/api/challenges/templates')
            print(f'\nEndpoint status: {response.status_code}')
            if response.status_code == 200:
                data = json.loads(response.data.decode('utf-8'))
                print(f'Response data: {data}')
            else:
                print(f'Error: {response.data.decode("utf-8")}')

if __name__ == '__main__':
    test_challenges()