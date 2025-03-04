from pydantic import BaseModel
import psycopg2


class Preferences(BaseModel):
    name: str
    symbol: str

class Allergen(BaseModel):
    name: str

class Food(BaseModel):
    name: str
    description: str
    preferences: list[Preferences]
    allergens: list[str]

class Event(BaseModel):
    cater: str
    event_date: str
    food: list[Food]

def get_database_connection():
    # Connect to your postgres DB

    # TODO: This needs to be pulled from environment variables
    conn = psycopg2.connect("host= port= dbname= user= password=")

    # # Open a cursor to perform database operations
    cur = conn.cursor()

    # # Execute a query
    cur.execute("SELECT 100")

    # # Retrieve query results
    print(cur.fetchall())

def insert_event(e: Event):
    get_database_connection()

