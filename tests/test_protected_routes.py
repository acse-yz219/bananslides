import io
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, '..', 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app


def _register_and_get_token(client):
    email = 'user_' + __import__('uuid').uuid4().hex[:8] + '@example.com'
    password = 'P@ssw0rd123'
    resp = client.post('/api/auth/register', json={'email': email, 'password': password})
    assert resp.status_code in (200, 201)
    token = resp.get_json()['data']['token']
    return token


def test_create_project_protection():
    app = create_app()
    client = app.test_client()

    # Without auth
    resp = client.post('/api/projects', json={
        'creation_type': 'idea',
        'idea_prompt': 'test'
    })
    assert resp.status_code == 401

    # With auth
    token = _register_and_get_token(client)
    resp = client.post('/api/projects', json={
        'creation_type': 'idea',
        'idea_prompt': 'with auth'
    }, headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 201


def test_material_upload_protection():
    app = create_app()
    client = app.test_client()

    file_bytes = io.BytesIO(b'fake png content')
    file_bytes.name = 'test.png'

    # Without auth
    resp = client.post('/api/materials/upload', data={
        'file': (file_bytes, 'test.png')
    }, content_type='multipart/form-data')
    assert resp.status_code == 401

    # With auth
    file_bytes = io.BytesIO(b'fake png content')
    file_bytes.name = 'test.png'
    token = _register_and_get_token(client)
    resp = client.post('/api/materials/upload', data={
        'file': (file_bytes, 'test.png')
    }, content_type='multipart/form-data', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 201


def test_template_upload_protection():
    app = create_app()
    client = app.test_client()

    token = _register_and_get_token(client)
    # Create a project first
    resp = client.post('/api/projects', json={'creation_type': 'idea', 'idea_prompt': 't'},
                       headers={'Authorization': f'Bearer {token}'})
    project_id = resp.get_json()['data']['project_id']

    # Without auth
    file_bytes = io.BytesIO(b'fake png content')
    file_bytes.name = 'template.png'
    resp = client.post(f'/api/projects/{project_id}/template', data={
        'template_image': (file_bytes, 'template.png')
    }, content_type='multipart/form-data')
    assert resp.status_code == 401

    # With auth
    file_bytes = io.BytesIO(b'fake png content')
    file_bytes.name = 'template.png'
    resp = client.post(f'/api/projects/{project_id}/template', data={
        'template_image': (file_bytes, 'template.png')
    }, content_type='multipart/form-data', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200


if __name__ == '__main__':
    try:
        test_create_project_protection()
        test_material_upload_protection()
        test_template_upload_protection()
        print('✅ Protected routes tests passed')
    except AssertionError as e:
        print('❌ Protected routes tests failed:', e)
        raise
