import pytest

def test_signup(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "testuser@example.com",
            "password": "Password123!",
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
        json={"email": "dup@example.com", "password": "Password123!"},
    )
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "dup@example.com", "password": "Password123!"},
    )
    assert response.status_code == 400

def test_login(client):
    client.post(
        "/api/v1/auth/signup",
        json={"email": "login@example.com", "password": "Password123!"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_password_complexity_rejection(client):
    # Short password (< 8 chars)
    r_short = client.post(
        "/api/v1/auth/signup",
        json={"email": "short@example.com", "password": "Pass1!"},
    )
    assert r_short.status_code == 422
    assert "at least 8 characters" in str(r_short.json())

    # Missing uppercase letter
    r_no_upper = client.post(
        "/api/v1/auth/signup",
        json={"email": "noupper@example.com", "password": "password123!"},
    )
    assert r_no_upper.status_code == 422
    assert "uppercase" in str(r_no_upper.json())

    # Missing numeric digit
    r_no_digit = client.post(
        "/api/v1/auth/signup",
        json={"email": "nodigit@example.com", "password": "Password!!!!"},
    )
    assert r_no_digit.status_code == 422
    assert "numeric digit" in str(r_no_digit.json())

    # Missing special character
    r_no_spec = client.post(
        "/api/v1/auth/signup",
        json={"email": "nospec@example.com", "password": "Password123"},
    )
    assert r_no_spec.status_code == 422
    assert "special character" in str(r_no_spec.json())
