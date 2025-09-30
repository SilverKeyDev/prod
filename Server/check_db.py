#!/usr/bin/env python3
"""
Database diagnostic script
Checks database connectivity, table existence, and provides migration guidance
"""
import os
import sys
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError, ProgrammingError

def check_database():
    """Check database connectivity and table status"""
    
    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        print("\nPlease set it in your environment or .env file")
        return False
    
    # Redact password from URL for logging
    safe_url = database_url
    if '@' in database_url and ':' in database_url.split('@')[0]:
        parts = database_url.split('@')
        creds = parts[0].split('://')
        if len(creds) > 1:
            user = creds[1].split(':')[0]
            safe_url = f"{creds[0]}://{user}:***@{parts[1]}"
    
    print(f"📊 Database URL: {safe_url}")
    print()
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        # Test connectivity
        print("🔌 Testing connectivity...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            if row and row[0] == 1:
                print("✅ Database connection successful!")
            else:
                print("❌ Unexpected result from connectivity test")
                return False
        
        print()
        print("🔍 Checking tables...")
        
        # Get table list
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"   Found {len(tables)} tables:")
        for table in sorted(tables):
            print(f"     - {table}")
        
        print()
        
        # Check for required tables
        required_tables = ['users', 'pdf_documents']
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print(f"❌ MISSING REQUIRED TABLES: {', '.join(missing_tables)}")
            print()
            print("🔧 To fix this, run migrations:")
            print()
            if database_url.startswith('sqlite://'):
                print("   # For SQLite (development):")
                print("   cd Server")
                print("   flask db upgrade")
            else:
                print("   # For PostgreSQL (production):")
                print("   cd Server")
                print("   # Make sure DATABASE_URL is set")
                print("   flask db upgrade")
            print()
            return False
        else:
            print("✅ All required tables present!")
            
            # Check columns in key tables
            print()
            print("📋 Table schemas:")
            for table in required_tables:
                columns = inspector.get_columns(table)
                print(f"\n   {table}:")
                for col in columns:
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    print(f"     - {col['name']}: {col['type']} {nullable}")
        
        print()
        print("✅ Database check complete - everything looks good!")
        return True
        
    except OperationalError as e:
        print(f"❌ DATABASE CONNECTION FAILED")
        print(f"   Error: {str(e)}")
        print()
        print("Possible causes:")
        print("  1. Database server is not running")
        print("  2. Wrong host/port in DATABASE_URL")
        print("  3. Invalid credentials")
        print("  4. Database doesn't exist")
        print("  5. Network/firewall issues")
        return False
        
    except ProgrammingError as e:
        print(f"❌ DATABASE QUERY FAILED")
        print(f"   Error: {str(e)}")
        print()
        print("This usually means:")
        print("  - Tables don't exist (need to run migrations)")
        print("  - SQL syntax error")
        print("  - Permission issues")
        return False
        
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {type(e).__name__}")
        print(f"   {str(e)}")
        return False

if __name__ == '__main__':
    # Load .env file if it exists
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("⚠️  python-dotenv not installed, reading from environment only")
        print()
    
    print("=" * 60)
    print("  DATABASE DIAGNOSTIC CHECK")
    print("=" * 60)
    print()
    
    success = check_database()
    
    sys.exit(0 if success else 1)

