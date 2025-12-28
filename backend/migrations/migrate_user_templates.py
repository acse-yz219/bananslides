
import sys
import os
import sqlite3

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config

def migrate():
    print("Migrating database...")
    
    # Get database path from config
    db_path = Config.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', '')
    print(f"Database path: {db_path}")
    
    if not os.path.exists(db_path):
        print("Database not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if user_id column exists
        cursor.execute("PRAGMA table_info(user_templates)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'user_id' not in columns:
            print("Adding user_id column to user_templates table...")
            cursor.execute("ALTER TABLE user_templates ADD COLUMN user_id TEXT REFERENCES users(id)")
            conn.commit()
            print("Migration successful!")
        else:
            print("Column user_id already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
