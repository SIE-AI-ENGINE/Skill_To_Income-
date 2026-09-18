from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class UserOutcome(Base):
    __tablename__ = "user_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String, nullable=True)
    opportunity_title = Column(String, nullable=False, index=True)
    platform = Column(String, nullable=False)  # 'Fiverr', 'Upwork', 'Cold Outreach', 'LinkedIn', 'WhatsApp'
    days_active = Column(Integer, default=1, nullable=False)
    inquiries_received = Column(Integer, default=0, nullable=False)
    orders_converted = Column(Integer, default=0, nullable=False)
    revenue_inr = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="running", nullable=False)  # 'running', 'converted', 'stalled'
    notes = Column(Text, nullable=True)
    strategy_recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="outcomes")
