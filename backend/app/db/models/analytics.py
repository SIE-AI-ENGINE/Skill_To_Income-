from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    metric_name = Column(String, index=True, nullable=False)  # e.g., "views", "clicks"
    value = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="analytics")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
