from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class IncomeKit(Base):
    __tablename__ = "income_kits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Bundled asset payloads in JSON
    fiverr_gig = Column(JSON, nullable=True)
    upwork_proposal = Column(JSON, nullable=True)
    github_readme = Column(JSON, nullable=True)
    portfolio_site = Column(JSON, nullable=True)
    resume_data = Column(JSON, nullable=True)
    linkedin_optimizer = Column(JSON, nullable=True)
    cold_email_template = Column(JSON, nullable=True)
    whatsapp_pitch = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())