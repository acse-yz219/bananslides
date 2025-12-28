import uuid
from datetime import datetime
from . import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_pro = db.Column(db.Boolean, default=False)
    pro_type = db.Column(db.String(20), nullable=True)  # 'monthly', 'annual'
    pro_expire_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'user_id': self.id,
            'email': self.email,
            'is_pro': self.is_pro,
            'pro_type': self.pro_type,
            'pro_expire_date': self.pro_expire_date.isoformat() if self.pro_expire_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

