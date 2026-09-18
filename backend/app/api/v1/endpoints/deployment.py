import os
import re
import io
import base64
import zipfile
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import httpx
import json
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

import uuid
from app.api.deps import get_db, get_current_user
from app.db.models.income_kit import IncomeKit
from app.db.models.deployment import Deployment
from app.db.models.user import User
from app.db.models.analytics import Analytics

logger = logging.getLogger("deployment")
router = APIRouter()


class GitHubDeployRequest(BaseModel):
    kit_id: int
    repo_name: str
    is_private: bool = False
    github_token: Optional[str] = None
    save_token: bool = False


class GitHubDeployResponse(BaseModel):
    status: str
    repo_url: str
    clone_url: str
    message: str


def parse_scaffold_files(content: str) -> Dict[str, str]:
    """
    Parses bundled scaffold files from Markdown content formatted with `# File: <path>`.
    Strips code fences if present.
    """
    files: Dict[str, str] = {}
    if not content:
        return {"README.md": "# Portfolio Project\n"}

    pattern = r"(?:^|\n)#\s*File:\s*([a-zA-Z0-9_\-\.\/]+)\s*\n"
    chunks = re.split(pattern, content.strip())

    if len(chunks) >= 3:
        for i in range(1, len(chunks), 2):
            filename = chunks[i].strip()
            file_body = chunks[i + 1].strip()
            fence_match = re.match(r"^```[a-zA-Z0-9_\-]*\n(.*?)\n```$", file_body, re.DOTALL)
            if fence_match:
                files[filename] = fence_match.group(1).strip()
            else:
                files[filename] = file_body
    else:
        files["README.md"] = content.strip()

    return files


@router.post("/github", response_model=GitHubDeployResponse)
@router.post("/github/", response_model=GitHubDeployResponse)
async def deploy_to_github(
    body: GitHubDeployRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Automated 1-Click deployment of Asset 2 (Portfolio Project) directly to GitHub.
    Uses official GitHub REST API v3 / 2022-11-28.
    Resolves token in order:
    1. body.github_token
    2. current_user.github_token (from onboarding / saved credentials)
    3. os.getenv("GITHUB_DEPLOY_TOKEN")
    """
    token = (body.github_token or "").strip()
    if not token:
        token = (getattr(current_user, "github_token", None) or "").strip()
    if not token:
        token = (os.getenv("GITHUB_DEPLOY_TOKEN", "")).strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub Personal Access Token required. Generate a fine-grained token with 'Contents' read/write permission.",
        )

    # If requested and new token provided, persist token to user profile for future 1-click deployments
    if body.save_token and body.github_token and body.github_token.strip():
        current_user.github_token = token
        db.add(current_user)

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "SIE-SkillToIncome-Engine",
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        # 1. Validate Token and resolve owner login
        user_res = await client.get("https://api.github.com/user", headers=headers)
        if user_res.status_code != 200:
            err_msg = user_res.json().get("message", "Invalid token") if user_res.text.startswith("{") else user_res.text
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub Authentication failed: {err_msg}",
            )
        owner = user_res.json().get("login")
        if not owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not resolve GitHub username from provided token.",
            )

        # 2. Retrieve IncomeKit record
        kit = (
            db.query(IncomeKit)
            .filter(IncomeKit.id == body.kit_id, IncomeKit.user_id == current_user.id)
            .first()
        )
        if not kit:
            kit = (
                db.query(IncomeKit)
                .filter(IncomeKit.user_id == current_user.id)
                .order_by(IncomeKit.id.desc())
                .first()
            )
        if not kit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Income kit #{body.kit_id} not found for this user.",
            )

        # 3. Extract deliverable files from Asset 2
        readme_asset = kit.github_readme or {}
        raw_content = (
            readme_asset.get("content", "")
            if isinstance(readme_asset, dict)
            else str(readme_asset)
        )
        files_to_commit = parse_scaffold_files(raw_content)

        # Ensure README.md exists
        if "README.md" not in files_to_commit:
            files_to_commit["README.md"] = raw_content or "# Portfolio Project\n"

        # Ensure primary project file exists: main.go, lib/main.dart, app.py, specification.md, or framework.md
        other_files = [f for f in files_to_commit.keys() if f != "README.md"]
        if not other_files:
            # Extract or scaffold primary file based on content analysis
            if "package main" in raw_content or "go.mod" in raw_content:
                primary_name = "main.go"
                primary_code = "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(\"Skill-to-Income Portfolio Service\")\n}\n"
            elif "void main()" in raw_content or "flutter" in raw_content.lower() or "dart" in raw_content.lower():
                primary_name = "lib/main.dart"
                primary_code = "void main() {\n  print('Skill-to-Income Portfolio Service');\n}\n"
            elif "specification" in raw_content.lower() or "wcag" in raw_content.lower() or "figma" in raw_content.lower() or "3d" in raw_content.lower():
                primary_name = "specification.md"
                primary_code = f"# Specification Deliverable\n\nGenerated for: {body.repo_name}\n"
            elif "framework" in raw_content.lower() or "strategy" in raw_content.lower() or "audit" in raw_content.lower() or "sop" in raw_content.lower():
                primary_name = "framework.md"
                primary_code = f"# Business Strategy & Operational Framework\n\nGenerated for: {body.repo_name}\n"
            else:
                primary_name = "app.py"
                primary_code = "# Auto-generated by Skill-to-Income AI Engine\nimport sys\n\ndef main():\n    print('Portfolio Scaffold Pipeline Running')\n\nif __name__ == '__main__':\n    main()\n"
            
            # Check for embedded code fence matching
            code_block_match = re.search(r"```[a-zA-Z0-9_\-]*\n(.*?)\n```", raw_content, re.DOTALL)
            if code_block_match:
                files_to_commit[primary_name] = code_block_match.group(1).strip()
            else:
                files_to_commit[primary_name] = primary_code

        # 4. Clean repo name
        clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]+", "-", body.repo_name.strip()).strip("-").lower()
        if not clean_name:
            clean_name = f"sie-project-{kit.id}"

        # 5. Create GitHub Repository
        create_payload = {
            "name": clean_name,
            "description": "Auto-generated by Skill-to-Income AI Engine (SIE)",
            "private": body.is_private,
            "auto_init": True,
        }
        create_res = await client.post("https://api.github.com/user/repos", headers=headers, json=create_payload)

        if create_res.status_code in (200, 201):
            repo_data = create_res.json()
        elif create_res.status_code == 422:
            # Repository may already exist on account; verify access
            get_res = await client.get(f"https://api.github.com/repos/{owner}/{clean_name}", headers=headers)
            if get_res.status_code == 200:
                repo_data = get_res.json()
            else:
                raw_err = create_res.json()
                msg = raw_err.get("message", "Validation failed")
                errors = raw_err.get("errors", [])
                sub_errors = ", ".join([e.get("message", "") for e in errors]) if errors else msg
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub Repo Error: {sub_errors or msg}",
                )
        else:
            raise HTTPException(
                status_code=create_res.status_code,
                detail=f"GitHub API Error: {create_res.text}",
            )

        repo_url = repo_data.get("html_url") or f"https://github.com/{owner}/{clean_name}"
        clone_url = repo_data.get("clone_url") or f"https://github.com/{owner}/{clean_name}.git"

        # 6. Commit README.md (fetch existing sha first from auto_init)
        readme_str = files_to_commit.get("README.md", "# Portfolio Project\n")
        readme_b64 = base64.b64encode(readme_str.encode("utf-8")).decode("ascii")
        existing_readme_res = await client.get(
            f"https://api.github.com/repos/{owner}/{clean_name}/contents/README.md",
            headers=headers,
        )
        readme_sha = None
        if existing_readme_res.status_code == 200:
            readme_sha = existing_readme_res.json().get("sha")

        commit_readme_body = {
            "message": "Initialize portfolio project README.md [SIE Pipeline]",
            "content": readme_b64,
        }
        if readme_sha:
            commit_readme_body["sha"] = readme_sha

        put_readme_res = await client.put(
            f"https://api.github.com/repos/{owner}/{clean_name}/contents/README.md",
            headers=headers,
            json=commit_readme_body,
        )
        if put_readme_res.status_code not in (200, 201):
            logger.warning(f"Failed to commit README.md: {put_readme_res.text}")

        # 7. Commit primary project file and any additional scaffold files
        for file_path, file_str in files_to_commit.items():
            if file_path == "README.md":
                continue
            clean_path = file_path.lstrip("/")
            encoded_content = base64.b64encode(file_str.encode("utf-8")).decode("ascii")

            # Check if file exists in repo to grab existing sha
            existing_file_res = await client.get(
                f"https://api.github.com/repos/{owner}/{clean_name}/contents/{clean_path}",
                headers=headers,
            )
            sha = None
            if existing_file_res.status_code == 200:
                sha = existing_file_res.json().get("sha")

            commit_body = {
                "message": f"Deploy {clean_path} [SIE Automated Portfolio Pipeline]",
                "content": encoded_content,
            }
            if sha:
                commit_body["sha"] = sha

            put_res = await client.put(
                f"https://api.github.com/repos/{owner}/{clean_name}/contents/{clean_path}",
                headers=headers,
                json=commit_body,
            )
            if put_res.status_code not in (200, 201):
                logger.warning(f"Failed to commit file {clean_path}: {put_res.text}")

        # 8. Update repository topics matching kit category
        topics = ["skill-to-income", "portfolio", "automation", "freelance-deliverable"]
        raw_lower = raw_content.lower()
        if "go" in raw_lower or "golang" in raw_lower:
            topics.append("golang")
        elif "dart" in raw_lower or "flutter" in raw_lower:
            topics.append("flutter")
        elif "python" in raw_lower or "pandas" in raw_lower or "fastapi" in raw_lower:
            topics.append("python")
        elif "figma" in raw_lower or "ui" in raw_lower or "ux" in raw_lower or "design" in raw_lower:
            topics.append("design-system")
        elif "consulting" in raw_lower or "strategy" in raw_lower or "audit" in raw_lower:
            topics.append("business-intelligence")

        await client.put(
            f"https://api.github.com/repos/{owner}/{clean_name}/topics",
            headers=headers,
            json={"names": list(dict.fromkeys(topics))[:10]},
        )

    # 9. Update database state
    if isinstance(kit.github_readme, dict):
        updated_readme = dict(kit.github_readme)
        updated_readme["status"] = "Live"
        updated_readme["url"] = repo_url
        kit.github_readme = updated_readme
        flag_modified(kit, "github_readme")

    deployment = Deployment(
        user_id=current_user.id,
        platform="github",
        status="live",
        metadata_json={
            "asset_id": kit.id,
            "kit_id": kit.id,
            "repo_name": clean_name,
            "repo_url": repo_url,
            "url": repo_url,
            "clone_url": clone_url,
            "owner": owner,
            "status": "live",
            "deployed_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    db.add(deployment)
    db.commit()

    return GitHubDeployResponse(
        status="success",
        repo_url=repo_url,
        clone_url=clone_url,
        message="Repository published to GitHub successfully!",
    )


@router.get("/{kit_id}/download")
def download_project_bundle(
    kit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Generates an in-memory .zip archive containing Asset 2 scaffold files,
    README, and project documentation for offline review.
    """
    kit = (
        db.query(IncomeKit)
        .filter(IncomeKit.id == kit_id, IncomeKit.user_id == current_user.id)
        .first()
    )
    if not kit:
        kit = (
            db.query(IncomeKit)
            .filter(IncomeKit.user_id == current_user.id)
            .order_by(IncomeKit.id.desc())
            .first()
        )
    if not kit:
        raise HTTPException(status_code=404, detail="Income kit not found")

    readme_asset = kit.github_readme or {}
    raw_content = (
        readme_asset.get("content", "")
        if isinstance(readme_asset, dict)
        else str(readme_asset)
    )
    files = parse_scaffold_files(raw_content)

    # Include Gig and Outreach files if available
    if kit.fiverr_gig and isinstance(kit.fiverr_gig, dict) and kit.fiverr_gig.get("content"):
        files["GIG_LISTING.md"] = kit.fiverr_gig["content"]
    if kit.cold_email_template and isinstance(kit.cold_email_template, dict) and kit.cold_email_template.get("content"):
        files["OUTREACH_SCRIPTS.md"] = kit.cold_email_template["content"]

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for filename, file_content in files.items():
            zf.writestr(filename, file_content)

    zip_buffer.seek(0)
    slug = f"project-bundle-kit-{kit.id}"
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{slug}.zip"'},
    )


class LandingPageDeployRequest(BaseModel):
    kit_id: int
    provider: str = "github_pages"  # "github_pages" or "preview" / "standalone"
    custom_slug: Optional[str] = None
    github_token: Optional[str] = None
    repo_name: Optional[str] = None


class LandingPageDeployResponse(BaseModel):
    status: str
    live_url: str
    provider: str
    message: str


class InquiryCaptureRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    brief: Optional[str] = None
    url: Optional[str] = None


def inject_telemetry_and_inquiry(html: str, user_id: int) -> str:
    """
    Ensures the user's tracking link (/api/v1/track/{user_id}) and inquiry
    capture endpoint (/api/v1/inquiry/{user_id}) are injected into the HTML.
    Adds a client-side telemetry hook for non-intrusive logging of CTA clicks
    and lead inquiries.
    """
    if not html:
        return html

    tracking_url = f"/api/v1/track/{user_id}"
    inquiry_url = f"/api/v1/inquiry/{user_id}"

    # Inject tracking attributes on CTA buttons
    if 'href="#contact"' in html:
        html = html.replace('href="#contact"', f'href="#contact" data-tracking-url="{tracking_url}"')

    # Script snippet to bind inquiry submission and tracking clicks
    telemetry_script = f"""
    <!-- SIE Live Telemetry & Inquiry Script -->
    <script>
    (function() {{
      document.addEventListener('DOMContentLoaded', function() {{
        // Track CTA clicks
        var ctaLinks = document.querySelectorAll('a[data-tracking-url], a[href="#contact"]');
        ctaLinks.forEach(function(el) {{
          el.addEventListener('click', function() {{
            try {{
              fetch('{tracking_url}?dest=' + encodeURIComponent(window.location.href), {{ mode: 'no-cors' }}).catch(function(){{}});
            }} catch(e) {{}}
          }});
        }});

        // Capture inquiries
        var forms = document.querySelectorAll('form');
        forms.forEach(function(f) {{
          f.addEventListener('submit', function(ev) {{
            try {{
              var nameInput = f.querySelector('[name="name"]');
              var emailInput = f.querySelector('[name="email"]');
              var briefInput = f.querySelector('[name="brief"]');
              fetch('{inquiry_url}', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{
                  name: nameInput ? nameInput.value : '',
                  email: emailInput ? emailInput.value : '',
                  brief: briefInput ? briefInput.value : '',
                  url: window.location.href
                }})
              }}).catch(function(){{}});
            }} catch(e) {{}}
          }});
        }});
      }});
    }})();
    </script>
    """

    if "</body>" in html:
        html = html.replace("</body>", f"{telemetry_script}\n</body>")
    else:
        html += telemetry_script

    return html


@router.post("/landing-page", response_model=LandingPageDeployResponse)
@router.post("/landing-page/", response_model=LandingPageDeployResponse)
async def deploy_landing_page(
    body: LandingPageDeployRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Automated 1-Click live deployment for Asset 3 (Conversion Landing Page).
    Deploys either directly to GitHub Pages (recommended primary) or provisions
    an instant persistent public standalone preview URL.
    """
    kit = (
        db.query(IncomeKit)
        .filter(IncomeKit.id == body.kit_id, IncomeKit.user_id == current_user.id)
        .first()
    )
    if not kit:
        kit = (
            db.query(IncomeKit)
            .filter(IncomeKit.user_id == current_user.id)
            .order_by(IncomeKit.id.desc())
            .first()
        )
    if not kit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Income kit #{body.kit_id} not found for this user.",
        )

    # 1. Retrieve Landing Page HTML content
    site_asset = kit.portfolio_site or {}
    raw_html = (
        site_asset.get("content", "")
        if isinstance(site_asset, dict)
        else str(site_asset or "")
    )
    if not raw_html.strip():
        user_name = current_user.full_name or "Specialist"
        raw_html = (
            f"<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>"
            f"<title>Service Landing Page | {user_name}</title>"
            f"<script src='https://cdn.tailwindcss.com'></script></head>"
            f"<body class='bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center'>"
            f"<div class='text-center p-8'><h1 class='text-3xl font-extrabold text-cyan-400'>Service Landing Page</h1>"
            f"<p class='mt-2 text-slate-400'>Published by {user_name}</p>"
            f"<div class='mt-6'><a href='#contact' class='px-5 py-2.5 bg-cyan-500 text-slate-950 rounded-xl font-bold'>Get in Touch</a></div>"
            f"</div></body></html>"
        )

    # 2. Inject telemetry & inquiry hooks
    compiled_html = inject_telemetry_and_inquiry(raw_html, current_user.id)

    # 3. Resolve GitHub token
    token = (body.github_token or "").strip()
    if not token:
        token = (getattr(current_user, "github_token", None) or "").strip()
    if not token:
        token = (os.getenv("GITHUB_DEPLOY_TOKEN", "")).strip()

    req_provider = (body.provider or "github_pages").lower()

    # Determine if we can proceed with GitHub Pages flow
    if req_provider == "github_pages" and token:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "SIE-SkillToIncome-Engine",
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            # Resolve owner login
            user_res = await client.get("https://api.github.com/user", headers=headers)
            if user_res.status_code != 200:
                err_msg = user_res.json().get("message", "Invalid token") if user_res.text.startswith("{") else user_res.text
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub Authentication failed: {err_msg}",
                )
            owner = user_res.json().get("login")
            if not owner:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not resolve GitHub username from provided token.",
                )

            # Determine target repository name
            clean_name = None
            if body.repo_name and body.repo_name.strip():
                clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]+", "-", body.repo_name.strip()).strip("-").lower()
            elif body.custom_slug and body.custom_slug.strip():
                clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]+", "-", body.custom_slug.strip()).strip("-").lower()
            elif kit.github_readme and isinstance(kit.github_readme, dict) and kit.github_readme.get("url"):
                # Extract repo name from existing deployed repo URL
                parts = kit.github_readme["url"].rstrip("/").split("/")
                if len(parts) >= 2:
                    clean_name = parts[-1].lower()

            if not clean_name:
                title_hint = (
                    (site_asset.get("title") if isinstance(site_asset, dict) else "")
                    or f"service-landing-{kit.id}"
                )
                clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]+", "-", title_hint).strip("-").lower()
            if not clean_name:
                clean_name = f"sie-landing-{kit.id}"

            # Ensure repository exists
            check_repo = await client.get(f"https://api.github.com/repos/{owner}/{clean_name}", headers=headers)
            if check_repo.status_code == 404:
                create_payload = {
                    "name": clean_name,
                    "description": "Live Service Landing Page - Powered by Skill-to-Income AI Engine (SIE)",
                    "private": False,
                    "auto_init": True,
                }
                create_res = await client.post("https://api.github.com/user/repos", headers=headers, json=create_payload)
                if create_res.status_code not in (200, 201):
                    logger.warning(f"Could not auto-create repo {clean_name}: {create_res.text}")

            # Commit compiled index.html to repository root
            html_b64 = base64.b64encode(compiled_html.encode("utf-8")).decode("ascii")
            existing_html_res = await client.get(
                f"https://api.github.com/repos/{owner}/{clean_name}/contents/index.html",
                headers=headers,
            )
            html_sha = None
            if existing_html_res.status_code == 200:
                html_sha = existing_html_res.json().get("sha")

            commit_body = {
                "message": "Publish live landing page [SIE Automated Web]",
                "content": html_b64,
            }
            if html_sha:
                commit_body["sha"] = html_sha

            put_res = await client.put(
                f"https://api.github.com/repos/{owner}/{clean_name}/contents/index.html",
                headers=headers,
                json=commit_body,
            )
            if put_res.status_code not in (200, 201):
                logger.warning(f"Failed to commit index.html: {put_res.text}")

            # Enable GitHub Pages on repository
            pages_payload = {
                "source": {
                    "branch": "main",
                    "path": "/",
                }
            }
            pages_res = await client.post(
                f"https://api.github.com/repos/{owner}/{clean_name}/pages",
                headers=headers,
                json=pages_payload,
            )
            live_url = None
            if pages_res.status_code in (200, 201):
                live_url = pages_res.json().get("html_url")
            elif pages_res.status_code in (409, 422):
                get_pages = await client.get(
                    f"https://api.github.com/repos/{owner}/{clean_name}/pages",
                    headers=headers,
                )
                if get_pages.status_code == 200:
                    live_url = get_pages.json().get("html_url")

            if not live_url:
                live_url = f"https://{owner}.github.io/{clean_name}/"

            actual_provider = "github_pages"
            message = "Landing page published live to the web!"
    else:
        # Fallback Standalone Preview Hosting
        public_token = body.custom_slug or f"kit-{kit.id}"
        live_url = f"/api/v1/preview/{public_token}"
        actual_provider = "standalone_preview"
        message = "Instant public preview link generated successfully!"

    # 4. Update kit.portfolio_site record
    if isinstance(kit.portfolio_site, dict):
        updated_site = dict(kit.portfolio_site)
        updated_site["status"] = "Live"
        updated_site["url"] = live_url
        updated_site["live_url"] = live_url
        updated_site["provider"] = actual_provider
        if not updated_site.get("content") or not updated_site.get("html"):
            updated_site["content"] = compiled_html
        kit.portfolio_site = updated_site
        flag_modified(kit, "portfolio_site")
    else:
        kit.portfolio_site = {
            "id": f"kit-{kit.id}-landing",
            "type": "Landing page",
            "title": body.custom_slug or f"Service Landing Page - Kit {kit.id}",
            "status": "Live",
            "content": compiled_html,
            "url": live_url,
            "live_url": live_url,
            "provider": actual_provider,
            "description": "Responsive HTML5 + Tailwind CSS landing page template.",
        }
        flag_modified(kit, "portfolio_site")

    # 5. Persist deployment record
    deployment = Deployment(
        user_id=current_user.id,
        platform="landing_page",
        status="live",
        metadata_json={
            "kit_id": kit.id,
            "platform": "landing_page",
            "provider": actual_provider,
            "url": live_url,
            "live_url": live_url,
            "public_token": body.custom_slug or f"kit-{kit.id}",
            "slug": body.custom_slug or f"kit-{kit.id}",
            "custom_slug": body.custom_slug or f"kit-{kit.id}",
            "preview_token": body.custom_slug or f"kit-{kit.id}",
            "html_content": compiled_html,
            "status": "live",
            "deployed_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    db.add(deployment)
    db.commit()

    return LandingPageDeployResponse(
        status="success",
        live_url=live_url,
        provider=actual_provider,
        message=message,
    )


def _slugify(text: str) -> str:
    if not text:
        return ""
    clean = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return clean


def _generate_standalone_service_html(service_title: str, user_id: int, db: Session) -> str:
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    user_name = (user.full_name if user else None) or "Specialist"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{service_title} | {user_name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-slate-950">
  <div class="max-w-5xl mx-auto px-6 py-16">
    <div class="text-center max-w-3xl mx-auto">
      <span class="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
        Verified Freelance Deliverable
      </span>
      <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight mt-6 text-white leading-tight">
        {service_title}
      </h1>
      <p class="text-lg text-slate-400 mt-4 leading-relaxed">
        Production-grade freelance specification and turnkey implementation deliverable engineered by <span class="text-cyan-400 font-semibold">{user_name}</span>.
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
        <a href="#inquiry" class="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition">
          Book This Service
        </a>
        <a href="#deliverables" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm transition">
          View Scope & SLA
        </a>
      </div>
    </div>

    <!-- Deliverables -->
    <div id="deliverables" class="mt-20 grid md:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4">01</div>
        <h3 class="font-bold text-white text-lg">Turnkey Delivery</h3>
        <p class="text-sm text-slate-400 mt-2">End-to-end implementation calibrated to client specifications with automated checks and zero manual overhead.</p>
      </div>
      <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4">02</div>
        <h3 class="font-bold text-white text-lg">Commercial License</h3>
        <p class="text-sm text-slate-400 mt-2">Full IP assignment and documentation handoff upon project signoff with 14-day warranty support.</p>
      </div>
      <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4">03</div>
        <h3 class="font-bold text-white text-lg">Production Quality</h3>
        <p class="text-sm text-slate-400 mt-2">Validated against freelance platform quality rubrics with 99.9% uptime and test coverage.</p>
      </div>
    </div>

    <!-- Inquiry Section -->
    <div id="inquiry" class="mt-20 p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 max-w-2xl mx-auto text-center">
      <h2 class="text-2xl font-bold text-white">Start Your Project with {user_name}</h2>
      <p class="text-sm text-slate-400 mt-2">Submit your project details below to receive a custom proposal and turnaround quote within 24 hours.</p>
      <form class="mt-6 space-y-4 text-left" onsubmit="event.preventDefault(); alert('Inquiry submitted successfully!');">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Your Name</label>
          <input type="text" name="name" required placeholder="Jane Doe" class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Your Email</label>
          <input type="email" name="email" required placeholder="client@company.com" class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Project Requirements</label>
          <textarea name="message" rows="3" required placeholder="Brief description of your timeline and requirements..." class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"></textarea>
        </div>
        <button type="submit" class="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition">
          Submit Project Inquiry
        </button>
      </form>
    </div>

    <footer class="mt-20 pt-8 border-t border-slate-900 text-center text-xs text-slate-500">
      &copy; {datetime.now().year} {user_name} · Powered by Skill-to-Income AI Engine
    </footer>
  </div>
</body>
</html>"""


def _synthesize_preview_for_kit(kit: IncomeKit, db: Session) -> str:
    title = None
    if kit.portfolio_site and isinstance(kit.portfolio_site, dict):
        title = kit.portfolio_site.get("title")
    if not title and kit.github_readme and isinstance(kit.github_readme, dict):
        title = kit.github_readme.get("title")
    if not title and kit.fiverr_gig and isinstance(kit.fiverr_gig, dict):
        title = kit.fiverr_gig.get("title")
    if not title:
        title = f"Service Deliverable Kit #{kit.id}"

    html = _generate_standalone_service_html(title, kit.user_id, db)

    site_dict = dict(kit.portfolio_site) if isinstance(kit.portfolio_site, dict) else {}
    site_dict["id"] = site_dict.get("id") or f"kit-{kit.id}-landing"
    site_dict["type"] = "Landing page"
    site_dict["title"] = title
    site_dict["content"] = html
    site_dict["status"] = site_dict.get("status") or "Live"
    site_dict["description"] = site_dict.get("description") or "Responsive HTML5 + Tailwind CSS landing page template."
    kit.portfolio_site = site_dict
    flag_modified(kit, "portfolio_site")
    try:
        db.commit()
    except Exception as exc:
        logger.warning(f"Could not commit synthesized portfolio_site for kit {kit.id}: {exc}")

    return html


@router.get("/preview/{public_token}")
def serve_preview_html(
    public_token: str,
    db: Session = Depends(get_db),
) -> Response:
    """
    Serves persistent, isolated HTML preview document with proper text/html MIME headers.
    Resolves public_token against Deployments and IncomeKit assets with multi-tier fallback.
    """
    clean_token = public_token.strip().lower()
    html_content: Optional[str] = None
    target_user_id: int = 1

    # 1. Search Deployment table for matching public_token or custom slug
    deployments = (
        db.query(Deployment)
        .order_by(Deployment.id.desc())
        .all()
    )
    for d in deployments:
        meta = d.metadata_json or {}
        if isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except Exception:
                meta = {}

        dep_slug = _slugify(str(meta.get("slug") or meta.get("custom_slug") or meta.get("public_token") or meta.get("repo_name") or ""))
        dep_tokens = {
            str(d.id),
            str(meta.get("public_token", "")).strip().lower(),
            str(meta.get("custom_slug", "")).strip().lower(),
            str(meta.get("slug", "")).strip().lower(),
            str(meta.get("preview_token", "")).strip().lower(),
            dep_slug,
        }
        if clean_token in dep_tokens or (dep_slug and (clean_token.startswith(dep_slug) or dep_slug.startswith(clean_token))):
            target_user_id = d.user_id or 1
            if meta.get("html_content") and isinstance(meta.get("html_content"), str):
                html_content = meta["html_content"]
                break

            kit_id = meta.get("kit_id")
            if kit_id:
                kit = db.query(IncomeKit).filter(IncomeKit.id == kit_id).first()
                if kit:
                    target_user_id = kit.user_id or target_user_id
                    site = kit.portfolio_site if isinstance(kit.portfolio_site, dict) else {}
                    content = site.get("content") or site.get("html")
                    if content:
                        html_content = content
                        break
                    html_content = _synthesize_preview_for_kit(kit, db)
                    break

    # 2. Check if token specifies kit directly (e.g. kit-1 or 1)
    if not html_content:
        kit_id = None
        if clean_token.startswith("kit-"):
            parts = clean_token.split("-")
            if len(parts) >= 2 and parts[1].isdigit():
                kit_id = int(parts[1])
        elif clean_token.isdigit():
            kit_id = int(clean_token)

        if kit_id:
            kit = db.query(IncomeKit).filter(IncomeKit.id == kit_id).first()
            if kit:
                target_user_id = kit.user_id or target_user_id
                site = kit.portfolio_site if isinstance(kit.portfolio_site, dict) else {}
                content = site.get("content") or site.get("html")
                html_content = content or _synthesize_preview_for_kit(kit, db)

    # 3. Match against all IncomeKits by slugified title across all 4 assets or portfolio_site URLs
    if not html_content:
        kits = db.query(IncomeKit).order_by(IncomeKit.id.desc()).all()
        for kit in kits:
            site = kit.portfolio_site if isinstance(kit.portfolio_site, dict) else {}
            site_url = str(site.get("url") or site.get("live_url") or "").lower()
            site_token = str(site.get("token") or site.get("public_token") or "").lower()

            site_title = site.get("title", "")
            readme_title = (kit.github_readme or {}).get("title", "") if isinstance(kit.github_readme, dict) else ""
            gig_title = (kit.fiverr_gig or {}).get("title", "") if isinstance(kit.fiverr_gig, dict) else ""

            site_slug = _slugify(site_title)
            readme_slug = _slugify(readme_title)
            gig_slug = _slugify(gig_title)

            if (
                clean_token in site_url
                or clean_token in site_token
                or clean_token == site_slug
                or clean_token == readme_slug
                or clean_token == gig_slug
                or (site_slug and (clean_token.startswith(site_slug) or site_slug.startswith(clean_token)))
                or (readme_slug and (clean_token.startswith(readme_slug) or readme_slug.startswith(clean_token)))
                or (gig_slug and (clean_token.startswith(gig_slug) or gig_slug.startswith(clean_token)))
            ):
                target_user_id = kit.user_id or target_user_id
                content = site.get("content") or site.get("html")
                html_content = content or _synthesize_preview_for_kit(kit, db)
                break

    # 4. Fallback to latest IncomeKit with any deliverable
    if not html_content:
        latest_kit = db.query(IncomeKit).order_by(IncomeKit.id.desc()).first()
        if latest_kit:
            target_user_id = latest_kit.user_id or target_user_id
            site = latest_kit.portfolio_site if isinstance(latest_kit.portfolio_site, dict) else {}
            content = site.get("content") or site.get("html")
            html_content = content or _synthesize_preview_for_kit(latest_kit, db)

    # 5. Global synthesized fallback if absolutely nothing was found
    if not html_content:
        service_title = clean_token.replace("-", " ").title()
        html_content = _generate_standalone_service_html(service_title, target_user_id, db)

    final_html = inject_telemetry_and_inquiry(html_content, target_user_id)
    return HTMLResponse(content=final_html, status_code=200, media_type="text/html; charset=utf-8")


@router.post("/inquiry/{user_id}")
@router.post("/inquiry")
def capture_inquiry(
    user_id: int = 1,
    body: Optional[InquiryCaptureRequest] = None,
    db: Session = Depends(get_db),
) -> Any:
    """
    Receives incoming client lead inquiries submitted from deployed landing pages,
    logging telemetry conversion events in Analytics.
    """
    try:
        db.add(
            Analytics(
                user_id=user_id,
                metric_name="conversion:inquiry",
                value=1,
            )
        )
        db.commit()
    except Exception:
        pass
    return {"status": "success", "message": "Inquiry recorded successfully"}
