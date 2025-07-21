from typing import Annotated
import os
import sys

import httpx
from fastapi import FastAPI, File, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError

from pdf_genai import PDFGenAI
from logger import logger


app = FastAPI(
    title="PDF Handler",
    description="A service for converting PDF files to structured data",
    version="0.0.1",
    docs_url="/docs",
)


GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
DATABASE_HANDLER_HOST = os.environ.get("PH_DH_HOST")

if GEMINI_API_KEY is None or DATABASE_HANDLER_HOST is None:
    print("Error: Required environment variables GEMINI_API_KEY or PH_DH_HOST are not set.")
    sys.exit(1)

class Item(BaseModel):
    name: str
    allergens: list[str]
    preference: str | None


class SaladBar(BaseModel):
    toppings: list[Item]
    dressings: list[Item]


class Event(BaseModel):
    weekday: str
    iso_date: str
    cuisine: str
    entrees_and_sides: list[Item]
    salad_bar: SaladBar

class Events(BaseModel):
    events: list[Event]


@app.get("/", name="Health Check")
def health_check(request: Request):
    logger.info("Health check", extra={"version": app.version, "client_ip": request.client.host})
    return JSONResponse(status_code=200, content={"version": app.version})


@app.post("/api/v1/process_pdf", name="Process PDF")
def process_pdf(
    file: Annotated[bytes, File()],
    request: Request
):
    # Check if the file is a PDF by examining the magic bytes
    if not file.startswith(b"%PDF-"):
        logger.warning("File does not appear to be a PDF", extra={"client_ip": request.client.host})
        return JSONResponse(
            status_code=400,
            content={"error": "The uploaded file is not a valid PDF"}
        )
        
    # Check if the GEMINI API key is set
    if GEMINI_API_KEY is None:
        err = "No GEMINI API key found"
        logger.error(err)
        return JSONResponse(status_code=400, content={"error": err})

    # Extract the data from the PDF
    pdf_gen = PDFGenAI(GEMINI_API_KEY)
    data = pdf_gen.extract_pdf(file)

    # Check if the data was successfully extracted from the PDF
    if data is None:
        err = "Failed to extract data from the PDF"
        logger.error(err, extra={"client_ip": request.client.host})
        return JSONResponse(status_code=400, content={"error": err})

    cleaned_res = data.strip("```json").strip("```")

    print(f"The cleaned data was:\n {cleaned_res}")

    # Validate the data
    try:
        events = Events.model_validate_json(cleaned_res)

    except ValidationError as e:
        return JSONResponse(status_code=400, content={"error": "Data generated was not in the appropriate format", "details": e.errors()})

    # Check how many days were extracted from the PDF
    if len(events.events) == 0:
        err = "No events were extracted from the PDF"
        logger.error(err, extra={"client_ip": request.client.host})
        return JSONResponse(status_code=400, content={"error": err})
    
    # Check if there are more that 3 days in the PDF
    elif len(events.events) > 3:
        msg = "More than 3 days were extracted from the PDF"
        logger.warning(msg, extra={"client_ip": request.client.host})
        first_three_events = events.events[:3]
        events.events = first_three_events

    content = events.model_dump()
    logger.info("PDF processed successfully", extra={"pdf_data": content, "client_ip": request.client.host})
    return JSONResponse(status_code=200, content=content)

@app.post("/api/v1/save_event", name="Save Event")
def save_event(
    request: Request,
    event: Event
):
    if DATABASE_HANDLER_HOST is None:
        err = "No database handler defined"
        logger.error(err)
        return JSONResponse(status_code=400, content={"error": err})

    json_event = event.model_dump()

    response = httpx.post(f"{DATABASE_HANDLER_HOST}/event", json=json_event)
    if response.status_code == 200:
        msg = "event successfully stored"
        event_id = response.json()["event_id"]
        return JSONResponse(status_code=200, content={"message": msg, "event_id": event_id})
    else:
        msg = "failed to store event"
        return JSONResponse(status_code=500, content={"message": msg, "detail": response.json()})
