import psycopg2
from psycopg2.extras import RealDictCursor
from configparser import ConfigParser

conf = ConfigParser()
conf.read('config.ini')
dbhost = conf.get("DATABASE", "db_host")
dbuser = conf.get("DATABASE", "db_user")
dbpassword = conf.get("DATABASE", "db_password")
dbname = conf.get("DATABASE", "db_name")


# Connect to the PostgreSQL database
try:
    db = psycopg2.connect(
        host=dbhost,
        user=dbuser,
        password=dbpassword,
        dbname=dbname,
        cursor_factory=RealDictCursor  
    )
    
    # Enable autocommit
    db.autocommit = True
    
    print("Database Connected Successfully")

except Exception as e:
    print(f"Error connecting to database: {e}")