# 🚀 Skill to Income Engine (SIE) — Team Onboarding & Git Workflow

Welcome to the team! This repository uses a **Monorepo architecture** where all components (Frontend, Backend, Scrapers, Database) live together. To work independently without breaking each other's code, follow this mandatory setup guide exactly.

---

## 🌿 The Golden Rule: Feature Branching
**NEVER commit or push directly to `main` or `develop`.** 
* `main` is for production-ready, finalized code only.
* `develop` is our shared integration branch. 
* Every team member works inside their own isolated **Feature Branch**. Because our folder structures are completely separated (`backend/`, `frontend/`, `scrapers/`), you can commit and push simultaneously without creating code conflicts.

---

## 🛠️ Step-by-Step Local Initialization

Every team member must run these exact steps in their local terminal right now:

### 1. Update your Local Repository
Switch to the shared development branch and pull the latest folder structure:
```bash
git checkout develop
git pull origin develop
```

2. Create Your Feature Branch
Depending on your assigned role, run the ONLY command block meant for you:

For Member 1 (AI + Backend Lead):

```bash
git checkout -b feature/backend-setup
For Member 2 (Frontend Lead):
```
```bash
git checkout -b feature/frontend-setup
For Member 3 (Data + Scraping + DevOps):
```
```bash
git checkout -b feature/data-setup
```
🏃‍♂️ Immediate Action Items per Role
Now that you are on your feature branch, open your workspace folder and execute your initialization tasks:

🔴 Member 1: Backend Initialization (backend/)
Navigate into the backend/ folder.

Initialize your FastAPI app skeleton (main.py).

Create a requirements.txt listing core packages (fastapi, uvicorn, sqlalchemy, pydantic).

Add a .env.example file for system environment variables (Database credentials, LLM API keys).

🟢 Member 2: Frontend Initialization (frontend/)
Open a terminal inside the frontend/ folder.

Initialize the framework using Vite:

```bash
npm create vite@latest . -- --template react
```

Install and configure Tailwind CSS.

Test that the local development server boots cleanly (npm run dev).

🟡 Member 3: Data & Ingestion Setup (database/ & scrapers/)
Inside database/, draft a schema outline or script documenting the core structural tables (users, skills, job_listings).

Inside scrapers/, set up a localized Python virtual environment.

Begin writing experimental data collection logic (using BeautifulSoup or requests) targeting remote platforms (Upwork, LinkedIn).

🔄 Daily Workflow: How to Submit Code
When you finish an assignment or part of your checklist and want to share your progress:

Save and commit your changes locally:

```bash
git add .
git commit -m "feat: initialized base environment structure"
```
Bring in any updates your team members merged while you were working:

```bash
git checkout develop
git pull origin develop
git checkout your-feature-branch-name
git merge develop
```
(Fix any local merge conflicts if they pop up, then proceed)

Push your branch to GitHub:

```bash
git push origin your-feature-branch-name
```
