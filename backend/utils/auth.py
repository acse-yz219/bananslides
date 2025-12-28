import re
from typing import Optional, Tuple
from flask import current_app, request, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from functools import wraps
from models import db
from models.user import User
from werkzeug.security import generate_password_hash, check_password_hash


def get_serializer() -> URLSafeTimedSerializer:
    secret_key = current_app.config.get('SECRET_KEY') or 'change-me'
    salt = current_app.config.get('SECURITY_SALT', 'banana-auth-salt')
    return URLSafeTimedSerializer(secret_key, salt=salt)


def create_token(user_id: str, email: str) -> str:
    s = get_serializer()
    return s.dumps({'uid': user_id, 'email': email})


def decode_token(token: str, max_age_seconds: Optional[int] = None) -> Optional[dict]:
    s = get_serializer()
    try:
        if max_age_seconds:
            return s.loads(token, max_age=max_age_seconds)
        return s.loads(token)
    except SignatureExpired:
        return None
    except BadSignature:
        return None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
        else:
            token = request.cookies.get('auth_token', '')
            if not token:
                from utils.response import error_response
                return error_response('UNAUTHORIZED', 'Authorization header missing or invalid', 401)
        payload = decode_token(token, current_app.config.get('AUTH_TOKEN_EXPIRES', 60 * 60 * 24 * 7))
        if not payload:
            from utils.response import error_response
            return error_response('UNAUTHORIZED', 'Invalid or expired token', 401)

        user = User.query.filter_by(id=payload.get('uid')).first()
        if not user:
            from utils.response import error_response
            return error_response('UNAUTHORIZED', 'User not found', 401)

        g.current_user = user
        return fn(*args, **kwargs)
    return wrapper


def is_valid_email(email: str) -> bool:
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)
