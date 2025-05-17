from typing import Annotated, Protocol

from fastapi import FastAPI, File, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
import uvicorn

# Dependecies
class AppLogger(Protocol):
    def info(self, message: str, extra: dict = {}):
        ...
    def warning(self, message: str, extra: dict = {}):
        ...
    def error(self, message: str, extra: dict = {}):
        ...
    def debug(self, message: str, extra: dict = {}):
        ...

class PDFExtracter(Protocol):
    def extract_pdf(self, file: bytes) -> str:
        ...

# Models
class Item(BaseModel):
    name: str
    allergens: list[str]
    preferences: list[str]


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


class App:
    def __init__(self, environment: str, logger: AppLogger, pdf_extracter: PDFExtracter ):
        self.api = FastAPI(
            title="PDF Handler",
            debug=environment == "DEV",
            description="A service for converting PDF files to structured data",
            version="0.0.1",
            docs_url="/docs" if environment != "PROD" else None,
            redoc_url=None
        )
        self.api.add_api_route("/api/v1/health_check", self.health_check, name="Health Check", methods=["GET"])
        self.api.add_api_route("/api/v1/process_pdf", self.process_pdf, name="Process PDF", methods=["POST"])
        self.api.add_api_route("/api/v1/save_events", self.save_events, name="Save Events", methods=["POST"])

        self.logger = logger
        self.pdf_extracter = pdf_extracter

    def start_server(self, port: int):
        uvicorn.run(self.api, host="0.0.0.0", port=port)

    def health_check(self, request: Request):
        self.logger.info("Health check", extra={"version": self.api.version, "client_ip": request.client.host})
        return JSONResponse(status_code=200, content={"version": self.api.version})

    def process_pdf(
        self,
        file: Annotated[bytes, File()],
        request: Request
    ):
        # Check if the file is a PDF by examining the magic bytes
        if not file.startswith(b"%PDF-"):
            self.logger.warning("File does not appear to be a PDF", extra={"client_ip": request.client.host})
            return JSONResponse(
                status_code=400,
                content={"error": "The uploaded file is not a valid PDF"}
            )

        # Extract the data from the PDF
        data = self.pdf_extracter.extract_pdf(file)

        # Check if the data was successfully extracted from the PDF
        if data is None:
            err = "Failed to extract data from the PDF"
            self.logger.error(err, extra={"client_ip": request.client.host})
            return JSONResponse(status_code=400, content={"error": err})

        cleaned_res = data.strip("```json").strip("```")

        # Validate the data
        try:
            events = Events.model_validate_json(cleaned_res)

        except ValidationError as e:
            return JSONResponse(status_code=400, content={"error": "Data generated was not in the appropriate format", "details": e.errors()})

        # Check how many days were extracted from the PDF
        if len(events.events) == 0:
            err = "No events were extracted from the PDF"
            self.logger.error(err, extra={"client_ip": request.client.host})
            return JSONResponse(status_code=400, content={"error": err})
        
        # Check if there are more that 3 days in the PDF
        elif len(events.events) > 3:
            msg = "More than 3 days were extracted from the PDF"
            self.logger.warning(msg, extra={"client_ip": request.client.host})
            first_three_events = events.events[:3]
            events.events = first_three_events

        content = events.model_dump()
        self.logger.info("PDF processed successfully", extra={"pdf_data": content, "client_ip": request.client.host})
        return JSONResponse(status_code=200, content=content)

    def save_events(
        self,
        events: Events,
        request: Request
    ):
        self.logger.info("Saving events", extra={"events": events.model_dump(), "client_ip": request.client.host})
        return JSONResponse(status_code=200, content={"message": "Events saved successfully"})
