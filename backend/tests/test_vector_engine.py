import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.services.vector_engine import (
    vector_engine,
    get_embedding,
    cosine_similarity,
    semantic_search,
)
from app.services.ai_engine import ai_engine_service, SIEEngine
from app.schemas.sie import DecomposedSkill


client = TestClient(app)


def test_vector_dimensions_and_l2_norm():
    """Verify vector dimension consistency (384 dimensions) and unit norm."""
    emb = get_embedding("clean dirty spreadsheets and build ETL pipelines")
    assert len(emb) == 384
    assert isinstance(emb, list)
    assert all(isinstance(x, float) for x in emb)

    # Verify L2 norm is 1.0 (unit vector)
    l2_norm = math.sqrt(sum(x * x for x in emb))
    assert abs(l2_norm - 1.0) < 1e-3

    # Empty string returns 384 zeros
    empty_emb = get_embedding("")
    assert len(empty_emb) == 384
    assert all(x == 0.0 for x in empty_emb)


def test_cosine_similarity_bounds():
    """Verify cosine similarity properties: identical = 1.0, orthogonal/unrelated is low."""
    text_a = "FastAPI backend REST API development"
    vec_a = get_embedding(text_a)
    vec_b = get_embedding(text_a)

    # Identical texts yield 1.0
    sim_identical = cosine_similarity(vec_a, vec_b)
    assert abs(sim_identical - 1.0) < 1e-3

    # Dissimilar / distant texts yield low scores
    vec_unrelated = get_embedding("3D character rigging blender video animation")
    sim_dissimilar = cosine_similarity(vec_a, vec_unrelated)
    assert sim_dissimilar < 0.35

    # Zero vector handling
    zero_vec = [0.0] * 384
    assert cosine_similarity(vec_a, zero_vec) == 0.0
    assert cosine_similarity(zero_vec, zero_vec) == 0.0


def test_semantic_matching_dirty_excel_to_data_cleaning():
    """
    Test core Data Science requirement:
    'dirty excel spreadsheets' matches 'Data Cleaning ETL' with similarity > 0.60.
    """
    query = "dirty excel spreadsheets"
    candidate = "Data Cleaning ETL"

    vec_query = get_embedding(query)
    vec_candidate = get_embedding(candidate)

    similarity = cosine_similarity(vec_query, vec_candidate)
    assert similarity > 0.60, f"Expected similarity > 0.60, got {similarity}"

    # Also test another variant: 'clean dirty spreadsheets' vs 'Python ETL & Data Munging'
    query_2 = "clean dirty spreadsheets"
    candidate_2 = "Python ETL & Data Munging"
    sim_2 = cosine_similarity(get_embedding(query_2), get_embedding(candidate_2))
    assert sim_2 > 0.60, f"Expected similarity > 0.60, got {sim_2}"


def test_semantic_search_candidates():
    """Verify semantic candidate ranking over structured niche items."""
    candidates = [
        {
            "category": "Data Engineering",
            "micro_service": "Automated Data Cleaning & Web Scraping ETL Pipeline",
            "demand_index": 91,
        },
        {
            "category": "Creative & Media",
            "micro_service": "High-Retention Short-Form Video Editing & Motion Cut",
            "demand_index": 95,
        },
        {
            "category": "Business & Strategy",
            "micro_service": "Technical SEO Audit & Programmatic Content Strategy",
            "demand_index": 87,
        },
    ]

    results = semantic_search(
        query="scraping and dirty excel data cleaning",
        candidates=candidates,
        top_k=2,
        threshold=0.3,
    )

    assert len(results) >= 1
    top_match = results[0]
    assert top_match["category"] == "Data Engineering"
    assert "Data Cleaning" in top_match["micro_service"] or "ETL" in top_match["micro_service"]
    assert top_match["similarity_score"] > 0.60


def test_api_semantic_match_endpoint():
    """Verify POST /api/v1/skills/semantic-match endpoint works end-to-end."""
    payload = {
        "skills": ["automate spreadsheet reporting"],
        "top_k": 5
    }

    response = client.post("/api/v1/skills/semantic-match", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "matches" in data
    assert "model_used" in data
    assert isinstance(data["matches"], list)
    assert len(data["matches"]) >= 1

    first_match = data["matches"][0]
    assert "category" in first_match
    assert "micro_service" in first_match
    assert "similarity_score" in first_match
    assert "demand_index" in first_match
    assert first_match["similarity_score"] > 0.0
    assert first_match["demand_index"] > 0


def test_mcda_opportunities_include_semantic_fit():
    """Verify that compute_ranked_opportunities computes and attaches semanticFit."""
    engine = SIEEngine()
    decomposed = [
        DecomposedSkill(
            id="skill-101",
            skill="Data Cleaning",
            microService="Automated Data Cleaning & Web Scraping ETL Pipeline",
            category="Data Engineering",
            demand=90,
            competition=35,
            suitability=92,
            trend="+18%",
            beginnerFriendly=True,
            description="ETL pipeline and automated data cleaner.",
            semanticFit=94,
        )
    ]

    opportunities = engine.compute_ranked_opportunities(decomposed)
    assert len(opportunities) == 1
    opp = opportunities[0]
    assert opp.semanticFit is not None
    assert 60 <= opp.semanticFit <= 99
    assert opp.score > 0
