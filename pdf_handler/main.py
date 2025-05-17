import os

from app import App
from logger import  new_logger
from pdf_genai import PDFGenAI

# Environment Variables
PORT = int(os.environ.get("PORT", "8000"))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
ENVIRONMENT = os.environ.get("ENVIRONMENT", "PROD").upper()


def main():
    logger = new_logger(log_level=LOG_LEVEL)
    pdf_extracter = PDFGenAI(api_key=GEMINI_API_KEY, logger=logger)
    app = App(ENVIRONMENT, logger, pdf_extracter)
    app.start_server(port=PORT)

if __name__ == "__main__":
    main()
