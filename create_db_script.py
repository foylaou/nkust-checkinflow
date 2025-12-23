import asyncio
import asyncpg
import os

async def create_database():
    sys_user = os.getenv("DB_USERNAME", "postgres")
    sys_password = os.getenv("DB_PASSWORD", "postgres")
    sys_host = os.getenv("DB_HOST", "localhost")
    sys_port = os.getenv("DB_PORT", "5432")
    target_db = os.getenv("DB_NAME", "checkinflow")
    
    # Connect to the default 'postgres' database
    print(f"Connecting to postgres database at {sys_host}:{sys_port} as {sys_user}...")
    try:
        conn = await asyncpg.connect(
            user=sys_user,
            password=sys_password,
            database='postgres',
            host=sys_host,
            port=sys_port
        )
    except Exception as e:
        print(f"Failed to connect to postgres: {e}")
        return

    # Check if database exists
    exists = await conn.fetchval(f"SELECT 1 FROM pg_database WHERE datname = '{target_db}'")
    
    if not exists:
        print(f"Database '{target_db}' does not exist. Creating...")
        try:
            await conn.execute(f'CREATE DATABASE "{target_db}"')
            print(f"Database '{target_db}' created successfully.")
        except Exception as e:
            print(f"Failed to create database: {e}")
    else:
        print(f"Database '{target_db}' already exists.")
        
    await conn.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(create_database())
