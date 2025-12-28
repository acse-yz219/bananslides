from flask import Blueprint, request, jsonify, current_app, g
from models import db
from models.user import User
from utils.response import success_response, error_response, bad_request
from utils.auth import is_valid_email, hash_password, verify_password, create_token, login_required
from datetime import datetime, timedelta


auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return bad_request('Email and password are required')
    if not is_valid_email(email):
        return bad_request('Invalid email format')

    existing = User.query.filter_by(email=email).first()
    if existing:
        return error_response('EMAIL_EXISTS', '该用户名已被注册', 409)

    user = User(email=email, password_hash=hash_password(password))
    db.session.add(user)
    db.session.commit()

    token = create_token(user.id, user.email)
    resp = jsonify({
        'success': True,
        'message': 'Registered successfully',
        'data': {'user': user.to_dict(), 'token': token}
    })
    max_age = current_app.config.get('AUTH_TOKEN_EXPIRES', 60 * 60 * 24 * 7)
    resp.set_cookie('auth_token', token, max_age=max_age, httponly=True, samesite='Lax', path='/')
    return resp, 201


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return bad_request('Email and password are required')

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return error_response('INVALID_CREDENTIALS', 'Email or password is incorrect', 401)

    token = create_token(user.id, user.email)
    resp = jsonify({
        'success': True,
        'message': 'Login successful',
        'data': {'user': user.to_dict(), 'token': token}
    })
    max_age = current_app.config.get('AUTH_TOKEN_EXPIRES', 60 * 60 * 24 * 7)
    resp.set_cookie('auth_token', token, max_age=max_age, httponly=True, samesite='Lax', path='/')
    return resp, 200


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    resp = jsonify({'success': True, 'message': 'Logout successful', 'data': {}})
    resp.set_cookie('auth_token', '', max_age=0, httponly=True, samesite='Lax', path='/')
    return resp, 200


@auth_bp.route('/api/auth/upgrade', methods=['POST'])
@login_required
def upgrade():
    data = request.get_json(silent=True) or {}
    plan = data.get('plan')  # 'monthly', 'annual'

    if plan not in ['monthly', 'annual']:
        return bad_request('Invalid plan type')

    user = g.current_user
    user.is_pro = True
    user.pro_type = plan

    now = datetime.utcnow()
    if plan == 'monthly':
        user.pro_expire_date = now + timedelta(days=30)
    else:
        user.pro_expire_date = now + timedelta(days=365)

    db.session.commit()

    return success_response({'user': user.to_dict()}, 'Upgrade successful')


@auth_bp.route('/api/auth/me', methods=['GET'])
def me():
    from flask import g
    from utils.auth import decode_token
    
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    else:
        token = request.cookies.get('auth_token', '')
    
    if not token:
        return success_response({'user': None}, 'No authentication provided')
    
    payload = decode_token(token, current_app.config.get('AUTH_TOKEN_EXPIRES', 60 * 60 * 24 * 7))
    if not payload:
        return success_response({'user': None}, 'Invalid or expired token')
    
    user = User.query.filter_by(id=payload.get('uid')).first()
    if not user:
        return success_response({'user': None}, 'User not found')
    
    return success_response({'user': user.to_dict()}, 'OK')
