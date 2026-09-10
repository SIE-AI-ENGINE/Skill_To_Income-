import pytest
from app.db.models.user import User
from app.db.models.skill import Skill


def test_signup_generates_otp_and_unverified(client, db_session):
    signup_data = {
        "name": "Sarah Connor",
        "email": "sarah@example.com",
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/signup", json=signup_data)
    assert response.status_code == 201
    data = response.json()
    assert data["is_verified"] is False
    assert data["onboarding_completed"] is False

    user = db_session.query(User).filter(User.email == "sarah@example.com").first()
    assert user is not None
    assert user.is_verified is False
    assert user.verification_otp is not None
    assert len(user.verification_otp) == 6
    assert user.otp_expires_at is not None


def test_verify_email_flow(client, db_session):
    # Signup
    signup_data = {
        "name": "John Connor",
        "email": "john@example.com",
        "password": "Password123!",
    }
    client.post("/api/v1/auth/signup", json=signup_data)

    user = db_session.query(User).filter(User.email == "john@example.com").first()
    valid_otp = user.verification_otp

    # 1. Invalid OTP
    bad_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": "john@example.com", "otp": "000000"},
    )
    assert bad_res.status_code == 400

    # 2. Resend OTP
    resend_res = client.post(
        "/api/v1/auth/resend-otp",
        json={"email": "john@example.com"},
    )
    assert resend_res.status_code == 200
    db_session.refresh(user)
    fresh_otp = user.verification_otp

    # 3. Valid OTP
    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": "john@example.com", "otp": fresh_otp},
    )
    assert verify_res.status_code == 200
    verified_data = verify_res.json()
    assert verified_data["is_verified"] is True
    assert verified_data["onboarding_completed"] is False

    db_session.refresh(user)
    assert user.is_verified is True
    assert user.verification_otp is None


def test_onboarding_guard_and_completion(client, db_session):
    # 1. Unverified user
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Kyle Reese", "email": "kyle@example.com", "password": "Password123!"},
    )

    onboard_payload = {
        "github_username": "kylereese",
        "linkedin_url": "https://linkedin.com/in/kylereese",
        "target_weekly_hours": 15,
        "skills": ["Python", "FastAPI"],
    }

    # Should be blocked with 403 Forbidden
    blocked = client.post("/api/v1/onboarding/complete", json=onboard_payload)
    assert blocked.status_code == 403

    # Now verify user
    user = db_session.query(User).filter(User.email == "kyle@example.com").first()
    client.post(
        "/api/v1/auth/verify-email",
        json={"email": "kyle@example.com", "otp": user.verification_otp},
    )

    # Retry onboarding
    success = client.post("/api/v1/onboarding/complete", json=onboard_payload)
    assert success.status_code == 200
    res_data = success.json()
    assert res_data["onboarding_completed"] is True
    assert res_data["github_username"] == "kylereese"
    assert res_data["linkedin_url"] == "https://linkedin.com/in/kylereese"
    assert res_data["target_weekly_hours"] == 15

    # Check skills in DB
    skills = db_session.query(Skill).filter(Skill.user_id == user.id).all()
    assert len(skills) >= 2
    assert any(s.core_skill == "Python" for s in skills)
    assert any(s.core_skill == "FastAPI" for s in skills)


def test_put_skills_and_dynamic_recalibration(client, db_session):
    # Setup verified user
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Miles Dyson", "email": "miles@example.com", "password": "Password123!"},
    )
    user = db_session.query(User).filter(User.email == "miles@example.com").first()
    client.post(
        "/api/v1/auth/verify-email",
        json={"email": "miles@example.com", "otp": user.verification_otp},
    )

    # Sync skills via PUT /api/v1/skills
    put_res = client.put(
        "/api/v1/skills/",
        json={"skills": ["React", "TypeScript"]},
    )
    assert put_res.status_code == 200
    skills = db_session.query(Skill).filter(Skill.user_id == user.id).all()
    assert len(skills) == 2
    assert {s.core_skill for s in skills} == {"React", "TypeScript"}


def test_income_kit_injects_verified_details(client, db_session):
    # Setup verified user with GitHub and LinkedIn
    client.post(
        "/api/v1/auth/signup",
        json={"name": "T800 Cyberdyne", "email": "t800@cyberdyne.ai", "password": "Password123!"},
    )
    user = db_session.query(User).filter(User.email == "t800@cyberdyne.ai").first()
    client.post(
        "/api/v1/auth/verify-email",
        json={"email": "t800@cyberdyne.ai", "otp": user.verification_otp},
    )

    client.post(
        "/api/v1/onboarding/complete",
        json={
            "github_username": "t800model",
            "linkedin_url": "https://linkedin.com/in/t800",
            "target_weekly_hours": 20,
            "skills": ["Automation"],
        },
    )

    kit_res = client.post(
        "/api/v1/income-kits/generate",
        json={
            "opportunityId": "opp-test-1",
            "opportunityTitle": "Automated ETL Pipeline",
        },
    )
    assert kit_res.status_code == 200
    kit_data = kit_res.json()
    assets = {a["type"]: a["content"] for a in kit_data["assets"]}

    # Check verified email in cold outreach
    assert "t800@cyberdyne.ai" in assets["Outreach scripts"]
    assert "t800model" in assets["Outreach scripts"]
    assert "https://linkedin.com/in/t800" in assets["Outreach scripts"]

    # Check GitHub username in portfolio README
    assert "t800model" in assets["Portfolio project"]

    # Check LinkedIn and email in Landing page
    assert "t800@cyberdyne.ai" in assets["Landing page"]
    assert "https://linkedin.com/in/t800" in assets["Landing page"]
