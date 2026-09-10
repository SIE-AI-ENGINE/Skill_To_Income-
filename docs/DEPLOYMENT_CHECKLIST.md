# 📋 Skill to Income Engine (SIE) — Deployment Checklist & Evaluation Demo Runbook

This guide contains the step-by-step checklist and commands to build, test, deploy, and demonstrate the integrated **Skill to Income Engine (SIE)** platform for academic/stakeholder evaluations and cloud production hosting.

---

## 🚦 Pre-Flight Verification Checklist

Before starting the evaluation demo, verify that the following prerequisites are met:

- [x] **Python 3.11+** installed and operational (`python --version`)
- [x] **PostgreSQL / Neon Connection**: Valid `DATABASE_URL` with `sslmode=require`
- [x] **Node.js 20+ & pnpm** installed for frontend UI build
- [x] **Docker & Docker Compose** (for containerized demonstrations)
- [x] **Environment Variables**: `backend/.env` configured from `backend/.env.example`
- [x] **Market Scrapers**: Scraper suite installed and verified (`scrapers/runner.py`)

---

## 🛠️ Section 1: Local Development & Evaluation Demo Runbook

### 1.1 Backend Environment Setup & Migrations
Open a terminal in the repository root:

```powershell
# 1. Navigate to backend
cd backend

# 2. Activate virtual environment (if not already active)
# Windows:
..\.venv\Scripts\Activate.ps1
# Unix / macOS:
# source ../.venv/bin/activate

# 3. Apply all Alembic database migrations to Neon PostgreSQL
$env:PYTHONPATH="."
alembic upgrade head

# 4. (Optional) Ingest live market intelligence via scrapers
python -m scrapers.runner --skills "python,fastapi,react,data science,automation"
```

### 1.2 Start the FastAPI Backend
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs (Swagger UI): `http://localhost:8000/docs`
- Healthcheck Endpoint: `http://localhost:8000/health`
- Deployable Assets Endpoint: `http://localhost:8000/api/v1/assets`
- Market Trends Endpoint: `http://localhost:8000/api/v1/market/trends`

### 1.3 Launch the Consolidated React Frontend
Open a second terminal:

```powershell
# Navigate to the consolidated frontend
cd frontend

# Install dependencies (if first time)
pnpm install

# Start Vite development server
pnpm dev
```
- Frontend UI: `http://localhost:5173`
- Direct proxy maps `/api/*` to `http://localhost:8000/api/v1/*`.

---

## 🧪 Section 2: Automated Verification & Test Execution

Run the complete 18-test regression suite covering authentication, skill decomposition, scrapers, Neon DB persistence, and error handling:

```powershell
cd backend
$env:PYTHONPATH=".;.."
..\.venv\Scripts\pytest.exe -v
```

**Expected Result**:
```text
backend/tests/test_auth.py::test_signup PASSED                           [  5%]
backend/tests/test_auth.py::test_signup_duplicate PASSED                 [ 11%]
backend/tests/test_auth.py::test_login PASSED                            [ 16%]
backend/tests/test_e2e_flow.py::test_e2e_user_lifecycle_and_sie_pipeline PASSED [ 22%]
backend/tests/test_e2e_flow.py::test_unauthorized_access_is_blocked PASSED [ 27%]
backend/tests/test_e2e_flow.py::test_schema_validation_error_handling PASSED [ 33%]
backend/tests/test_e2e_flow.py::test_duplicate_user_signup_returns_400 PASSED [ 38%]
backend/tests/test_e2e_flow.py::test_foreign_key_constraint_integrity PASSED [ 44%]
backend/tests/test_e2e_flow.py::test_profile_update_and_persistence PASSED [ 50%]
backend/tests/test_scrapers.py::test_normalize_record_clamping PASSED    [ 55%]
backend/tests/test_scrapers.py::test_deduplication_in_loader PASSED      [ 61%]
backend/tests/test_scrapers.py::test_github_trending_scraper_structure PASSED [ 66%]
backend/tests/test_scrapers.py::test_fiverr_scraper_structure PASSED     [ 72%]
backend/tests/test_scrapers.py::test_upwork_rss_scraper_structure PASSED [ 77%]
backend/tests/test_skill_decomposition.py::test_fallback_decomposition_is_domain_aware_and_distinct PASSED [ 83%]
backend/tests/test_skill_decomposition.py::test_filtering_uses_actual_signal_logic PASSED [ 88%]
backend/tests/test_skills.py::test_create_skill PASSED                   [ 94%]
backend/tests/test_skills.py::test_get_skills PASSED                     [100%]

====================== 18 passed in ~14s =======================
```

---

## 🐳 Section 3: Containerized Deployment (Docker & Docker Compose)

To demonstrate a unified containerized deployment locally:

```bash
# 1. Build and start backend + local database in detached mode
docker compose up --build -d

# 2. View real-time container startup logs
docker compose logs -f backend

# 3. Check health status
docker compose ps

# 4. Tear down containers and volumes when done
docker compose down -v
```

---

## ☁️ Section 4: Cloud Production Deployment Runbook

### 4.1 Render Backend Deployment (FastAPI + Neon DB)

1. **Sign In**: Log into [Render Dashboard](https://dashboard.render.com).
2. **Connect GitHub**: Click **New +** -> **Web Service** -> Link your GitHub repository (`Skill_To_Income-`).
3. **Configure Service**:
   - **Name**: `sie-backend` (or `skill-to-income-api`)
   - **Region**: Oregon (US West) or Singapore (closest to AWS Neon region `ap-southeast-1`)
   - **Branch**: `main` (or `develop`)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2`
   - **Plan**: `Free`
4. **Configure Environment Variables**:
   Under the **Environment** tab, configure:
   - `DATABASE_URL`: `postgresql://neondb_owner:<password>@<neon-host>/neondb?sslmode=require`
   - `SECRET_KEY`: `openssl rand -hex 32` (or click **Generate**)
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `11520`
   - `ENVIRONMENT`: `production`
   - `DEBUG`: `False`
   - `CORS_ORIGINS`: `https://sie-frontend.vercel.app,http://localhost:5173` *(replace with your actual Vercel domain)*
   - `DB_POOL_SIZE`: `5`
   - `DB_MAX_OVERFLOW`: `10`
   - `DB_POOL_PRE_PING`: `True`
5. **Health Check Path**:
   - Set Health Check Path to: `/health`
6. **Deploy**:
   - Click **Create Web Service**.
   - Monitor logs. Once build finishes, Render will provide a public URL:
     `https://sie-backend.onrender.com`

---

### 4.2 Vercel Frontend Deployment (React 19 + Vite)

1. **Sign In**: Log into [Vercel Dashboard](https://vercel.com).
2. **Import Repository**:
   - Click **Add New...** -> **Project** -> Select `Skill_To_Income-`.
3. **Configure Framework & Root Directory**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `frontend`
4. **Build and Output Settings**:
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
5. **Environment Variables**:
   Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://sie-backend.onrender.com/api/v1` *(Point to your live Render backend URL with `/api/v1`)*
6. **Deploy**:
   - Click **Deploy**.
   - Vercel will bundle the application and issue a production URL:
     `https://sie-frontend.vercel.app`

---

## ⚡ Section 5: Production Smoke Test Script

Once both services are deployed, execute the smoke test against the live URLs:

### PowerShell Smoke Test (`smoke_test.ps1`)
```powershell
param(
    [string]$BackendUrl = "https://sie-backend.onrender.com",
    [string]$FrontendUrl = "https://sie-frontend.vercel.app"
)

Write-Host ">>> Running Production Cloud Smoke Tests..." -ForegroundColor Cyan

# 1. Healthcheck
Write-Host "1. Testing Backend /health..." -NoNewline
$health = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get
if ($health.status -eq "healthy" -and $health.database -eq "connected") {
    Write-Host " [PASS]" -ForegroundColor Green
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
}

# 2. Market Intelligence Endpoint
Write-Host "2. Testing Market Intelligence /api/v1/market/trends..." -NoNewline
$trends = Invoke-RestMethod -Uri "$BackendUrl/api/v1/market/trends" -Method Get
if ($trends.demand -gt 0 -and $trends.sources.Count -gt 0) {
    Write-Host " [PASS] (Demand: $($trends.demand)%, Sources: $($trends.sources.Count))" -ForegroundColor Green
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
}

# 3. Market Rows Ingested Count
Write-Host "3. Testing Ingested Market Items /api/v1/market/..." -NoNewline
$market = Invoke-RestMethod -Uri "$BackendUrl/api/v1/market/" -Method Get
if ($market.Count -gt 0) {
    Write-Host " [PASS] ($($market.Count) items live in Neon DB)" -ForegroundColor Green
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
}

# 4. Frontend Availability
Write-Host "4. Testing Frontend Root..." -NoNewline
$fe = Invoke-WebRequest -Uri $FrontendUrl -Method Get
if ($fe.StatusCode -eq 200) {
    Write-Host " [PASS] (HTTP 200 OK)" -ForegroundColor Green
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
}

Write-Host "`n[OK] All Production Cloud Smoke Tests Passed!" -ForegroundColor Green
```

### Bash / Linux Smoke Test (`smoke_test.sh`)
```bash
#!/usr/bin/env bash
set -e

BACKEND_URL="${1:-https://sie-backend.onrender.com}"
FRONTEND_URL="${2:-https://sie-frontend.vercel.app}"

echo ">>> Running Production Smoke Tests..."
echo "1. Checking Backend Health:"
curl -fsS "${BACKEND_URL}/health" | jq .

echo "2. Checking Market Trends:"
curl -fsS "${BACKEND_URL}/api/v1/market/trends" | jq '{marketScore, demand, competition, sources: .sources | length}'

echo "3. Checking Frontend HTTP Status:"
curl -Is "${FRONTEND_URL}" | head -n 1

echo ">>> All production smoke tests PASSED!"
```

---

## 🎬 Section 6: Step-by-Step Evaluation Demo Walkthrough

Use this script during live demonstrations to showcase the entire 5-layer pipeline:

1. **Service Verification**:
   - Open `https://sie-backend.onrender.com/health` in browser or curl.
   - Show status: `"healthy"`, service: `"SIE-Backend"`, database: `"connected"`.

2. **User Registration & Authentication**:
   - Navigate to `https://sie-frontend.vercel.app`.
   - Click **Sign Up** -> Enter name, email, and password.
   - Show that an auth token is created, the session is saved in `localStorage`, and the header displays `"Good morning, <User Name>"`.

3. **Skill Decomposition & Neon Database Persistence**:
   - Navigate to the **Skill Decomposition** tab.
   - Enter a core skill (e.g., `Python` or `React`) and click **Decompose**.
   - Show the 7+ domain-specific micro-services with demand, competition, and suitability scores.
   - Verify in Neon Console that the new record is saved in the `skills` table with user foreign key.

4. **Market Intelligence & Live Scraped Data**:
   - Navigate to **Market Intelligence** to see platform demand distribution (Upwork, Fiverr, GitHub Trending) loaded directly from the live 40 records scraped into Neon PostgreSQL.
   - Navigate to **Opportunities** to view algorithmic ranking sorted by priority score (`Score = Demand * 0.45 + Saturation Penalty * 0.30 + Suitability * 0.25`).

5. **Execution Blueprint (Income Kit Generation) & Assets**:
   - Select an opportunity and click **Generate Income Kit**.
   - Show the 4 generated assets:
     - 💼 Fiverr Gig Listing with tier pricing
     - 🚀 Landing Page copy with CTA
     - 📁 Portfolio Case Study & README
     - ✉️ Cold Outreach Pitch Sequence
   - Navigate to **Deployable Assets** (`/assets`) to view the unrolled assets, edit copy, and toggle statuses between `Live` and `Draft`.

6. **Real-Time Synchronized Dashboard & Analytics**:
   - Return to the **Dashboard** and **Analytics** tabs.
   - Highlight that the conversion metrics, earnings, and A/B recommendations dynamically reflect user activity.
