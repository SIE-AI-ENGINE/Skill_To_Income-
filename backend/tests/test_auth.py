import pytest

def test_signup(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "testuser@example.com",
            "password": "testpassword",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert "id" in data

def test_signup_duplicate(client):
    client.post(
        "/api/v1/auth/signup",
        json={"email": "dup@example.com", "password": "pass"},
    )
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "dup@example.com", "password": "pass2"},
    )
    assert response.status_code == 400

def test_login(client):
    client.post(
        "/api/v1/auth/signup",
        json={"email": "login@example.com", "password": "loginpass"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "loginpass"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
