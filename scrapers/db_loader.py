import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is loaded for Neon DB connectivity
_env_backend = Path(__file__).resolve().parents[1] / "backend" / ".env"
_env_root = Path(__file__).resolve().parents[1] / ".env"
if _env_backend.exists():
    load_dotenv(dotenv_path=_env_backend)
elif _env_root.exists():
    load_dotenv(dotenv_path=_env_root)

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.db.models.market import MarketData
from app.db.session import SessionLocal

logger = logging.getLogger("scrapers.db_loader")


def normalize_record(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normalizes and clamps market record metrics to valid database schemas."""
    demand = min(10.0, max(1.0, float(raw.get("demand_score", 8.0))))
    competition = min(10.0, max(1.0, float(raw.get("competition_score", 5.0))))
    success_prob = min(1.0, max(0.0, float(raw.get("success_probability", 0.85))))
    income = max(100.0, float(raw.get("estimated_income", 2000.0)))
    platform = str(raw.get("platform", "Upwork")).strip()
    category = str(raw.get("category", "Software Engineering")).strip()
    title = str(raw.get("opportunity_title", "Custom Deliverable")).strip()

    return {
        "platform": platform,
        "category": category,
        "opportunity_title": title[:250],
        "estimated_income": round(income, 2),
        "success_probability": round(success_prob, 2),
        "demand_score": round(demand, 1),
        "competition_score": round(competition, 1),
    }


def load_market_records(
    records: List[Dict[str, Any]],
    dry_run: bool = False,
    db: Optional[Session] = None,
) -> Dict[str, int]:
    """
    Cleans, deduplicates, and persists scraped market records into the Neon PostgreSQL
    market_data table.
    """
    stats = {"total_scraped": len(records), "inserted": 0, "updated": 0, "deduped": 0}
    seen_keys = set()
    clean_records: List[Dict[str, Any]] = []

    # In-memory batch deduplication
    for r in records:
        norm = normalize_record(r)
        key = (norm["platform"].lower(), norm["opportunity_title"].lower())
        if key in seen_keys:
            stats["deduped"] += 1
            continue
        seen_keys.add(key)
        clean_records.append(norm)

    if dry_run:
        logger.info(f"[DB Loader - Dry Run] {len(clean_records)} records prepared. Skipping DB write.")
        stats["inserted"] = len(clean_records)
        return stats

    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    try:
        for item in clean_records:
            existing = (
                db.query(MarketData)
                .filter(
                    MarketData.platform == item["platform"],
                    MarketData.opportunity_title == item["opportunity_title"],
                )
                .first()
            )

            if existing:
                existing.category = item["category"]
                existing.estimated_income = item["estimated_income"]
                existing.demand_score = item["demand_score"]
                existing.competition_score = item["competition_score"]
                existing.success_probability = item["success_probability"]
                existing.scraped_at = func.now()
                stats["updated"] += 1
            else:
                record = MarketData(**item)
                db.add(record)
                stats["inserted"] += 1

        db.commit()
        logger.info(
            f"[DB Loader] Ingestion finished: {stats['inserted']} inserted, "
            f"{stats['updated']} updated, {stats['deduped']} deduped."
        )
    except Exception as exc:
        db.rollback()
        logger.error(f"[DB Loader] Database persistence failed: {exc}", exc_info=True)
        raise exc
    finally:
        if should_close_db:
            db.close()

    return stats
