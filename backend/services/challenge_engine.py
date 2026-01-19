from datetime import datetime
from extensions import db
from models import UserChallenge, Challenge

class ChallengeEngine:
    """Challenge management engine"""
    
    def create_user_challenge(self, user_id, challenge_id):
        """Create a new user challenge instance"""
        challenge_template = Challenge.query.get(challenge_id)
        if not challenge_template:
            raise ValueError("Challenge template not found")
        
        user_challenge = UserChallenge(
            user_id=user_id,
            challenge_id=challenge_id,
            status='active',
            initial_balance=challenge_template.initial_balance,
            current_balance=challenge_template.initial_balance,
            equity=challenge_template.initial_balance,
            peak_balance=challenge_template.initial_balance,
            daily_loss_limit=challenge_template.initial_balance * (challenge_template.max_daily_loss_percent / 100),
            max_drawdown_limit=challenge_template.initial_balance * (challenge_template.max_total_drawdown_percent / 100),
            profit_target=challenge_template.initial_balance * (challenge_template.profit_target_percent / 100),
            current_day=datetime.utcnow().date(),
            daily_loss=0.0
        )
        
        db.session.add(user_challenge)
        db.session.commit()
        
        return user_challenge
    
    def update_challenge_status(self, user_challenge_id, status, reason=None):
        """Update challenge status"""
        user_challenge = UserChallenge.query.get(user_challenge_id)
        if not user_challenge:
            raise ValueError("User challenge not found")
        
        user_challenge.status = status
        if status in ['passed', 'failed']:
            user_challenge.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return user_challenge
    
    def update_equity(self, user_challenge_id, new_equity):
        """Update challenge equity and related fields"""
        user_challenge = UserChallenge.query.get(user_challenge_id)
        if not user_challenge:
            raise ValueError("User challenge not found")
        
        old_equity = user_challenge.equity
        user_challenge.equity = new_equity
        user_challenge.current_balance = new_equity
        
        # Update peak balance if equity increased
        if new_equity > user_challenge.peak_balance:
            user_challenge.peak_balance = new_equity
        
        # Calculate daily loss
        today = datetime.utcnow().date()
        if user_challenge.current_day != today:
            # New day, reset daily loss
            user_challenge.current_day = today
            user_challenge.daily_loss = 0.0
        
        # Calculate daily loss (negative PnL for the day)
        # This is simplified - in production, you'd track PnL per day
        if new_equity < old_equity:
            daily_pnl = new_equity - old_equity
            user_challenge.daily_loss = abs(min(0, daily_pnl))
        
        db.session.commit()
        
        return user_challenge
    
    def get_active_challenge(self, user_id):
        """Get user's active challenge"""
        return UserChallenge.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()
