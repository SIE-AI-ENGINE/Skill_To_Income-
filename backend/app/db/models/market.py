from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, index=True, nullable=False)  # "Fiverr", "Upwork", "LinkedIn"
    category = Column(String, index=True, nullable=False)
    opportunity_title = Column(String, nullable=False)
    
    estimated_income = Column(Float, nullable=False)
    success_probability = Column(Float, nullable=False)
    demand_score = Column(Float, nullable=False)
    competition_score = Column(Float, nullable=False)
    
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())