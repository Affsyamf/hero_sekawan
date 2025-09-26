from db.db import engine
from db.models import Base

if __name__ == "__main__":
    confirm = input("This will DELETE ALL TABLES. Type 'yes' to continue: ")
    if confirm.strip().lower() == 'yes':
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        print("Database reset complete.")
    else:
        print("Reset canceled.")