from app.services.ai_engine import SIEEngine


def test_fallback_decomposition_is_domain_aware_and_distinct():
    result = SIEEngine().decompose_input_skills(["Java"])[0:8]

    assert 3 <= len(result) <= 8
    titles = [item.microService for item in result]
    assert len(set(titles)) == len(titles)
    assert any("Spring" in title or "REST" in title for title in titles)
    assert all(item.skill.lower() == "java" for item in result)
    assert all(45 <= item.demand <= 95 for item in result)
    assert all(20 <= item.competition <= 85 for item in result)
    assert all(60 <= item.suitability <= 98 for item in result)
    assert all(isinstance(item.beginnerFriendly, bool) for item in result)


def test_filtering_uses_actual_signal_logic():
    items = SIEEngine().decompose_input_skills(["Python"])

    high_demand = [item for item in items if item.demand >= 80]
    low_comp = [item for item in items if item.competition <= 40]
    trending = [item for item in items if "+" in str(item.trend) and int(item.trend.strip("+%")) > 0]
    beginner = [item for item in items if item.beginnerFriendly]

    assert len(high_demand) >= 1
    assert len(low_comp) >= 1
    assert len(trending) >= 1
    assert len(beginner) >= 1


def test_detect_domain_software_creative_business():
    engine = SIEEngine()
    assert engine.detect_domain("FastAPI microservices") == engine.DOMAIN_SOFTWARE
    assert engine.detect_domain("React and TypeScript") == engine.DOMAIN_SOFTWARE
    assert engine.detect_domain("4K YouTube Video Editing") == engine.DOMAIN_CREATIVE
    assert engine.detect_domain("UI/UX Mobile Design in Figma") == engine.DOMAIN_CREATIVE
    assert engine.detect_domain("B2B Market Research and Competitor Audit") == engine.DOMAIN_BUSINESS
    assert engine.detect_domain("SEO Auditing and Keyword Strategy") == engine.DOMAIN_BUSINESS


def test_domain_aware_decomposition_creative_and_business():
    engine = SIEEngine()
    creative_items = engine.decompose_input_skills(["Video Editing"])
    assert len(creative_items) >= 3
    assert any("4K" in item.microService or "Short" in item.microService for item in creative_items)
    assert all(item.category in ["Content Creation", "Production", "Post-Production", "Marketing", "Content Strategy", "Design", "Animation", "Creative & Media"] for item in creative_items)

    business_items = engine.decompose_input_skills(["Market Research"])
    assert len(business_items) >= 3
    assert any("Audit" in item.microService or "Research" in item.microService for item in business_items)
    assert all(item.category in ["Market Intelligence", "Lead Generation", "Search Strategy", "Personal Branding", "Social Media", "Growth Strategy", "Automation", "Business & Strategy"] for item in business_items)


def test_generate_income_kit_multi_domain_assets():
    engine = SIEEngine()
    mock_user = type("MockUser", (), {
        "full_name": "Test Engineer",
        "email": "engineer@test.com",
        "github_username": "testdev",
        "linkedin_url": "https://linkedin.com/in/testdev",
    })()

    # Software kit
    sw_kit = engine.generate_income_kit(
        service_title="FastAPI Microservice Scaffolder",
        skill_name="Python",
        user=mock_user,
    )
    sw_assets = {a.type: a.content for a in sw_kit.assets}
    assert "app.py" in sw_assets["Portfolio project"]
    assert "testdev" in sw_assets["Portfolio project"]
    assert "engineer@test.com" in sw_assets["Outreach scripts"]

    # Creative kit
    cr_kit = engine.generate_income_kit(
        service_title="4K Commercial Video Editing",
        skill_name="Video Editing",
        user=mock_user,
    )
    cr_assets = {a.type: a.content for a in cr_kit.assets}
    assert "specification.md" in cr_assets["Portfolio project"]
    assert "Production Delivery Specification" in cr_assets["Portfolio project"]
    assert "testdev" in cr_assets["Portfolio project"]

    # Business kit
    biz_kit = engine.generate_income_kit(
        service_title="Competitor Market Intelligence Audit",
        skill_name="Market Research",
        user=mock_user,
    )
    biz_assets = {a.type: a.content for a in biz_kit.assets}
    assert "framework.md" in biz_assets["Portfolio project"]
    assert "Executive Deck" in biz_assets["Portfolio project"]
    assert "testdev" in biz_assets["Portfolio project"]


def test_dynamic_pricing_from_market_data_table(db_session):
    from app.db.models.market import MarketData

    record1 = MarketData(
        platform="Upwork",
        category="Data Science",
        opportunity_title="Python Data Cleaning & Pipeline",
        estimated_income=3000.0,
        success_probability=0.85,
        demand_score=90.0,
        competition_score=35.0,
    )
    record2 = MarketData(
        platform="Fiverr",
        category="Data Science",
        opportunity_title="FastAPI Microservice Scaffolder",
        estimated_income=50.0,  # USD, converted to 50 * 85 = 4250.0 INR
        success_probability=0.90,
        demand_score=85.0,
        competition_score=30.0,
    )
    db_session.add_all([record1, record2])
    db_session.commit()

    engine = SIEEngine()
    pricing = engine.derive_tier_pricing(
        db=db_session,
        category="Data Science",
        skill_name="Python",
        title="Python Data Cleaning",
        demand=85,
        competition=35,
    )

    assert pricing["matched_records_count"] == 2
    assert pricing["base_price"] == 3625.0
    assert pricing["basic_inr"] == 1800.0
    assert pricing["standard_inr"] == 3600.0
    assert pricing["premium_inr"] == 7900.0
    assert pricing["min_monthly"] == int(round(3600.0 * 2.0, -2))
    assert pricing["max_monthly"] == int(round(3600.0 * 4.0, -2))

    kit = engine.generate_income_kit(
        service_title="Python Data Cleaning",
        skill_name="Python",
        category="Data Science",
        db=db_session,
    )
    gig_asset = next(a for a in kit.assets if a.type == "Gig listing")
    assert "₹1,800" in gig_asset.content
    assert "₹3,600" in gig_asset.content
    assert "₹7,900" in gig_asset.content


def test_fallback_pricing_uses_demand_and_competition_index():
    engine = SIEEngine()
    high_pricing = engine.derive_tier_pricing(
        db=None,
        category="NonExistentCategoryXYZ",
        skill_name="RareSkill",
        demand=95.0,
        competition=20.0,
    )
    low_pricing = engine.derive_tier_pricing(
        db=None,
        category="NonExistentCategoryXYZ",
        skill_name="SaturatedSkill",
        demand=50.0,
        competition=80.0,
    )

    assert high_pricing["base_price"] > low_pricing["base_price"]
    assert high_pricing["standard_inr"] > low_pricing["standard_inr"]
    assert high_pricing["matched_records_count"] == 0
    assert "₹" in high_pricing["expected_range_str"]



