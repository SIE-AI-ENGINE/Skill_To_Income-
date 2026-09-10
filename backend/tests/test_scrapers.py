import pytest
from scrapers.db_loader import normalize_record, load_market_records
from scrapers.github_trending_scraper import scrape_github_trending
from scrapers.fiverr_scraper import scrape_fiverr
from scrapers.upwork_rss_scraper import scrape_upwork_rss


def test_normalize_record_clamping():
    """Verify normalize_record correctly clamps metrics within schema limits."""
    raw = {
        "platform": "  GitHub Trending  ",
        "category": "AI & Machine Learning",
        "opportunity_title": "A" * 300,
        "demand_score": 15.5,  # Exceeds 10.0
        "competition_score": -2.0,  # Below 1.0
        "success_probability": 1.45,  # Exceeds 1.0
        "estimated_income": 45.0,  # Below minimum threshold of 100
    }

    norm = normalize_record(raw)
    assert norm["platform"] == "GitHub Trending"
    assert len(norm["opportunity_title"]) <= 250
    assert norm["demand_score"] == 10.0
    assert norm["competition_score"] == 1.0
    assert norm["success_probability"] == 1.0
    assert norm["estimated_income"] == 100.0


def test_deduplication_in_loader():
    """Verify deduplication properly eliminates duplicates on (platform, title)."""
    records = [
        {
            "platform": "Upwork",
            "category": "Web Development",
            "opportunity_title": "Full Stack FastAPI Developer Needed",
            "estimated_income": 2500.0,
            "demand_score": 8.5,
            "competition_score": 5.0,
            "success_probability": 0.8,
        },
        {
            "platform": "upwork",  # Case-insensitive match
            "category": "Web Development",
            "opportunity_title": "full stack fastapi developer needed",
            "estimated_income": 3000.0,
            "demand_score": 9.0,
            "competition_score": 4.5,
            "success_probability": 0.85,
        },
        {
            "platform": "Fiverr",
            "category": "Design",
            "opportunity_title": "Figma UI/UX Design System",
            "estimated_income": 800.0,
            "demand_score": 7.5,
            "competition_score": 6.0,
            "success_probability": 0.9,
        },
    ]

    stats = load_market_records(records, dry_run=True)
    assert stats["total_scraped"] == 3
    assert stats["deduped"] == 1
    assert stats["inserted"] == 2


def test_github_trending_scraper_structure():
    """Verify GitHub scraper returns structured market data records."""
    records = scrape_github_trending(["python"])
    assert isinstance(records, list)
    assert len(records) > 0

    first = records[0]
    required_keys = {
        "platform",
        "category",
        "opportunity_title",
        "estimated_income",
        "demand_score",
        "competition_score",
        "success_probability",
    }
    assert required_keys.issubset(first.keys())
    assert first["platform"] == "GitHub Trending"
    assert 1.0 <= first["demand_score"] <= 10.0
    assert 1.0 <= first["competition_score"] <= 10.0


def test_fiverr_scraper_structure():
    """Verify Fiverr scraper returns structured market data records."""
    records = scrape_fiverr(["python"])
    assert isinstance(records, list)
    assert len(records) > 0

    first = records[0]
    required_keys = {
        "platform",
        "category",
        "opportunity_title",
        "estimated_income",
        "demand_score",
        "competition_score",
        "success_probability",
    }
    assert required_keys.issubset(first.keys())
    assert first["platform"] == "Fiverr"
    assert first["estimated_income"] >= 100.0


def test_upwork_rss_scraper_structure():
    """Verify Upwork RSS scraper returns structured market data records."""
    records = scrape_upwork_rss(["python"])
    assert isinstance(records, list)
    assert len(records) > 0

    first = records[0]
    required_keys = {
        "platform",
        "category",
        "opportunity_title",
        "estimated_income",
        "demand_score",
        "competition_score",
        "success_probability",
    }
    assert required_keys.issubset(first.keys())
    assert first["platform"] == "Upwork"
    assert first["estimated_income"] >= 100.0
