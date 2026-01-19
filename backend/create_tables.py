from app import create_app
from extensions import db

print('Creating database tables...')
app = create_app()
with app.app_context():
    db.create_all()
    print('Tables created successfully!')

# Verify
from sqlalchemy import inspect
inspector = inspect(db.engine)
tables = inspector.get_table_names()
print(f'Created {len(tables)} tables:')
for table in tables:
    print(f'  - {table}')
