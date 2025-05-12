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

    self.system_prompt = """
    As an OCR platform, your main task is to extract all the details from all pdf files. The structure of your 
    output needs to follow the following guidelines:

    The PDF file is a menu showing the food that will servered for a particular day. I just need you to focus on the 
    first PDF file. Once you have extracted the data, I will need to structured in the following JSON format:

    [
      {
        "day": "monday",
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
    
    Important Things to keep in mind:

    - The above example is for 1 day of the week, I will need you to provide the data for the entire week on the first 
    PDF file. 

    - You will need to find what year the days are for because the PDF will not provide the year. A general rule is 
    that the days listed are for dates in the future so look for the next occurrence of the date listed and see if it 
    lands on our current year or the next year.

    - Please keep the days of the week and the cuisine names in lowercase.
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

    text = response.text
    logger.debug("PDF extracted", extra={"model": self.model, "system_prompt": self.system_prompt, "extracted_data": text})

    return text


