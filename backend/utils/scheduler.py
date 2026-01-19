from threading import Thread
import time
from datetime import datetime, date
from extensions import db
from models import UserChallenge

class ChallengeScheduler:
    """Background scheduler for challenge evaluations"""
    
    def __init__(self, app=None):
        self.app = app
        self.running = False
        self.thread = None
    
    def init_app(self, app):
        """Initialize with Flask app"""
        self.app = app
    
    def start(self):
        """Start scheduler thread"""
        if not self.running:
            self.running = True
            self.thread = Thread(target=self._run, daemon=True)
            self.thread.start()
    
    def stop(self):
        """Stop scheduler thread"""
        self.running = False
        if self.thread:
            self.thread.join()
    
    def _run(self):
        """Main scheduler loop"""
        from services.risk_engine import RiskEngine
        from services.challenge_engine import ChallengeEngine
        from utils.bvcscrap import BVCscrap
        
        # Initialize market data scrapers for all markets
        stocks_scraper = BVCscrap(market_type='stocks')
        forex_scraper = BVCscrap(market_type='forex')
        crypto_scraper = BVCscrap(market_type='crypto')
        morocco_scraper = BVCscrap(market_type='morocco')
        
        # Scrape immediately on startup
        try:
            print("[Scheduler] Initial market data scrape (all markets)...")
            stocks_scraper.scrape_and_save()
            forex_scraper.scrape_and_save()
            crypto_scraper.scrape_and_save()
            morocco_scraper.scrape_and_save()
        except Exception as e:
            print(f"[Scheduler] Initial scrape error: {e}")
        
        while self.running:
            try:
                with self.app.app_context():
                    # Refresh all market data CSVs every minute
                    try:
                        print("[Scheduler] Refreshing all market data CSVs...")
                        stocks_scraper.scrape_and_save()
                        forex_scraper.scrape_and_save()
                        crypto_scraper.scrape_and_save()
                        morocco_scraper.scrape_and_save()
                    except Exception as e:
                        print(f"[Scheduler] Market data refresh error: {e}")
                    
                    # Reset daily loss for new day
                    self._reset_daily_loss_if_new_day()
                    
                    # Evaluate all active challenges
                    active_challenges = UserChallenge.query.filter_by(status='active').all()
                    risk_engine = RiskEngine()
                    challenge_engine = ChallengeEngine()
                    
                    for challenge in active_challenges:
                        try:
                            # Evaluate risk rules
                            evaluation = risk_engine.evaluate_challenge(challenge)
                            
                            if evaluation['status'] != 'active':
                                challenge_engine.update_challenge_status(
                                    challenge.id,
                                    evaluation['status'],
                                    evaluation.get('reason', '')
                                )
                        except Exception as e:
                            print(f"Error evaluating challenge {challenge.id}: {str(e)}")
                    
                    db.session.commit()
            except Exception as e:
                print(f"Scheduler error: {str(e)}")
            
            # Sleep for 60 seconds
            time.sleep(60)
    
    def _reset_daily_loss_if_new_day(self):
        """Reset daily loss if it's a new day"""
        today = date.today()
        
        challenges = UserChallenge.query.filter(
            UserChallenge.status == 'active',
            UserChallenge.current_day < today
        ).all()
        
        for challenge in challenges:
            challenge.current_day = today
            challenge.daily_loss = 0.0
        
        db.session.commit()

# Global scheduler instance
scheduler = ChallengeScheduler()
