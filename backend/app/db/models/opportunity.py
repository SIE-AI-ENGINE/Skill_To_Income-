from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String, index=True, nullable=False)
    platform = Column(String, index=True, nullable=False)
    match_score = Column(Float, nullable=False)
    
    # Relationships
    user = relationship("User", backref="opportunities")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
