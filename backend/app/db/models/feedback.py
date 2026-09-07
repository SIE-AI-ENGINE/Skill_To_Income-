from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    content = Column(String, nullable=False)
    rating = Column(Integer, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="feedbacks")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
