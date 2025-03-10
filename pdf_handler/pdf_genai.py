from google import genai
from google.genai.models import types
import pathlib
import httpx


# doc_url = "./test-menu.pdf"  # Replace with the actual URL of your PDF

# Retrieve and encode the PDF byte
filepath = pathlib.Path('./test-menu.pdf')
# filepath.write_bytes(httpx.get(doc_url).content)

client = genai.Client(api_key="your api key")
sys_instruct = """
As an OCR platform, your main task is to extract all the details from all pdf files. The structure of your output needs to follow the following example:
`Title: Edamame Slaw`
`Description: Cabbage slaw with edamame with cilantro, scallions, carrots, sesame lime vinaigrette, and sesame seeds.`
`Preferences: VEGAN, GLUTEN FREE`
`Allergens: Cilantro, Onions, Sesame, Soy`

If any of these sections are empty on the PDF, always include them in the output but leave them as an empty string for the description and empty array for the rest.
Please make it a json object.
"""
response = client.models.generate_content(
    model="gemini-2.0-flash",
    config=types.GenerateContentConfig(
        system_instruction=sys_instruct),
         contents=[
      types.Part.from_bytes(
        data=filepath.read_bytes(),
        mime_type='application/pdf',
      ),
      "process this pdf file accurately as per the instructions"]

)
print(response.text)