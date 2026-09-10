import pytest
from sqlalchemy.exc import IntegrityError
from app.db.models.skill import Skill
from app.db.models.income_kit import IncomeKit
from app.db.models.market import MarketData


def test_e2e_user_lifecycle_and_sie_pipeline(client, db_session):
    """
    Validates the entire end-to-end user lifecycle:
    1. User Registration -> Auth Token issued
    2. User Login -> Auth Token issued & verified
    3. User Registers Skills -> Persisted to Database
    4. Skill Decomposition & Market Intelligence Flow
    5. Skill-to-Income Kit Generation -> Calculated & Stored in Database
    6. Dashboard Retrieval -> Real-time DB state accurately reflected
    """

    # -------------------------------------------------------------------------
    # 1. Registration & Auth Token Issuance
    # -------------------------------------------------------------------------
    signup_payload = {
        "email": "devops.engineer@sie-engine.io",
        "name": "DevOps Engineer",
        "password": "SecurePassword123!",
        "education": "B.Tech Computer Science",
        "experience": "3 years backend engineering",
        "income_goal": 5000.0,
        "available_time_hrs": 15,
        "career_mode": "Freelance & Consulting",
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201, signup_res.text
    signup_data = signup_res.json()
    assert "access_token" in signup_data
    assert signup_data["token_type"] == "bearer"
    assert signup_data["email"] == signup_payload["email"]
    user_id = signup_data["id"]
    assert user_id is not None

    # -------------------------------------------------------------------------
    # 2. Login (both JSON and form compatibility)
    # -------------------------------------------------------------------------
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "devops.engineer@sie-engine.io", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert token is not None

    auth_headers = {"Authorization": f"Bearer {token}"}

    # Verify Current Authenticated User profile
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == signup_payload["email"]

    # -------------------------------------------------------------------------
    # 3. User Registers Core Skills -> Persisted to Database
    # -------------------------------------------------------------------------
    skill_payload = {
        "core_skill": "Python",
        "detected_tags": ["FastAPI", "PostgreSQL", "Docker"],
    }
    skill_create_res = client.post("/api/v1/skills/", json=skill_payload, headers=auth_headers)
    assert skill_create_res.status_code == 200, skill_create_res.text
    created_skill = skill_create_res.json()
    assert created_skill["core_skill"] == "Python"
    assert created_skill["user_id"] == user_id
    assert len(created_skill["decomposed_nodes"]) > 0

    # Verify DB persistence directly in session
    db_skill = db_session.query(Skill).filter(Skill.user_id == user_id, Skill.core_skill == "Python").first()
    assert db_skill is not None
    assert db_skill.core_skill == "Python"

    # Multi-skill AI decomposition endpoint
    decompose_res = client.post(
        "/api/v1/skills/decomposition",
        json={"skills": ["PostgreSQL", "Docker"]},
        headers=auth_headers,
    )
    assert decompose_res.status_code == 200
    decomposed_items = decompose_res.json()
    assert len(decomposed_items) >= 2
    assert any("sql" in item["skill"].lower() or "postgre" in item["skill"].lower() for item in decomposed_items)

    # Verify all skills listed for user
    skills_list_res = client.get("/api/v1/skills/", headers=auth_headers)
    assert skills_list_res.status_code == 200
    skills_list = skills_list_res.json()
    assert len(skills_list) >= 3  # Python, PostgreSQL, Docker

    # -------------------------------------------------------------------------
    # 4. Market Intelligence & Opportunities
    # -------------------------------------------------------------------------
    # Seed a Market record to test DB market data flow
    market_entry = MarketData(
        platform="Upwork",
        category="DevOps & Cloud",
        opportunity_title="FastAPI + PostgreSQL Deployment Engineer",
        estimated_income=4500.0,
        success_probability=0.88,
        demand_score=9.2,
        competition_score=4.1,
    )
    db_session.add(market_entry)
    db_session.commit()

    market_res = client.get("/api/v1/market/")
    assert market_res.status_code == 200
    market_data = market_res.json()
    assert len(market_data) >= 1

    trends_res = client.get("/api/v1/market/trends")
    assert trends_res.status_code == 200
    assert trends_res.json()["marketScore"] > 0

    opps_res = client.get("/api/v1/opportunities", headers=auth_headers)
    assert opps_res.status_code == 200
    opps = opps_res.json()
    assert len(opps) > 0
    top_opp = opps[0]
    assert "title" in top_opp
    assert "score" in top_opp

    # -------------------------------------------------------------------------
    # 5. Income Kit Generation Trigger -> Calculated & Stored in DB
    # -------------------------------------------------------------------------
    kit_gen_payload = {
        "opportunityId": top_opp["id"],
        "opportunityTitle": top_opp["title"],
    }
    kit_res = client.post("/api/v1/income-kits/generate", json=kit_gen_payload, headers=auth_headers)
    assert kit_res.status_code == 200, kit_res.text
    generated_kit = kit_res.json()
    assert len(generated_kit["assets"]) == 4
    asset_types = [a["type"] for a in generated_kit["assets"]]
    assert "Gig listing" in asset_types
    assert "Portfolio project" in asset_types
    assert "Landing page" in asset_types
    assert "Outreach scripts" in asset_types

    # Verify DB persistence of the generated income kit
    db_kits = db_session.query(IncomeKit).filter(IncomeKit.user_id == user_id).all()
    assert len(db_kits) >= 1
    assert db_kits[0].fiverr_gig is not None
    assert db_kits[0].portfolio_site is not None

    # Fetch latest kit via GET
    latest_kit_res = client.get("/api/v1/income-kits/latest", headers=auth_headers)
    assert latest_kit_res.status_code == 200
    assert latest_kit_res.json() is not None

    # -------------------------------------------------------------------------
    # 6. Dashboard Retrieval -> Real DB State Reflected
    # -------------------------------------------------------------------------
    dash_res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert dash_res.status_code == 200, dash_res.text
    dashboard = dash_res.json()
    assert dashboard["userName"] == "DevOps Engineer"
    assert dashboard["opportunitiesFound"] >= len(opps)
    assert dashboard["assetsGenerated"] >= 4  # 1 kit * 4 assets
    assert dashboard["expectedEarnings"] > 0
    assert dashboard["profileCompletion"] >= 70
    assert len(dashboard["recentActivity"]) >= 2

    # -------------------------------------------------------------------------
    # 7. Assets Management & Adaptive Analytics Loop
    # -------------------------------------------------------------------------
    # Fetch deployable assets derived from user income kits
    assets_res = client.get("/api/v1/assets", headers=auth_headers)
    assert assets_res.status_code == 200, assets_res.text
    user_assets = assets_res.json()
    assert len(user_assets) >= 4
    first_asset = user_assets[0]
    assert "id" in first_asset
    assert "status" in first_asset
    assert "type" in first_asset

    # Toggle / update asset status via PATCH
    patch_res = client.patch(
        f"/api/v1/assets/{first_asset['id']}",
        json={"status": "Live", "name": "Published Service Blueprint"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200, patch_res.text
    updated_asset = patch_res.json()
    assert updated_asset["status"] == "Live"
    assert updated_asset["name"] == "Published Service Blueprint"

    # Fetch closed-loop adaptive analytics matching frontend schema
    analytics_res = client.get("/api/v1/analytics", headers=auth_headers)
    assert analytics_res.status_code == 200, analytics_res.text
    analytics_data = analytics_res.json()
    assert "views" in analytics_data
    assert "clicks" in analytics_data
    assert "conversions" in analytics_data
    assert "conversionRate" in analytics_data
    assert len(analytics_data["performance"]) > 0
    assert len(analytics_data["recommendations"]) > 0
    assert len(analytics_data["experiments"]) > 0


# -----------------------------------------------------------------------------
# Edge Cases & Error Handling Tests
# -----------------------------------------------------------------------------

def test_unauthorized_access_is_blocked(client):
    """Protected routes must reject requests without credentials (HTTP 401)."""
    assert client.get("/api/v1/skills/").status_code == 401
    assert client.get("/api/v1/dashboard").status_code == 401
    assert client.get("/api/v1/income-kits/").status_code == 401
    assert client.get("/api/v1/assets").status_code == 401
    assert client.get("/api/v1/analytics").status_code == 401


def test_schema_validation_error_handling(client):
    """Invalid requests should return HTTP 422 with validation errors."""
    # Missing required 'password'
    res = client.post("/api/v1/auth/signup", json={"email": "invalid@example.com"})
    assert res.status_code == 422
    assert "detail" in res.json()


def test_duplicate_user_signup_returns_400(client):
    """Attempting duplicate email signup returns HTTP 400."""
    payload = {"email": "duplicate@example.com", "password": "SecretPassword1"}
    r1 = client.post("/api/v1/auth/signup", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/auth/signup", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"].lower()


def test_foreign_key_constraint_integrity(db_session):
    """Foreign key enforcement prevents orphan skill creation for nonexistent user."""
    orphan_skill = Skill(
        user_id=999999,  # Nonexistent user
        core_skill="OrphanSkill",
    )
    db_session.add(orphan_skill)
    try:
        with pytest.raises(IntegrityError):
            db_session.flush()
    finally:
        db_session.rollback()



def test_profile_update_and_persistence(client):
    """Updating profile via PATCH preserves and updates database state."""
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={"email": "updater@example.com", "name": "Initial Name", "password": "Password123!"},
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_res = client.patch(
        "/api/v1/profile",
        json={"name": "Updated Engineer", "workType": "Remote Contracts", "incomeGoal": "$8,000 / month"},
        headers=headers,
    )
    assert update_res.status_code == 200
    updated_profile = update_res.json()
    assert updated_profile["name"] == "Updated Engineer"
    assert updated_profile["workType"] == "Remote Contracts"

    # Verify dashboard reflects the name change
    dash_res = client.get("/api/v1/dashboard", headers=headers)
    assert dash_res.json()["userName"] == "Updated Engineer"
