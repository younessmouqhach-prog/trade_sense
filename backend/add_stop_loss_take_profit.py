#!/usr/bin/env python3
"""Add stop_loss and take_profit columns to trades table"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

def add_stop_loss_take_profit_columns():
    """Add stop_loss and take_profit columns to the trades table"""

    app = create_app()

    with app.app_context():
        try:
            # For SQLite, use PRAGMA table_info to check columns
            from sqlalchemy import text

            # Check if stop_loss column exists
            result = db.session.execute(text("PRAGMA table_info(trades)"))
            columns = result.fetchall()
            column_names = [col[1] for col in columns]  # col[1] is the column name

            if 'stop_loss' in column_names:
                print("[+] stop_loss column already exists")
            else:
                print("[+] Adding stop_loss column...")
                db.session.execute(text("""
                    ALTER TABLE trades ADD COLUMN stop_loss NUMERIC(15, 8)
                """))
                print("[+] Added stop_loss column")

            if 'take_profit' in column_names:
                print("[+] take_profit column already exists")
            else:
                print("[+] Adding take_profit column...")
                db.session.execute(text("""
                    ALTER TABLE trades ADD COLUMN take_profit NUMERIC(15, 8)
                """))
                print("[+] Added take_profit column")

            db.session.commit()
            print("[+] Migration completed successfully!")

        except Exception as e:
            db.session.rollback()
            print(f"[-] Migration failed: {e}")
            import traceback
            traceback.print_exc()
            return False

    return True

if __name__ == "__main__":
    success = add_stop_loss_take_profit_columns()
    if success:
        print("\n✅ Database migration completed!")
        print("You can now use stop_loss and take_profit in trade orders.")
    else:
        print("\n❌ Database migration failed!")
        sys.exit(1)