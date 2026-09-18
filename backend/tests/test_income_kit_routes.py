import pytest
from app.db.models.user import User
from app.db.models.income_kit import IncomeKit


@pytest.fixture
def auth_client_and_user(client, db_session):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Sarah Connor", "email": "sarah@resistance.ai", "password": "Password123!"},
    )
    user = db_session.query(User).filter(User.email == "sarah@resistance.ai").first()
    client.post(
        "/api/v1/auth/verify-email",
        json={"email": "sarah@resistance.ai", "otp": user.verification_otp},
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "sarah@resistance.ai", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers, user


def test_post_income_kit_slash_and_non_slash_without_redirect(auth_client_and_user):
    client, headers, user = auth_client_and_user

    # 1. Test POST without trailing slash (e.g. /api/v1/income-kit)
    res_no_slash = client.post(
        "/api/v1/income-kit",
        json={"opportunityId": "opp-test-no-slash", "service": "Cloud Infrastructure Automation"},
        headers=headers,
    )
    assert res_no_slash.status_code == 200
    data = res_no_slash.json()
    assert "id" in data
    assert data["opportunityId"] == "opp-test-no-slash"
    assert "Cloud Infrastructure Automation" in data["title"]
    assert data["service"] is not None
    assert "createdAt" in data
    assert len(data["assets"]) == 4

    # 2. Test POST with trailing slash (e.g. /api/v1/income-kit/)
    res_slash = client.post(
        "/api/v1/income-kit/",
        json={"opportunityId": "opp-test-slash", "service": "Telegram Notification Bot"},
        headers=headers,
    )
    assert res_slash.status_code == 200
    data_slash = res_slash.json()
    assert data_slash["opportunityId"] == "opp-test-slash"
    assert "Telegram Notification Bot" in data_slash["title"]
    assert len(data_slash["assets"]) == 4


def test_get_income_kit_slash_and_non_slash(auth_client_and_user):
    client, headers, user = auth_client_and_user

    # GET without slash
    get_no_slash = client.get("/api/v1/income-kit", headers=headers)
    assert get_no_slash.status_code == 200
    data = get_no_slash.json()
    assert "id" in data
    assert "opportunityId" in data
    assert "assets" in data
    assert len(data["assets"]) == 4

    # GET with slash
    get_slash = client.get("/api/v1/income-kit/", headers=headers)
    assert get_slash.status_code == 200
    assert len(get_slash.json()["assets"]) == 4


def test_income_kit_query_param_fallback(auth_client_and_user):
    client, headers, user = auth_client_and_user

    # POST with query parameters instead of body
    res = client.post(
        "/api/v1/income-kit?opportunityId=opp-query-1&service=FastAPI%20Microservices",
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["opportunityId"] == "opp-query-1"
    assert "FastAPI Microservices" in data["title"]
    assert len(data["assets"]) == 4


def test_get_income_kit_by_id(auth_client_and_user, db_session):
    client, headers, user = auth_client_and_user

    post_res = client.post(
        "/api/v1/income-kit",
        json={"opportunityId": "opp-by-id", "service": "Custom Data Pipeline"},
        headers=headers,
    )
    kit_id = post_res.json()["id"]

    get_id_res = client.get(f"/api/v1/income-kit/{kit_id}", headers=headers)
    assert get_id_res.status_code == 200
    data = get_id_res.json()
    assert data["id"] == str(kit_id)
    assert len(data["assets"]) == 4


def test_income_kit_eliminates_generic_client_deliverable_fallback(auth_client_and_user, db_session):
    client, headers, user = auth_client_and_user

    # Generate a kit without specifying title or params
    res = client.post(
        "/api/v1/income-kit",
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "Client Deliverable" not in data["title"]
    assert "Client Deliverable" not in (data.get("opportunityTitle") or "")
    assert len(data["assets"]) == 4

    # Also test get_latest endpoint
    latest_res = client.get("/api/v1/income-kit/latest", headers=headers)
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert "Client Deliverable" not in latest_data["title"]

