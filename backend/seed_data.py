import random
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models.user import User
from app.db.models.skill import Skill
from app.db.models.market import MarketData
from app.db.models.income_kit import IncomeKit
from app.core.security import get_password_hash

def seed_db(db: Session):
    # Check if we already seeded
    if db.query(User).first():
        print("Database already seeded. Skipping.")
        return

    print("Seeding database...")

    # Create users
    user1 = User(
        email="john@example.com",
        full_name="John Doe",
        hashed_password=get_password_hash("secret"),
        education="BSc Computer Science",
        experience="2 years frontend dev",
        income_goal=5000.0,
        available_time_hrs=20,
        career_mode="freelance",
    )
    user2 = User(
        email="jane@example.com",
        full_name="Jane Smith",
        hashed_password=get_password_hash("secret"),
        education="Self-taught",
        experience="1 year python dev",
        income_goal=3000.0,
        available_time_hrs=10,
        career_mode="side_hustle",
    )
    db.add(user1)
    db.add(user2)
    db.commit()
    db.refresh(user1)
    db.refresh(user2)

    # Create skills
    skill1 = Skill(
        user_id=user1.id,
        core_skill="React",
        detected_tags=["JavaScript", "TypeScript", "Redux"],
        decomposed_nodes={"React": {"demand": 9.5, "competition": 8.0}}
    )
    skill2 = Skill(
        user_id=user2.id,
        core_skill="Python",
        detected_tags=["FastAPI", "Pandas"],
        decomposed_nodes={"FastAPI": {"demand": 8.5, "competition": 6.0}}
    )
    db.add(skill1)
    db.add(skill2)
    db.commit()

    # Create Market Data
    market1 = MarketData(
        platform="Upwork",
        category="Web Development",
        opportunity_title="React Frontend Developer for E-commerce",
        estimated_income=3000.0,
        success_probability=0.75,
        demand_score=9.0,
        competition_score=8.5
    )
    market2 = MarketData(
        platform="Fiverr",
        category="Backend Development",
        opportunity_title="FastAPI API Developer",
        estimated_income=1500.0,
        success_probability=0.85,
        demand_score=8.0,
        competition_score=5.0
    )
    db.add(market1)
    db.add(market2)
    db.commit()

    # Create Income Kit
    kit1 = IncomeKit(
        user_id=user1.id,
        upwork_proposal={"title": "Pro React Developer", "body": "I will build your e-commerce site."},
        github_readme={"title": "John's Portfolio", "body": "I build things with React."}
    )
    db.add(kit1)
    db.commit()

    print("Database seeded successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
