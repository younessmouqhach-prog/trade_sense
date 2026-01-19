from models import UserChallenge

class RiskEngine:
    """Risk management and evaluation engine"""
    
    def evaluate_challenge(self, user_challenge):
        """Evaluate challenge against all risk rules"""
        evaluation = {
            'status': 'active',
            'reason': None
        }
        
        # Check profit target
        profit = user_challenge.equity - user_challenge.initial_balance
        if profit >= user_challenge.profit_target:
            evaluation['status'] = 'passed'
            evaluation['reason'] = 'Profit target achieved'
            return evaluation
        
        # Check daily loss limit
        if user_challenge.daily_loss >= user_challenge.daily_loss_limit:
            evaluation['status'] = 'failed'
            evaluation['reason'] = 'Daily loss limit exceeded'
            return evaluation
        
        # Check max drawdown
        drawdown = user_challenge.peak_balance - user_challenge.equity
        if drawdown >= user_challenge.max_drawdown_limit:
            evaluation['status'] = 'failed'
            evaluation['reason'] = 'Maximum drawdown exceeded'
            return evaluation
        
        # Check if equity is negative or zero
        if user_challenge.equity <= 0:
            evaluation['status'] = 'failed'
            evaluation['reason'] = 'Account equity depleted'
            return evaluation
        
        return evaluation
    
    def calculate_risk_metrics(self, user_challenge):
        """Calculate risk metrics for a challenge"""
        profit = user_challenge.equity - user_challenge.initial_balance
        profit_percent = (profit / user_challenge.initial_balance * 100) if user_challenge.initial_balance > 0 else 0
        
        drawdown = user_challenge.peak_balance - user_challenge.equity
        drawdown_percent = (drawdown / user_challenge.peak_balance * 100) if user_challenge.peak_balance > 0 else 0
        
        daily_loss_percent = (user_challenge.daily_loss / user_challenge.daily_loss_limit * 100) if user_challenge.daily_loss_limit > 0 else 0
        
        return {
            'profit': float(profit),
            'profit_percent': float(profit_percent),
            'drawdown': float(drawdown),
            'drawdown_percent': float(drawdown_percent),
            'daily_loss': float(user_challenge.daily_loss),
            'daily_loss_percent': float(daily_loss_percent),
            'remaining_daily_loss': float(user_challenge.daily_loss_limit - user_challenge.daily_loss),
        }
