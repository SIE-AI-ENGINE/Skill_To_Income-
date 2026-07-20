from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    
    # Onboarding attributes
    education = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    income_goal = Column(Float, nullable=True)  # e.g. 50000.0
    available_time_hrs = Column(Integer, nullable=True)  # e.g. 3
    career_mode = Column(String, nullable=True)  # e.g. Freelancing + Remote Jobs
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())