import pytest

@pytest.fixture
def auth_token(client):
    client.post(
        "/api/v1/auth/signup",
        json={"email": "user@example.com", "password": "password"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "user@example.com", "password": "password"},
    )
    return response.json()["access_token"]

def test_create_skill(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/v1/skills/",
        headers=headers,
        json={
            "core_skill": "Python",
            "detected_tags": ["FastAPI", "Pytest"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["core_skill"] == "Python"
    assert "FastAPI" in data["detected_tags"]

def test_get_skills(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    client.post(
        "/api/v1/skills/",
        headers=headers,
        json={"core_skill": "Python"},
    )
    response = client.get("/api/v1/skills/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["core_skill"] == "Python"
