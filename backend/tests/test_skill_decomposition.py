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
