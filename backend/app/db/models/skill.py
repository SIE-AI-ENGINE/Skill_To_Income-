from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    core_skill = Column(String, index=True, nullable=False)  # e.g. "Python"
    detected_tags = Column(JSON, nullable=True)  # ["NumPy", "Pandas", "FastAPI"]
    decomposed_nodes = Column(JSON, nullable=True)  # Graph structure with demand, competition scores
    
    # Relationships
    user = relationship("User", back_populates="skills")