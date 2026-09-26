import sys
from app.db.session import SessionLocal
from app.db.models.user import User

def main():
    target_email = "abhiniprojects7@gmail.com"
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == target_email).first()
        if user:
            print(f"Found user: ID={user.id}, email={user.email}, full_name={user.full_name}")
            db.delete(user)
            db.commit()
            print(f"Successfully deleted user '{target_email}' and all associated records.")
        else:
            print(f"User with email '{target_email}' was not found in the database.")
    except Exception as e:
        db.rollback()
        print(f"Error while deleting user: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
