from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    platform = Column(String, index=True, nullable=False)
    status = Column(String, index=True, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", backref="deployments")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
