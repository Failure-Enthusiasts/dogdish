from google import genai
from google.genai.models import types
from ddtrace.trace import tracer

from logger import logger

class PDFGenAI:
  @tracer.wrap(service="pdfgenai", name="init")
  def __init__(self,api_key: str, model:str = "gemini-2.0-flash"):
    logger.debug("Initializing PDFGenAI")

    self.AI_CLIENT =  genai.Client(api_key=api_key)
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
              "preference": "vegetarian"
            },
            {
              "name": "Moroccan Harissa & Preserved Lemon Lamb Stew served with Harissa Yogurt",
              "allergens": [
                "dairy"
              ],
              "preference": "vegetarian"
            },
            {
              "name": "Toasted Farroto, Asparagus, Tomato, Cucumber, Feta Cheese",
              "allergens": [
                "gluten",
                "dairy"
              ],
              "preference": "vegetarian"
            },
            {
              "name": "Ras al Hanout Sauteed Spring Green Beans",
              "allergens": [],
              "preference": "vegan"
            },
            {
              "name": "Kale Wild Rice with Lemon Agave Dressing",
              "allergens": [],
              "preference": "vegan"
            }
          ],
          "salad_bar": {
            "toppings": [
              {
                "name": "Baby Kale",
                "allergens": [],
                "preference": "vegetarian"
              },
              {
                "name": "Za’atar Spiced Chickpeas",
                "allergens": [],
                "preference": "vegetarian"
              },
              {
                "name": "Cherry Tomatoes",
                "allergens": [],
                "preference": "vegetarian"
              },
              {
                "name": "Sliced Hot House Cucumbers",
                "allergens": [],
                "preference": "vegetarian"
              },
              {
                "name": "Shaved Cello Carrot Coins",
                "allergens": [],
                "preference": "vegetarian"
              },
              {
                "name": "Turmeric Cauliflower",
                "allergens": [],
                "preference": "vegetarian"
              },
              {
                "name": "Tabbouleh",
                "allergens": [],
                "preference": "vegetarian"
              },
              {
                "name": "Goat Cheese",
                "allergens": [
                  "dairy"
                ],
                "preference": "vegetarian"
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
                "preference": ""
              },
              {
                "name": "Lemon-Dijon Vinaigrette",
                "allergens": [],
                "preference": ""
              },
              {
                "name": "Apple Cider Vinaigrette",
                "allergens": [],
                "preference": ""
              },
              {
                "name": "Italian Dressing",
                "allergens": [],
                "preference": ""
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
    logger.info("PDFGenAI initialized")
    logger.debug("PDFGenAI configuration", extra={"model": self.model, "system_prompt": self.system_prompt})

  @tracer.wrap(service="pdfgenai", name="extract_pdf")
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

    text = response.text
    if text is None:
      err = "No data was extracted from the PDF"
      logger.error(err, extra={"error": err})
      return None

    logger.debug("PDF extracted", extra={"extracted_data": text})
    logger.info("PDF successfully extracted")

    return text