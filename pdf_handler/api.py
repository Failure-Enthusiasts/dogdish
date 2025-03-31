from typing import Annotated
import os

from fastapi import FastAPI, File
from pydantic import BaseModel, field_validator, ValidationError

from pdf_genai import PDFGenAI

app = FastAPI(
    title="PDF Handler",
    description="A service for converting PDF files to structured data",
    version="0.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
)

API_KEY = os.environ.get("GEMINI_API_KEY")

class Food(BaseModel):
    name: str
    description: str
    preferences: list[str]
    allergens: list[str]
    
    @field_validator('preferences', 'allergens')
    @classmethod
    def to_lowercase(cls, value: list[str]) -> list[str]:
        return [item.lower() for item in value]

class Event(BaseModel):
    caterer: str
    event_date: str
    event_date_iso: str
    food: list[Food]



@app.get("/")
def health_check():
    return {"version": app.version}


@app.post("/api/v1/process_pdf")
def process_pdf(
    file: Annotated[bytes, File()]
):
    pdf_gen = PDFGenAI(API_KEY)
    res = pdf_gen.extract_pdf(file)
    if res is None:
        return {"error": "Failed to extract the PDF"}

    cleaned_res = res.strip("```json").strip("```")

    try:
        event = Event.model_validate_json(cleaned_res)

    except ValidationError as e:
        return {"error": "Failed to parsed the JSON response from the PDFGenAI", "details": e.errors()}

    return event
