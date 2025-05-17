from google import genai
from google.genai.models import types
from ddtrace import tracer
from typing import Protocol

class AppLogger(Protocol):
    def info(self, message: str, extra: dict = {}):
        ...
    def warning(self, message: str, extra: dict = {}):
        ...
    def error(self, message: str, extra: dict = {}):
        ...
    def debug(self, message: str, extra: dict = {}):
        ...

class PDFGenAI:
  @tracer.wrap(service="pdfgenai", name="init")
  def __init__(self, api_key: str, logger: AppLogger, model:str = "gemini-2.0-flash"):
    self.AI_CLIENT =  genai.Client(api_key=api_key)
    self.logger = logger
    self.model = model
    self.system_prompt = """
    As an OCR platform, your main task is to extract all the details from all pdf files. The structure of your 
    output needs to follow the following guidelines:

    The PDF file is a menu showing the food that will servered for a particular day. I just need you to focus on the 
    first PDF file. Once you have extracted the data, I will need it to be structured in the JSON format below, note 
    that the above below is for 1 day of the week:

    {
      "events": [
        {
          "weekday": "monday",
          "iso_date": "2025-05-12",
          "cuisine": "moroccan",
          "entrees_and_sides": [
            {
              "name": "Shabazi Spiced Chicken Souvlaki served with tzatziki sauce",
              "allergens": [
                "dairy"
              ],
              "preferences": []
            },
            {
              "name": "Moroccan Harissa & Preserved Lemon Lamb Stew served with Harissa Yogurt",
              "allergens": [
                "dairy"
              ],
              "preferences": []
            },
            {
              "name": "Toasted Farroto, Asparagus, Tomato, Cucumber, Feta Cheese",
              "allergens": [
                "gluten",
                "dairy"
              ],
              "preferences": [
                "vegetarian"
              ]
            },
            {
              "name": "Ras al Hanout Sauteed Spring Green Beans",
              "allergens": [],
              "preferences": [
                "vegan"
              ]
            },
            {
              "name": "Kale Wild Rice with Lemon Agave Dressing",
              "allergens": [],
              "preferences": [
                "vegan"
              ]
            }
          ],
          "salad_bar": {
            "toppings": [
              {
                "name": "Baby Kale",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Za’atar Spiced Chickpeas",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Cherry Tomatoes",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Sliced Hot House Cucumbers",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Shaved Cello Carrot Coins",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Turmeric Cauliflower",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Tabbouleh",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Goat Cheese",
                "allergens": [
                  "dairy"
                ],
                "preferences": []
              }
            ],
            "dressings": [
              {
                "name": "Caesar Dressing",
                "allergens": [
                  "egg",
                  "dairy",
                  "soy"
                ],
                "preferences": []
              },
              {
                "name": "Lemon-Dijon Vinaigrette",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Apple Cider Vinaigrette",
                "allergens": [],
                "preferences": []
              },
              {
                "name": "Italian Dressing",
                "allergens": [],
                "preferences": []
              }
            ]
          }
        }
        ...
      ]
    }
    
    Important Things to keep in mind:

    - I will need you to provide the data for the first week which should be be on the first PDF file. 

    - You will need to find what year the days are for because the PDF will not provide the year. A general rule is 
    that the days listed are for dates in the future so look for the next occurrence of the date listed and see if it 
    lands on our current year or the next year.

    - Please keep the days of the week and the cuisine names in lowercase.
    """
    self.logger.info("PDFGenAI initialized")
    self.logger.debug("PDFGenAI configuration", extra={"model": self.model, "system_prompt": self.system_prompt})

  @tracer.wrap(service="pdfgenai", name="extract_pdf")
  def extract_pdf(self, file_bytes: bytes):
    self.logger.debug("Extracting PDF", extra={"model": self.model, "system_prompt": self.system_prompt})

    try:
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
    except genai.errors.ClientError as e:
      self.logger.error(f"Error extracting PDF", extra={"error": e})
      return None

    text = response.text
    if text is None:
      err = "No data was extracted from the PDF"
      self.logger.error(err, extra={"error": err})
      return None

    self.logger.debug("PDF extracted", extra={"extracted_data": text})
    self.logger.info("PDF successfully extracted")

    return text