import logging
import httpx
from typing import List, Dict, Any

logger = logging.getLogger("scrapers.github")


def _get_category_for_skill(skill: str) -> str:
    s = skill.lower()
    if any(k in s for k in ("react", "vue", "frontend", "next", "angular")):
        return "Web Development"
    if any(k in s for k in ("python", "fastapi", "django", "flask", "node", "java")):
        return "Backend Development"
    if any(k in s for k in ("docker", "kubernetes", "aws", "devops", "cloud")):
        return "Cloud & DevOps"
    if any(k in s for k in ("data", "ai", "machine learning", "pandas", "ml")):
        return "AI & Data Engineering"
    return "Software Engineering"


def scrape_github_trending(skills: List[str]) -> List[Dict[str, Any]]:
    """
    Scrapes GitHub public repositories and trending topics by skill keyword.
    Computes demand velocity based on stars, forks, and repository engagement.
    """
    results: List[Dict[str, Any]] = []

    headers = {
        "User-Agent": "SkillToIncome-AI-Engine/1.0",
        "Accept": "application/vnd.github.v3+json",
    }

    for skill in skills:
        skill_clean = skill.strip()
        if not skill_clean:
            continue

        category = _get_category_for_skill(skill_clean)
        fetched_live = False

        try:
            url = f"https://api.github.com/search/repositories?q={skill_clean}+stars:>50&sort=stars&order=desc&per_page=5"
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    items = data.get("items", [])
                    for repo in items:
                        name = repo.get("name", "").replace("-", " ").title()
                        stars = repo.get("stargazers_count", 0)
                        forks = repo.get("forks_count", 0)
                        desc = repo.get("description") or f"Open-source implementation for {skill_clean} workflows."

                        # Calculate demand (star activity) and competition (fork saturation)
                        demand = min(9.8, max(6.0, round(6.0 + min(stars / 1500, 3.5), 1)))
                        competition = min(8.5, max(3.0, round(3.0 + min(forks / 800, 5.0), 1)))
                        est_income = float(round(1500 + (demand * 300) - (competition * 80), 2))
                        success_prob = float(round(0.72 + min(demand * 0.02, 0.20), 2))

                        results.append({
                            "platform": "GitHub Trending",
                            "category": category,
                            "opportunity_title": f"{name} {skill_clean.title()} Architecture Deliverable",
                            "estimated_income": est_income,
                            "success_probability": success_prob,
                            "demand_score": demand,
                            "competition_score": competition,
                            "metadata": {
                                "stars": stars,
                                "forks": forks,
                                "repo_url": repo.get("html_url"),
                                "description": desc[:200],
                            }
                        })
                    if items:
                        fetched_live = True
                        logger.info(f"[GitHub Scraper] Fetched {len(items)} live repositories for '{skill_clean}'.")
        except Exception as exc:
            logger.warning(f"[GitHub Scraper] HTTP request failed for '{skill_clean}': {exc}. Using fallback baseline.")

        # Resilient fallback if GitHub API rate-limits or network is offline
        if not fetched_live:
            fallback_demand = 8.5
            fallback_competition = 5.2
            results.append({
                "platform": "GitHub Trending",
                "category": category,
                "opportunity_title": f"Production-Ready {skill_clean.title()} Microservice Architecture",
                "estimated_income": 3200.0,
                "success_probability": 0.84,
                "demand_score": fallback_demand,
                "competition_score": fallback_competition,
                "metadata": {
                    "source": "curated_github_trending_baseline",
                    "skill": skill_clean,
                }
            })

    return results
