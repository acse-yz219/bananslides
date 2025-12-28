import json
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, '..', 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app


def test_register_and_login():
    app = create_app()
    client = app.test_client()

    email = 'user_' + __import__('uuid').uuid4().hex[:8] + '@example.com'
    password = 'P@ssw0rd123'

    # Register
    resp = client.post('/api/auth/register', json={'email': email, 'password': password})
    assert resp.status_code in (200, 201)
    data = resp.get_json()
    assert data.get('success') is True
    assert 'data' in data and 'token' in data['data']
    token = data['data']['token']
    set_cookie = resp.headers.get('Set-Cookie', '')
    assert 'auth_token=' in set_cookie

    # Get me
    resp = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    me = resp.get_json()
    assert me.get('success') is True
    assert me['data']['user']['email'] == email

    # Login
    resp = client.post('/api/auth/login', json={'email': email, 'password': password})
    assert resp.status_code == 200
    login_data = resp.get_json()
    assert login_data.get('success') is True
    assert 'token' in login_data['data']
    set_cookie = resp.headers.get('Set-Cookie', '')
    assert 'auth_token=' in set_cookie


if __name__ == '__main__':
    try:
        test_register_and_login()
        print('✅ Auth register/login tests passed')
    except AssertionError as e:
        print('❌ Auth tests failed:', e)
        raise
