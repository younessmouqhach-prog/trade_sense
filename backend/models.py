from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from sqlalchemy import func

class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(255), nullable=False)
    last_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='trader', nullable=False)  # trader, admin, superadmin
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    challenges = db.relationship('UserChallenge', back_populates='user', lazy='dynamic')
    trades = db.relationship('Trade', back_populates='user', lazy='dynamic')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password"""
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        """Get full name from first and last name"""
        return f"{self.first_name} {self.last_name}"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Challenge(db.Model):
    """Challenge template model"""
    __tablename__ = 'challenges'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    tier = db.Column(db.String(50), nullable=False)  # starter, pro, elite
    initial_balance = db.Column(db.Numeric(15, 2), nullable=False, default=5000.0)
    max_daily_loss_percent = db.Column(db.Numeric(5, 2), nullable=False, default=5.0)
    max_total_drawdown_percent = db.Column(db.Numeric(5, 2), nullable=False, default=10.0)
    profit_target_percent = db.Column(db.Numeric(5, 2), nullable=False, default=10.0)
    price_mad = db.Column(db.Numeric(10, 2), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user_challenges = db.relationship('UserChallenge', back_populates='challenge', lazy='dynamic')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'tier': self.tier,
            'initial_balance': float(self.initial_balance),
            'max_daily_loss_percent': float(self.max_daily_loss_percent),
            'max_total_drawdown_percent': float(self.max_total_drawdown_percent),
            'profit_target_percent': float(self.profit_target_percent),
            'price_mad': float(self.price_mad),
            'is_active': self.is_active,
        }

class UserChallenge(db.Model):
    """User challenge instance model"""
    __tablename__ = 'user_challenges'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    status = db.Column(db.String(50), default='active', nullable=False)  # active, passed, failed
    initial_balance = db.Column(db.Numeric(15, 2), nullable=False)
    current_balance = db.Column(db.Numeric(15, 2), nullable=False)
    equity = db.Column(db.Numeric(15, 2), nullable=False)
    peak_balance = db.Column(db.Numeric(15, 2), nullable=False)  # For drawdown calculation
    daily_loss_limit = db.Column(db.Numeric(15, 2), nullable=False)
    max_drawdown_limit = db.Column(db.Numeric(15, 2), nullable=False)
    profit_target = db.Column(db.Numeric(15, 2), nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    current_day = db.Column(db.Date, default=datetime.utcnow().date, nullable=False)
    daily_loss = db.Column(db.Numeric(15, 2), default=0.0, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='challenges')
    challenge = db.relationship('Challenge', back_populates='user_challenges')
    trades = db.relationship('Trade', back_populates='user_challenge', lazy='dynamic')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'status': self.status,
            'initial_balance': float(self.initial_balance),
            'current_balance': float(self.current_balance),
            'equity': float(self.equity),
            'peak_balance': float(self.peak_balance),
            'daily_loss_limit': float(self.daily_loss_limit),
            'max_drawdown_limit': float(self.max_drawdown_limit),
            'profit_target': float(self.profit_target),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'current_day': self.current_day.isoformat() if self.current_day else None,
            'daily_loss': float(self.daily_loss),
            'profit_percent': float((self.equity - self.initial_balance) / self.initial_balance * 100),
            'drawdown_percent': float((self.peak_balance - self.equity) / self.peak_balance * 100) if self.peak_balance > 0 else 0.0,
        }

class Trade(db.Model):
    """Trade model"""
    __tablename__ = 'trades'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    user_challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id'), nullable=False, index=True)
    symbol = db.Column(db.String(50), nullable=False, index=True)
    trade_type = db.Column(db.String(10), nullable=False)  # buy, sell
    quantity = db.Column(db.Numeric(15, 8), nullable=False)
    entry_price = db.Column(db.Numeric(15, 8), nullable=False)
    exit_price = db.Column(db.Numeric(15, 8), nullable=True)
    pnl = db.Column(db.Numeric(15, 2), default=0.0, nullable=False)
    stop_loss = db.Column(db.Numeric(15, 8), nullable=True)
    take_profit = db.Column(db.Numeric(15, 8), nullable=True)
    status = db.Column(db.String(50), default='open', nullable=False)  # open, closed
    opened_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    closed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', back_populates='trades')
    user_challenge = db.relationship('UserChallenge', back_populates='trades')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_challenge_id': self.user_challenge_id,
            'symbol': self.symbol,
            'trade_type': self.trade_type,
            'quantity': float(self.quantity),
            'stop_loss': float(self.stop_loss) if self.stop_loss else None,
            'take_profit': float(self.take_profit) if self.take_profit else None,
            'entry_price': float(self.entry_price),
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'pnl': float(self.pnl),
            'status': self.status,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
        }

class Payment(db.Model):
    """Payment model"""
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    amount_mad = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)  # cmi, crypto, paypal
    status = db.Column(db.String(50), default='pending', nullable=False)  # pending, completed, failed
    transaction_id = db.Column(db.String(255), unique=True, nullable=True)
    paypal_order_id = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User')
    challenge = db.relationship('Challenge')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'amount_mad': float(self.amount_mad),
            'payment_method': self.payment_method,
            'status': self.status,
            'transaction_id': self.transaction_id,
            'paypal_order_id': self.paypal_order_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }

class PayPalConfig(db.Model):
    """PayPal configuration model (SuperAdmin only)"""
    __tablename__ = 'paypal_config'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.String(255), nullable=False)
    client_secret = db.Column(db.String(255), nullable=False)
    mode = db.Column(db.String(50), default='sandbox', nullable=False)  # sandbox, live
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_secret=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'client_id': self.client_id,
            'mode': self.mode,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_secret:
            data['client_secret'] = self.client_secret
        return data

# ==========================================
# MASTERCLASS MODELS
# ==========================================

class CourseCategory(db.Model):
    """Course category model (Débutant, Intermédiaire, Avancé)"""
    __tablename__ = 'course_categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)  # "Débutant", "Intermédiaire", "Avancé"
    description = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, default=0, nullable=False)  # Display order
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    courses = db.relationship('Course', back_populates='category', lazy='dynamic')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'order': self.order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Course(db.Model):
    """Course model"""
    __tablename__ = 'courses'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('course_categories.id'), nullable=False)
    level = db.Column(db.String(50), nullable=False)  # "beginner", "intermediate", "advanced"
    duration_minutes = db.Column(db.Integer, nullable=True)  # Estimated duration
    video_url = db.Column(db.String(500), nullable=True)  # Video file URL or embed URL
    thumbnail_url = db.Column(db.String(500), nullable=True)
    summary = db.Column(db.Text, nullable=True)  # Text summary
    resources = db.Column(db.Text, nullable=True)  # JSON string of downloadable resources
    is_free = db.Column(db.Boolean, default=False, nullable=False)
    access_level = db.Column(db.String(50), default='public', nullable=False)  # "public", "funded", "premium"
    order = db.Column(db.Integer, default=0, nullable=False)  # Order within category
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = db.relationship('CourseCategory', back_populates='courses')
    user_progress = db.relationship('UserCourseProgress', back_populates='course', lazy='dynamic')

    def to_dict(self, include_progress=False, user_id=None):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'level': self.level,
            'duration_minutes': self.duration_minutes,
            'video_url': self.video_url,
            'thumbnail_url': self.thumbnail_url,
            'summary': self.summary,
            'resources': self.resources,
            'is_free': self.is_free,
            'access_level': self.access_level,
            'order': self.order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_progress and user_id:
            progress = UserCourseProgress.query.filter_by(
                user_id=user_id, course_id=self.id
            ).first()
            if progress:
                data['progress'] = progress.to_dict()

        return data

class UserCourseProgress(db.Model):
    """User course progress model"""
    __tablename__ = 'user_course_progress'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    progress_percent = db.Column(db.Numeric(5, 2), default=0, nullable=False)  # 0.00 to 100.00
    is_completed = db.Column(db.Boolean, default=False, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    last_watched_position = db.Column(db.Integer, default=0, nullable=False)  # seconds
    notes = db.Column(db.Text, nullable=True)  # User notes
    quiz_score = db.Column(db.Numeric(5, 2), nullable=True)  # Quiz score if applicable
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User')
    course = db.relationship('Course', back_populates='user_progress')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'course_id', name='unique_user_course'),
    )

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'progress_percent': float(self.progress_percent),
            'is_completed': self.is_completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'last_watched_position': self.last_watched_position,
            'notes': self.notes,
            'quiz_score': float(self.quiz_score) if self.quiz_score else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
