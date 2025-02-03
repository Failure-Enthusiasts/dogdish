from datetime import date
from pydantic import BaseModel

class Preferences(BaseModel):
    name: str
    symbol: str

class Allergen(BaseModel):
    name: str

class Food(BaseModel):
    name: str
    description: str
    preferences: list[Preferences]

class Event(BaseModel):
    cater: str
    event_date: date
    food: list[Food]

def create_event_obj(data):
    pass