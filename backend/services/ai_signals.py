from datetime import datetime
import random

class AISignalsService:
    """AI signals service (mock implementation)"""
    
    def generate_signal(self, symbol):
        """Generate AI trading signal for a symbol"""
        # Mock AI signal generation
        # In production, this would connect to actual AI service
        
        signals = ['BUY', 'SELL', 'HOLD']
        confidence_levels = [0.75, 0.80, 0.85, 0.90, 0.95]
        
        signal = random.choice(signals)
        confidence = random.choice(confidence_levels)
        
        # Risk level (1-5, 5 being highest risk)
        risk_level = random.randint(1, 5)
        
        return {
            'symbol': symbol,
            'signal': signal,
            'confidence': confidence,
            'risk_level': risk_level,
            'timestamp': datetime.utcnow().isoformat(),
            'reason': self._generate_reason(signal)
        }
    
    def _generate_reason(self, signal):
        """Generate reason for signal"""
        reasons = {
            'BUY': [
                'Strong bullish momentum detected',
                'Support level reached with positive RSI divergence',
                'Breakout above resistance with high volume',
                'Fibonacci retracement at key level'
            ],
            'SELL': [
                'Overbought conditions with bearish divergence',
                'Resistance level rejection detected',
                'Volume spike suggests distribution',
                'Technical indicators showing reversal signals'
            ],
            'HOLD': [
                'Waiting for clearer trend confirmation',
                'Current price in consolidation zone',
                'Mixed signals require more data',
                'Low volatility period - wait for breakout'
            ]
        }
        return random.choice(reasons.get(signal, ['Signal generated']))
    
    def get_risk_alerts(self, user_challenge_id):
        """Get risk alerts for a user challenge"""
        from models import UserChallenge
        from services.risk_engine import RiskEngine
        
        user_challenge = UserChallenge.query.get(user_challenge_id)
        if not user_challenge:
            return []
        
        risk_engine = RiskEngine()
        metrics = risk_engine.calculate_risk_metrics(user_challenge)
        
        alerts = []
        
        # Daily loss alert
        if metrics['daily_loss_percent'] > 80:
            alerts.append({
                'type': 'warning',
                'message': f"Daily loss limit at {metrics['daily_loss_percent']:.1f}%",
                'severity': 'high' if metrics['daily_loss_percent'] > 90 else 'medium'
            })
        
        # Drawdown alert
        if metrics['drawdown_percent'] > 8:
            alerts.append({
                'type': 'warning',
                'message': f"Drawdown at {metrics['drawdown_percent']:.1f}%",
                'severity': 'high' if metrics['drawdown_percent'] > 9 else 'medium'
            })
        
        return alerts
