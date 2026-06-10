#import psycopg2
#from fastapi import HTTPException

#DB_CONFIG = {
#    "dbname": "Saham",
#    "user": "postgres",
#    "password": "dyah21", # <-- Sesuaikan password Anda
#    "host": "localhost",
#    "port": "5432"
#}

#def get_db_connection():
#    try:
#        return psycopg2.connect(**DB_CONFIG)
#    except Exception as e:
#        print(f"Database error: {e}")
#        return None