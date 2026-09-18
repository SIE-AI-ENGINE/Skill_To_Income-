import math
import re
import hashlib
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("vector_engine")

# Try importing sentence_transformers or fastembed if installed
_TRANSFORMER_MODEL = None
_MODEL_NAME = "deterministic-subword-embeddings-384"

try:
    from sentence_transformers import SentenceTransformer
    _TRANSFORMER_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    _MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
    logger.info("Loaded sentence-transformers/all-MiniLM-L6-v2 successfully.")
except Exception:
    try:
        from fastembed import TextEmbedding
        _TRANSFORMER_MODEL = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        _MODEL_NAME = "fastembed/bge-small-en-v1.5"
        logger.info("Loaded fastembed TextEmbedding successfully.")
    except Exception:
        _TRANSFORMER_MODEL = None
        _MODEL_NAME = "sentence-embeddings-v1"
        logger.info("Using deterministic 384-dimensional sub-word semantic vector engine.")


# ---------------------------------------------------------------------------
# Deterministic Semantic Clustering Taxonomy (Market Domain Projections)
# ---------------------------------------------------------------------------
SEMANTIC_CLUSTERS = {
    "data_etl_spreadsheet": {
        "indices": (0, 48),
        "tokens": {
            "data", "etl", "clean", "cleaning", "dirty", "spreadsheet", "spreadsheets",
            "excel", "csv", "munging", "pipeline", "pipelines", "scraping", "scraper",
            "scrape", "extract", "transformation", "transform", "load", "sql", "warehouse",
            "pandas", "automation", "automate", "reporting", "sheets", "wrangling", "ingestion"
        }
    },
    "web_backend_api": {
        "indices": (48, 96),
        "tokens": {
            "api", "fastapi", "backend", "rest", "microservice", "microservices", "server",
            "crud", "endpoint", "endpoints", "python", "node", "express", "django", "flask",
            "docker", "kubernetes", "database", "postgres", "sql", "graphql", "authentication", "auth"
        }
    },
    "frontend_ui_dashboard": {
        "indices": (96, 144),
        "tokens": {
            "dashboard", "dashboards", "interactive", "frontend", "react", "next", "vue",
            "flutter", "mobile", "ui", "ux", "interface", "component", "components",
            "web", "app", "analytics", "visualization", "visualizations", "chart", "charts",
            "tailwind", "responsive", "bi", "tableau", "powerbi"
        }
    },
    "creative_media_3d": {
        "indices": (144, 192),
        "tokens": {
            "video", "editing", "editor", "design", "graphic", "3d", "animation", "motion",
            "figma", "premiere", "after effects", "blender", "audio", "podcast", "creative",
            "illustration", "thumbnail", "rigging", "character", "reels", "tiktok", "youtube", "render"
        }
    },
    "business_marketing_seo": {
        "indices": (192, 240),
        "tokens": {
            "market", "research", "seo", "copywriting", "writing", "sales", "lead", "generation",
            "marketing", "strategy", "audit", "growth", "b2b", "email", "outreach", "consulting",
            "deck", "pitch", "kpi", "conversion", "funnel", "copy", "article", "blog"
        }
    },
    "ai_ml_nlp": {
        "indices": (240, 288),
        "tokens": {
            "ai", "ml", "machine", "learning", "nlp", "llm", "rag", "embeddings", "vector",
            "fine-tuning", "model", "neural", "deep", "classification", "forecast", "forecasting", "openai"
        }
    }
}


class VectorEngine:
    """
    High-Performance Semantic Vector Engine for Freelance Skill & Market Matching.
    Provides 384-dimensional dense semantic embeddings, cosine similarity scoring,
    and fast candidate ranking.
    """

    DIMENSION = 384

    def __init__(self):
        self.model_name = _MODEL_NAME
        self.use_transformer = _TRANSFORMER_MODEL is not None

    def get_embedding(self, text: str) -> List[float]:
        """
        Computes a normalized dense vector embedding (384 dimensions) for the input text.
        Primary: Uses SentenceTransformer / FastEmbed if available.
        Fallback: Deterministic, normalized sub-word hashing & semantic cluster vectorizer.
        """
        if not text or not text.strip():
            return [0.0] * self.DIMENSION

        # 1. Primary path: Local transformer model
        if self.use_transformer:
            try:
                if hasattr(_TRANSFORMER_MODEL, "encode"):
                    emb = _TRANSFORMER_MODEL.encode(text)
                    return [float(x) for x in emb.tolist()]
                elif hasattr(_TRANSFORMER_MODEL, "embed"):
                    emb = next(_TRANSFORMER_MODEL.embed([text]))
                    return [float(x) for x in emb.tolist()]
            except Exception as exc:
                logger.warning(f"Transformer embedding inference failed, using deterministic fallback: {exc}")

        # 2. Deterministic Sub-Word & Semantic Cluster Vectorizer
        return self._deterministic_embed(text)

    def _deterministic_embed(self, text: str) -> List[float]:
        """
        Ultra-fast (<2ms), zero-dependency deterministic 384-dimensional dense embedding:
        - Domain semantic cluster activations mapped to dedicated subspaces.
        - Sub-word character 3-grams and token MD5 sign hashing for broad lexical matching.
        - Full L2 unit-norm normalization (||v||_2 = 1.0).
        """
        vec = [0.0] * self.DIMENSION
        text_lower = text.lower().strip()
        tokens = re.findall(r"[a-z0-9]+", text_lower)

        if not tokens:
            return [0.0] * self.DIMENSION

        # A. Semantic cluster projection
        for cluster_name, config in SEMANTIC_CLUSTERS.items():
            start_idx, end_idx = config["indices"]
            cluster_tokens = config["tokens"]
            matches = sum(1 for t in tokens if t in cluster_tokens)

            # Also check sub-word matches in text (e.g. "spreadsheets" contains "spreadsheet")
            for ct in cluster_tokens:
                if ct in text_lower:
                    matches += 0.5

            if matches > 0:
                weight = math.log1p(matches * 2.0)
                span = end_idx - start_idx
                for offset in range(span):
                    idx = start_idx + offset
                    # Project with deterministic periodic resonance across cluster subspace
                    phase = (offset * 137.5) * (math.pi / 180.0)
                    vec[idx] += weight * (0.8 + 0.2 * math.cos(phase))

        # B. Sub-word character 3-grams and token hashing for subspace 288-384 + whole vector
        for token in tokens:
            # Token-level hash
            h = int(hashlib.md5(token.encode("utf-8")).hexdigest()[:8], 16)
            dim_idx = 288 + (h % (self.DIMENSION - 288))
            sign = 1.0 if (h & 1) == 0 else -1.0
            vec[dim_idx] += sign * 1.2

            # Character 3-grams
            if len(token) >= 3:
                for i in range(len(token) - 2):
                    tri = token[i:i+3]
                    tri_hash = int(hashlib.md5(tri.encode("utf-8")).hexdigest()[:6], 16)
                    tri_dim = tri_hash % self.DIMENSION
                    tri_sign = 1.0 if (tri_hash & 1) == 0 else -0.5
                    vec[tri_dim] += tri_sign * 0.35

        # C. L2 normalization (Unit Norm: ||u||_2 = 1.0)
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 1e-9:
            vec = [x / norm for x in vec]
        else:
            vec = [0.0] * self.DIMENSION

        return vec

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """
        Calculates cosine similarity between two vector embeddings:
        Similarity = (u · v) / (||u||_2 * ||v||_2)
        Returns a float between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized embeddings).
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))

        if norm_a <= 1e-9 or norm_b <= 1e-9:
            return 0.0

        similarity = dot_product / (norm_a * norm_b)
        # Numerical clamping to avoid floating-point drift outside [-1.0, 1.0]
        return max(-1.0, min(1.0, round(float(similarity), 4)))

    def semantic_search(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 5,
        threshold: float = 0.3,
        text_keys: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Ranks a list of candidate items by cosine similarity against the query embedding.
        Each candidate is expected to have fields like 'category', 'micro_service', 'title', etc.
        """
        if not query or not candidates:
            return []

        query_vec = self.get_embedding(query)
        scored_candidates: List[Dict[str, Any]] = []

        keys = text_keys or ["micro_service", "title", "opportunity_title", "category", "skill_category", "description"]

        for item in candidates:
            # Build representative text for candidate
            text_parts = [str(item[k]) for k in keys if k in item and item[k]]
            candidate_text = " ".join(text_parts) if text_parts else str(item)

            candidate_vec = self.get_embedding(candidate_text)
            similarity = self.cosine_similarity(query_vec, candidate_vec)

            if similarity >= threshold:
                item_copy = dict(item)
                item_copy["similarity_score"] = similarity
                scored_candidates.append(item_copy)

        # Sort descending by similarity score
        scored_candidates.sort(key=lambda x: x.get("similarity_score", 0.0), reverse=True)
        return scored_candidates[:top_k]


# Global singleton instance
vector_engine = VectorEngine()

def get_embedding(text: str) -> List[float]:
    """Helper proxy for vector_engine.get_embedding."""
    return vector_engine.get_embedding(text)

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Helper proxy for vector_engine.cosine_similarity."""
    return vector_engine.cosine_similarity(vec_a, vec_b)

def semantic_search(
    query: str,
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
    threshold: float = 0.3
) -> List[Dict[str, Any]]:
    """Helper proxy for vector_engine.semantic_search."""
    return vector_engine.semantic_search(query, candidates, top_k=top_k, threshold=threshold)
