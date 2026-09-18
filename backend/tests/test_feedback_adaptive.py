import pytest
from app.db.models.user import User
from app.db.models.analytics import Analytics
from app.db.models.outcome import UserOutcome


@pytest.fixture
def auth_client_and_user(client, db_session):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Miles Morales", "email": "miles@spiderman.ai", "password": "Password123!"},
    )
    user = db_session.query(User).filter(User.email == "miles@spiderman.ai").first()
    client.post(
        "/api/v1/auth/verify-email",
        json={"email": "miles@spiderman.ai", "otp": user.verification_otp},
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "miles@spiderman.ai", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers, user


def test_zero_inquiries_triggers_repricing_recommendation(auth_client_and_user):
    client, headers, user = auth_client_and_user

    res = client.post(
        "/api/v1/feedback/outcome",
        json={
            "opportunity_title": "Python ETL Pipeline Automation",
            "platform": "Fiverr",
            "days_active": 8,
            "inquiries_received": 0,
            "orders_converted": 0,
            "revenue_inr": 0.0,
            "notes": "No messages received after a week.",
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "outcome" in data
    assert data["outcome"]["status"] == "stalled"
    assert "strategy_recommendation" in data
    strategy = data["strategy_recommendation"]
    assert "20%" in strategy or "lower" in strategy.lower() or "headline" in strategy.lower()


def test_high_inquiries_zero_conversions_triggers_friction_guidance(auth_client_and_user):
    client, headers, user = auth_client_and_user

    res = client.post(
        "/api/v1/feedback/outcome",
        json={
            "opportunity_title": "FastAPI Webhook Integration",
            "platform": "Upwork",
            "days_active": 5,
            "inquiries_received": 4,
            "orders_converted": 0,
            "revenue_inr": 0.0,
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "Conversion Friction Detected" in data["strategy_recommendation"]


def test_multiple_conversions_triggers_social_proof_price_increase(auth_client_and_user):
    client, headers, user = auth_client_and_user

    res = client.post(
        "/api/v1/feedback/outcome",
        json={
            "opportunity_title": "Automated Web Scraping Bot",
            "platform": "Fiverr",
            "days_active": 12,
            "inquiries_received": 6,
            "orders_converted": 3,
            "revenue_inr": 12000.0,
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"]["status"] == "converted"
    assert "Social Proof Milestone Met" in data["strategy_recommendation"]
    assert "+25%" in data["strategy_recommendation"]


def test_get_user_outcomes_list(auth_client_and_user):
    client, headers, user = auth_client_and_user

    client.post(
        "/api/v1/feedback/outcome",
        json={
            "opportunity_title": "React Dashboard Optimization",
            "platform": "Cold Outreach",
            "days_active": 3,
            "inquiries_received": 2,
            "orders_converted": 1,
            "revenue_inr": 4500.0,
        },
        headers=headers,
    )

    get_res = client.get("/api/v1/feedback/outcomes", headers=headers)
    assert get_res.status_code == 200
    outcomes = get_res.json()
    assert len(outcomes) >= 1
    assert outcomes[0]["opportunity_title"] == "React Dashboard Optimization"
    assert outcomes[0]["revenue_inr"] == 4500.0


def test_link_telemetry_redirect_and_click_tracking(auth_client_and_user, db_session):
    client, headers, user = auth_client_and_user

    tracking_id = f"{user.id}-python-automation"
    dest_url = "https://github.com/developer/python-automation"

    # Call telemetry tracking endpoint (unauthenticated public link)
    res = client.get(f"/api/v1/track/{tracking_id}?dest={dest_url}", follow_redirects=False)
    assert res.status_code == 302
    assert res.headers["location"] == dest_url

    # Check that click event was logged in Analytics table
    click_event = (
        db_session.query(Analytics)
        .filter(Analytics.user_id == user.id, Analytics.metric_name == f"click:{tracking_id}")
        .first()
    )
    assert click_event is not None
    assert click_event.value == 1

    # Second click increments counter
    client.get(f"/api/v1/track/{tracking_id}?dest={dest_url}", follow_redirects=False)
    db_session.refresh(click_event)
    assert click_event.value == 2
