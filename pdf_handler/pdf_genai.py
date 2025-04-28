from datetime import date
import json

from google import genai
from google.genai.models import types

from logger import logger

class PDFGenAI:
  def __init__(self,api_key: str, model:str = "gemini-2.0-flash"):
    logger.debug("Initializing PDFGenAI")

    self.AI_CLIENT =  genai.Client(api_key=api_key)
    self.model = model

    current_year = date.today().year
    logger.debug("current year captured", extra={"current_year": current_year})

    self.system_prompt = f"""
    As an OCR platform, your main task is to extract all the details from all pdf files. The structure of your 
    output needs to follow the following guidelines:
    At the top of the PDF file the name of the caterer is displayed. This should be extracted and included in the 
    output.
    Below the name of the caterer is the date of the menu. This should be extracted and included in the output, 
    this field will be called: event_date. An extra field below the date should be the same date in the format 
    ISO 8601 - {current_year}-01-07, this field will be called: event_date_iso.
    `name: Edamame Slaw`
    `Description: Cabbage slaw with edamame with cilantro, scallions, carrots, sesame lime vinaigrette, and sesame 
    seeds.`
    `Preferences: VEGAN, GLUTEN FREE`
    `Allergens: Cilantro, Onions, Sesame, Soy`

    If any of these sections are empty on the PDF, always include them in the output but leave them as an empty 
    string for the description and empty array for the rest. 

    Please return formatted JSON.
    I expecte to see the following fields in the output:
    - caterer
    - event_date
    - event_date_iso
    - food
    """
    logger.debug("PDFGenAI initialized", extra={"model": self.model, "system_prompt": self.system_prompt})

  def extract_pdf(self, file_bytes: bytes):
    logger.debug("Extracting PDF", extra={"model": self.model, "system_prompt": self.system_prompt})

    response = self.AI_CLIENT.models.generate_content(
      model=self.model,
      config=types.GenerateContentConfig(
        system_instruction=self.system_prompt),
        contents=[
          types.Part.from_bytes(
            data=file_bytes,
            mime_type='application/pdf',
          ),
        "process this pdf file accurately as per the instructions"]
    )

    try:
      data = json.loads(response.text)
      logger.debug("PDF extracted", extra={"model": self.model, "system_prompt": self.system_prompt, "extracted_data": data})
      return response.text

    except json.JSONDecodeError as e:
      logger.error("Failed to parse JSON", extra={"error": e, "text": response.text})
      return None

