import os
import psycopg2
from psycopg2.extras import RealDictCursor
from configparser import ConfigParser

# Fallback config
conf = ConfigParser()
conf.read('config.ini')

# Prefer environment variables if provided (for Docker), otherwise read config.ini
dbhost = os.getenv("DB_HOST", conf.get("DATABASE", "db_host", fallback="localhost"))
dbuser = os.getenv("DB_USER", conf.get("DATABASE", "db_user", fallback="postgres"))
dbpassword = os.getenv("DB_PASSWORD", conf.get("DATABASE", "db_password", fallback=""))
dbname = os.getenv("DB_NAME", conf.get("DATABASE", "db_name", fallback="postgres"))

db = None  # Prevent ImportError on failed connection

try:
    db = psycopg2.connect(
        host=dbhost,
        user=dbuser,
        password=dbpassword,
        dbname=dbname,
        cursor_factory=RealDictCursor  
    )
    db.autocommit = True
    print("Database Connected Successfully")

except Exception as e:
    print(f"Error connecting to database: {e}")