from app.db.models.user import User
from app.db.models.skill import Skill
from app.db.models.market import MarketData
from app.db.models.income_kit import IncomeKit
from app.db.models.opportunity import Opportunity
from app.db.models.analytics import Analytics
from app.db.models.history import History
from app.db.models.feedback import Feedback
from app.db.models.deployment import Deployment

# For Alembic to discover models automatically
__all__ = [
    "User",
    "Skill",
    "MarketData",
    "IncomeKit",
    "Opportunity",
    "Analytics",
    "History",
    "Feedback",
    "Deployment",
]
