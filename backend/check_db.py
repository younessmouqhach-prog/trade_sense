import psycopg2

try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='postgres',
        database='tradesense_db'
    )
    cursor = conn.cursor()
    
    # Check what tables exist
    cursor.execute('SELECT tablename FROM pg_tables WHERE schemaname = \'public\';')
    tables = cursor.fetchall()
    
    print(f'Found {len(tables)} tables in tradesense_db:')
    for table in tables:
        print(f'  âœ… {table[0]}')
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f'Error: {e}')
