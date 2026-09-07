from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    action = Column(String, index=True, nullable=False)
    details = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="history")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
