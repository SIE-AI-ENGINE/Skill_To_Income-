from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.db.models.market import MarketData
from app.schemas.market import MarketDataResponse, MarketDataCreate
from app.schemas.sie import MarketIntelligenceResponse, MarketSource, MarketCategory, TrendPoint

router = APIRouter()

@router.get("/", response_model=List[MarketDataResponse])
def get_market_data(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    market_data = db.query(MarketData).offset(skip).limit(limit).all()
    return market_data

@router.post("/", response_model=MarketDataResponse)
def create_market_data(
    payload: MarketDataCreate,
    db: Session = Depends(get_db),
) -> Any:
    record = MarketData(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/trends", response_model=MarketIntelligenceResponse)
@router.get("/intelligence", response_model=MarketIntelligenceResponse)
def get_market_trends(db: Session = Depends(get_db)) -> Any:
    market_items = db.query(MarketData).all()
    
    if market_items:
        avg_demand = int(sum(m.demand_score for m in market_items) / len(market_items) * 10)
        avg_comp = int(sum(m.competition_score for m in market_items) / len(market_items) * 10)
        
        # Sources breakdown from actual platforms
        platform_counts = {}
        for m in market_items:
            platform_counts[m.platform] = platform_counts.get(m.platform, 0) + 1
        total_p = sum(platform_counts.values()) or 1
        
        colors = {"Upwork": "#2f64e8", "Fiverr": "#37b77a", "LinkedIn": "#8c6ce6"}
        sources = [
            MarketSource(
                name=p,
                value=int((count / total_p) * 100),
                color=colors.get(p, "#4f46e5"),
            )
            for p, count in platform_counts.items()
        ]
        
        # Categories breakdown
        cat_map = {}
        for m in market_items:
            if m.category not in cat_map:
                cat_map[m.category] = []
            cat_map[m.category].append(m)
            
        categories = [
            MarketCategory(
                name=cat,
                demand=int(sum(x.demand_score for x in items) / len(items) * 10),
                competition=int(sum(x.competition_score for x in items) / len(items) * 10),
                score=int(sum(x.success_probability for x in items) / len(items) * 100),
            )
            for cat, items in cat_map.items()
        ]
    else:
        avg_demand = 86
        avg_comp = 38
        sources = [
            MarketSource(name="Upwork", value=45, color="#2f64e8"),
            MarketSource(name="Fiverr", value=30, color="#37b77a"),
            MarketSource(name="LinkedIn", value=25, color="#8c6ce6"),
        ]
        categories = [
            MarketCategory(name="Data & Automation", demand=92, competition=35, score=94),
            MarketCategory(name="Backend APIs", demand=88, competition=32, score=90),
            MarketCategory(name="Full-Stack Web", demand=85, competition=40, score=88),
        ]

    return MarketIntelligenceResponse(
        marketScore=max(50, min(100, int((avg_demand * 0.6) + ((100 - avg_comp) * 0.4)))),
        demand=avg_demand,
        competition=avg_comp,
        trend="+16.2%",
        sources=sources,
        categories=categories,
        weeklyTrend=[
            TrendPoint(label="W1", value=60),
            TrendPoint(label="W2", value=68),
            TrendPoint(label="W3", value=75),
            TrendPoint(label="W4", value=84),
        ],
    )

