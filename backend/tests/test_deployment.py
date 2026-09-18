import io
import zipfile
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.db.models.user import User
from app.db.models.income_kit import IncomeKit
from app.db.models.deployment import Deployment
from app.db.models.analytics import Analytics


@pytest.fixture
def auth_client_and_user(client, db_session):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Dev Specialist", "email": "dev@sie-engine.ai", "password": "Password123!"},
    )
    user = db_session.query(User).filter(User.email == "dev@sie-engine.ai").first()
    client.post(
        "/api/v1/auth/verify-email",
        json={"email": "dev@sie-engine.ai", "otp": user.verification_otp},
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "dev@sie-engine.ai", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers, user


@pytest.fixture
def user_with_kit(auth_client_and_user, db_session):
    client, headers, user = auth_client_and_user
    kit = IncomeKit(
        user_id=user.id,
        fiverr_gig={"id": "gig-1", "title": "Python Automation", "content": "Gig Description"},
        portfolio_site={"id": "landing-1", "title": "Portfolio Site", "content": "<html>Site</html>"},
        github_readme={
            "id": "portfolio-1",
            "title": "Pandas Data Automation Pipeline",
            "status": "Ready to edit",
            "content": (
                "# File: README.md\n"
                "```markdown\n"
                "# Pandas Automation\n"
                "End-to-end data pipeline.\n"
                "```\n\n"
                "# File: app.py\n"
                "```python\n"
                "import pandas as pd\n"
                "print('Pipeline running')\n"
                "```\n"
            ),
        },
        cold_email_template={"id": "outreach-1", "title": "Outreach", "content": "Cold email"},
    )
    db_session.add(kit)
    db_session.commit()
    db_session.refresh(kit)
    return client, headers, user, kit


def test_deploy_github_requires_token(user_with_kit):
    client, headers, user, kit = user_with_kit

    res = client.post(
        "/api/v1/deploy/github",
        json={
            "kit_id": kit.id,
            "repo_name": "pandas-data-automation-pipeline",
            "is_private": False,
            "github_token": "",
        },
        headers=headers,
    )
    assert res.status_code == 400
    assert "GitHub Personal Access Token required" in res.json()["detail"]


def test_deploy_github_success_flow(user_with_kit, db_session):
    client, headers, user, kit = user_with_kit

    fake_user_resp = MagicMock()
    fake_user_resp.status_code = 200
    fake_user_resp.json.return_value = {"login": "testdev"}

    fake_create_resp = MagicMock()
    fake_create_resp.status_code = 201
    fake_create_resp.json.return_value = {
        "name": "pandas-data-automation-pipeline",
        "html_url": "https://github.com/testdev/pandas-data-automation-pipeline",
        "clone_url": "https://github.com/testdev/pandas-data-automation-pipeline.git",
    }

    fake_get_file_resp = MagicMock()
    fake_get_file_resp.status_code = 200
    fake_get_file_resp.json.return_value = {"sha": "default-sha-123"}

    fake_put_resp = MagicMock()
    fake_put_resp.status_code = 201
    fake_put_resp.json.return_value = {"content": {"sha": "new-sha-456"}}

    fake_topics_resp = MagicMock()
    fake_topics_resp.status_code = 200
    fake_topics_resp.json.return_value = {"names": ["skill-to-income", "portfolio"]}

    mock_client_instance = AsyncMock()
    mock_client_instance.get.side_effect = [fake_user_resp, fake_get_file_resp, fake_get_file_resp]
    mock_client_instance.post.return_value = fake_create_resp
    mock_client_instance.put.side_effect = [fake_put_resp, fake_put_resp, fake_topics_resp]

    with patch("httpx.AsyncClient") as mock_httpx:
        mock_httpx.return_value.__aenter__.return_value = mock_client_instance

        res = client.post(
            "/api/v1/deploy/github",
            json={
                "kit_id": kit.id,
                "repo_name": "pandas-data-automation-pipeline",
                "is_private": False,
                "github_token": "ghp_mocktoken1234567890",
            },
            headers=headers,
        )

        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "https://github.com/testdev/pandas-data-automation-pipeline" in data["repo_url"]
        assert data["clone_url"].endswith(".git")

        # Verify DB records
        updated_kit = db_session.query(IncomeKit).filter(IncomeKit.id == kit.id).first()
        assert updated_kit.github_readme["status"] == "Live"
        assert updated_kit.github_readme["url"] == data["repo_url"]

        deployment = db_session.query(Deployment).filter(Deployment.user_id == user.id).first()
        assert deployment is not None
        assert deployment.platform == "github"
        assert deployment.status == "live"
        assert deployment.metadata_json["repo_name"] == "pandas-data-automation-pipeline"


def test_download_project_bundle_from_assets_route(user_with_kit):
    client, headers, user, kit = user_with_kit

    res = client.get(f"/api/v1/assets/{kit.id}/download", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    assert f'attachment; filename="project-bundle-kit-{kit.id}.zip"' in res.headers["content-disposition"]

    # Verify zip content integrity
    zip_bytes = io.BytesIO(res.content)
    with zipfile.ZipFile(zip_bytes, "r") as zf:
        file_list = zf.namelist()
        assert "README.md" in file_list
        assert "app.py" in file_list
        readme_content = zf.read("README.md").decode("utf-8")
        assert "Pandas Automation" in readme_content


def test_download_project_bundle_from_deploy_route(user_with_kit):
    client, headers, user, kit = user_with_kit

    res = client.get(f"/api/v1/deploy/{kit.id}/download", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"


def test_deploy_github_uses_stored_user_token_fallback(user_with_kit, db_session):
    client, headers, user, kit = user_with_kit

    # Save token to user profile
    user.github_token = "ghp_stored_profile_token_999"
    db_session.add(user)
    db_session.commit()

    fake_user_resp = MagicMock()
    fake_user_resp.status_code = 200
    fake_user_resp.json.return_value = {"login": "profiledev"}

    fake_create_resp = MagicMock()
    fake_create_resp.status_code = 201
    fake_create_resp.json.return_value = {
        "name": "pandas-data-automation-pipeline",
        "html_url": "https://github.com/profiledev/pandas-data-automation-pipeline",
        "clone_url": "https://github.com/profiledev/pandas-data-automation-pipeline.git",
    }

    fake_get_file_resp = MagicMock()
    fake_get_file_resp.status_code = 200
    fake_get_file_resp.json.return_value = {"sha": "default-sha-123"}

    fake_put_resp = MagicMock()
    fake_put_resp.status_code = 201
    fake_put_resp.json.return_value = {"content": {"sha": "new-sha-456"}}

    fake_topics_resp = MagicMock()
    fake_topics_resp.status_code = 200
    fake_topics_resp.json.return_value = {"names": ["skill-to-income", "portfolio"]}

    mock_client_instance = AsyncMock()
    mock_client_instance.get.side_effect = [fake_user_resp, fake_get_file_resp, fake_get_file_resp]
    mock_client_instance.post.return_value = fake_create_resp
    mock_client_instance.put.side_effect = [fake_put_resp, fake_put_resp, fake_topics_resp]

    with patch("httpx.AsyncClient") as mock_httpx:
        mock_httpx.return_value.__aenter__.return_value = mock_client_instance

        # Deploy without providing github_token in request body
        res = client.post(
            "/api/v1/deploy/github",
            json={
                "kit_id": kit.id,
                "repo_name": "pandas-data-automation-pipeline",
                "is_private": False,
            },
            headers=headers,
        )

        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "profiledev" in data["repo_url"]


def test_deploy_github_save_token_flag_persists_to_user(user_with_kit, db_session):
    client, headers, user, kit = user_with_kit

    assert user.github_token is None

    fake_user_resp = MagicMock()
    fake_user_resp.status_code = 200
    fake_user_resp.json.return_value = {"login": "savedev"}

    fake_create_resp = MagicMock()
    fake_create_resp.status_code = 201
    fake_create_resp.json.return_value = {
        "name": "pandas-data-automation-pipeline",
        "html_url": "https://github.com/savedev/pandas-data-automation-pipeline",
        "clone_url": "https://github.com/savedev/pandas-data-automation-pipeline.git",
    }

    fake_get_file_resp = MagicMock()
    fake_get_file_resp.status_code = 200
    fake_get_file_resp.json.return_value = {"sha": "default-sha-123"}

    fake_put_resp = MagicMock()
    fake_put_resp.status_code = 201
    fake_put_resp.json.return_value = {"content": {"sha": "new-sha-456"}}

    fake_topics_resp = MagicMock()
    fake_topics_resp.status_code = 200
    fake_topics_resp.json.return_value = {"names": ["skill-to-income", "portfolio"]}

    mock_client_instance = AsyncMock()
    mock_client_instance.get.side_effect = [fake_user_resp, fake_get_file_resp, fake_get_file_resp]
    mock_client_instance.post.return_value = fake_create_resp
    mock_client_instance.put.side_effect = [fake_put_resp, fake_put_resp, fake_topics_resp]

    with patch("httpx.AsyncClient") as mock_httpx:
        mock_httpx.return_value.__aenter__.return_value = mock_client_instance

        res = client.post(
            "/api/v1/deploy/github",
            json={
                "kit_id": kit.id,
                "repo_name": "pandas-data-automation-pipeline",
                "is_private": False,
                "github_token": "ghp_persisted_token_888",
                "save_token": True,
            },
            headers=headers,
        )

        assert res.status_code == 200
        db_session.refresh(user)
        assert user.github_token == "ghp_persisted_token_888"


def test_deploy_landing_page_standalone_preview_fallback(user_with_kit, db_session):
    client, headers, user, kit = user_with_kit

    res = client.post(
        "/api/v1/deploy/landing-page",
        json={
            "kit_id": kit.id,
            "provider": "preview",
            "custom_slug": f"my-custom-service-{kit.id}",
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["provider"] == "standalone_preview"
    assert f"/api/v1/preview/my-custom-service-{kit.id}" in data["live_url"]

    # Verify preview endpoint serves HTML with MIME type and injected hooks
    preview_res = client.get(data["live_url"])
    assert preview_res.status_code == 200
    assert "text/html" in preview_res.headers["content-type"]
    assert "SIE Live Telemetry & Inquiry Script" in preview_res.text
    assert f"/api/v1/track/{user.id}" in preview_res.text

    # Verify kit and deployment table updated
    db_session.refresh(kit)
    assert kit.portfolio_site["status"] == "Live"
    assert kit.portfolio_site["url"] == data["live_url"]

    deployment = db_session.query(Deployment).filter(
        Deployment.user_id == user.id,
        Deployment.platform == "landing_page",
    ).first()
    assert deployment is not None
    assert deployment.status == "live"
    assert deployment.metadata_json["provider"] == "standalone_preview"


def test_deploy_landing_page_github_pages_flow(user_with_kit, db_session):
    client, headers, user, kit = user_with_kit

    fake_user_resp = MagicMock()
    fake_user_resp.status_code = 200
    fake_user_resp.json.return_value = {"login": "pagesdev"}

    fake_repo_check_resp = MagicMock()
    fake_repo_check_resp.status_code = 200
    fake_repo_check_resp.json.return_value = {"name": "test-landing-repo"}

    fake_get_file_resp = MagicMock()
    fake_get_file_resp.status_code = 200
    fake_get_file_resp.json.return_value = {"sha": "html-sha-123"}

    fake_put_resp = MagicMock()
    fake_put_resp.status_code = 201
    fake_put_resp.json.return_value = {"content": {"sha": "html-sha-456"}}

    fake_pages_resp = MagicMock()
    fake_pages_resp.status_code = 201
    fake_pages_resp.json.return_value = {"html_url": "https://pagesdev.github.io/test-landing-repo/"}

    mock_client_instance = AsyncMock()
    mock_client_instance.get.side_effect = [fake_user_resp, fake_repo_check_resp, fake_get_file_resp]
    mock_client_instance.put.return_value = fake_put_resp
    mock_client_instance.post.return_value = fake_pages_resp

    with patch("httpx.AsyncClient") as mock_httpx:
        mock_httpx.return_value.__aenter__.return_value = mock_client_instance

        res = client.post(
            "/api/v1/deploy/landing-page",
            json={
                "kit_id": kit.id,
                "provider": "github_pages",
                "repo_name": "test-landing-repo",
                "github_token": "ghp_pages_token_999",
            },
            headers=headers,
        )

        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["provider"] == "github_pages"
        assert "https://pagesdev.github.io/test-landing-repo/" in data["live_url"]

        # Verify DB updates
        db_session.refresh(kit)
        assert kit.portfolio_site["status"] == "Live"
        assert kit.portfolio_site["url"] == data["live_url"]


def test_inquiry_capture_endpoint(user_with_kit, db_session):
    client, headers, user, kit = user_with_kit

    res = client.post(
        f"/api/v1/inquiry/{user.id}",
        json={
            "name": "Sarah Connor",
            "email": "sarah@resistance.ai",
            "brief": "Need complete workflow automation for defense ops.",
        },
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Verify Analytics DB record
    event = db_session.query(Analytics).filter(
        Analytics.user_id == user.id,
        Analytics.metric_name == "conversion:inquiry",
    ).first()
    assert event is not None
    assert event.value >= 1


def test_telemetry_tracking_user_id_directly(user_with_kit, db_session):
    client, headers, user, kit = user_with_kit

    # Trigger click telemetry with user_id directly
    res = client.get(
        f"/api/v1/track/{user.id}?dest=https://example.com/target",
        follow_redirects=False,
    )
    assert res.status_code == 302
    assert res.headers["location"] == "https://example.com/target"

    # Verify clicks incremented in Analytics table
    agg = db_session.query(Analytics).filter(
        Analytics.user_id == user.id,
        Analytics.metric_name == "clicks",
    ).first()
    assert agg is not None
    assert agg.value >= 1


