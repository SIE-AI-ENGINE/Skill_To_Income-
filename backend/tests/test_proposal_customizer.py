import pytest
import re
from fastapi.testclient import TestClient
from app.main import app
from app.db.models.user import User
from app.db.models.income_kit import IncomeKit
from app.db.models.deployment import Deployment
from app.api.v1.endpoints.assets import (
    _extract_pain_points,
    _synthesize_proposal,
)




@pytest.fixture
def test_user_and_kit(db_session):
    """Creates a verified test user and a populated IncomeKit in the test database."""
    user = User(
        email="elena.rostova@dataflow.io",
        full_name="Elena Rostova",
        hashed_password="hashed_pw_test",
        is_verified=True,
        github_username="erostova-dev",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    kit = IncomeKit(
        user_id=user.id,
        fiverr_gig={
            "id": "kit-gig",
            "title": "Automated CSV to PostgreSQL ETL Pipeline & Dashboard",
            "type": "Gig listing",
            "status": "Ready to edit",
            "content": "Professional data engineering gig.",
        },
        github_readme={
            "id": "kit-portfolio",
            "title": "csv-postgres-etl-pipeline",
            "type": "Portfolio project",
            "status": "Live",
            "url": "https://github.com/erostova-dev/csv-postgres-etl-pipeline",
            "content": "Production ETL pipeline repository.",
        },
        portfolio_site={
            "id": "kit-landing",
            "title": "Elena Rostova — Data Engineering Specialist",
            "type": "Landing page",
            "status": "Live",
            "live_url": "https://erostova-dev.github.io/csv-postgres-pipeline",
            "content": "<html><body>Portfolio Landing Page</body></html>",
        },
        cold_email_template={
            "id": "kit-outreach",
            "title": "Cold Email Sequence",
            "type": "Outreach scripts",
            "status": "Ready to edit",
            "content": "Outreach templates.",
        },
    )
    db_session.add(kit)
    db_session.commit()
    db_session.refresh(kit)

    return user, kit


def test_extract_pain_points_semantic():
    """Verify semantic pain point extraction from unstructured job descriptions."""
    job_desc = (
        "We are looking for an expert to automate daily CSV sales exports into PostgreSQL "
        "and build an interactive dashboard to monitor daily revenue."
    )
    points = _extract_pain_points(job_desc, default_service="Data Pipeline")
    assert len(points) >= 2
    assert any("CSV" in p or "csv" in p.lower() for p in points)
    assert any("PostgreSQL" in p or "database" in p.lower() for p in points)


def test_tailor_proposal_upwork_endpoint(client, test_user_and_kit):
    """Verify POST /api/v1/assets/tailor-proposal generates high-intent Upwork pitch."""
    user, kit = test_user_and_kit

    payload = {
        "kit_id": kit.id,
        "job_description": "Need someone to automate our daily CSV exports into PostgreSQL and set up a dashboard.",
        "client_platform": "upwork",
        "client_budget": "$350",
    }

    response = client.post("/api/v1/assets/tailor-proposal", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"
    assert data["platform"] == "upwork"
    assert len(data["detected_pain_points"]) >= 2

    # Check referenced assets
    ref = data["referenced_assets"]
    assert ref["github_repo_url"] == "https://github.com/erostova-dev/csv-postgres-etl-pipeline"
    assert ref["portfolio_url"] == "https://erostova-dev.github.io/csv-postgres-pipeline"

    proposal = data["custom_proposal"]
    assert len(proposal) > 150

    # Ensure NO raw placeholder brackets remain
    assert "[Your Name]" not in proposal
    assert "[First Name]" not in proposal
    assert "{placeholder}" not in proposal

    # Ensure user name and links are present
    assert "Elena Rostova" in proposal
    assert ref["github_repo_url"] in proposal
    assert ref["portfolio_url"] in proposal

    # Check opening sentence acknowledges the requirement (Direct Hook)
    first_sentence = proposal.split("\n")[0]
    assert "noticed you need" in first_sentence.lower() or "solve" in first_sentence.lower() or "automate" in first_sentence.lower()


def test_tailor_proposal_cold_email_platform(client, test_user_and_kit):
    """Verify platform-specific formatting for Cold Email outreach."""
    user, kit = test_user_and_kit

    payload = {
        "kit_id": kit.id,
        "job_description": "Looking for lead to automate SQL data extraction and pipeline error handling.",
        "client_platform": "email",
    }

    response = client.post("/api/v1/assets/tailor-proposal", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["platform"] == "email"
    proposal = data["custom_proposal"]

    # Cold email must have Subject line
    assert "Subject:" in proposal
    assert "Elena Rostova" in proposal
    assert "Loom" in proposal or "walkthrough" in proposal


def test_tailor_proposal_deterministic_fallback():
    """Verify deterministic fallback guarantees 4 structural pillars even without LLM."""
    pain_points = [
        "Automated CSV sales export & data transformation",
        "PostgreSQL database schema design & ingestion",
    ]
    synthesis = _synthesize_proposal(
        platform="upwork",
        job_desc="Automate CSV to PostgreSQL",
        pain_points=pain_points,
        service_title="FastAPI Data Pipeline",
        user_name="Marcus Vance",
        portfolio_url="https://marcus.dev/portfolio",
        github_repo_url="https://github.com/marcus/data-pipeline",
        client_budget="$500",
    )

    proposal = synthesis["custom_proposal"]
    hook_summary = synthesis["hook_summary"]

    # 1. Direct Hook in sentence 1
    assert proposal.startswith("Hi there — I noticed you need to solve")
    assert "Automated CSV sales export & data transformation".lower() in proposal.lower()

    # 2. Proof-of-Work Linkage
    assert "production-ready system" in proposal or "architected" in proposal

    # 3. Live links
    assert "https://github.com/marcus/data-pipeline" in proposal
    assert "https://marcus.dev/portfolio" in proposal

    # 4. Low-friction CTA
    assert "quick 5-minute chat or video walkthrough" in proposal
    assert "Marcus Vance" in proposal
    assert "$500" in proposal


def test_tailor_proposal_invalid_kit_returns_404(client, db_session):
    """Verify 404 error when kit_id does not exist."""
    payload = {
        "kit_id": 999999,
        "job_description": "Valid job description for testing 404 response.",
        "client_platform": "upwork",
    }
    response = client.post("/api/v1/assets/tailor-proposal", json=payload)
    assert response.status_code == 404
