from google import genai
from google.genai.models import types
from datetime import date


class PDFGenAI:
  def __init__(self, api_key: str):
    self.AI_CLIENT =  genai.Client(api_key=api_key)
    current_year = date.today().year
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

  def extract_pdf(self, file_bytes: bytes):
    response = self.AI_CLIENT.models.generate_content(
      model="gemini-2.0-flash",
      config=types.GenerateContentConfig(
        system_instruction=self.system_prompt),
        contents=[
          types.Part.from_bytes(
            data=file_bytes,
            mime_type='application/pdf',
          ),
        "process this pdf file accurately as per the instructions"]
    )

    return response.text
