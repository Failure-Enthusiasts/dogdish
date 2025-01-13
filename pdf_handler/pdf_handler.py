from PyPDF2 import PdfReader
import json

# Path to the uploaded PDF file
pdf_path = 'test-two.pdf'  # Replace with the actual path to your PDF file

# Read the PDF content
reader = PdfReader(pdf_path)
pdf_text = ""
for page in reader.pages:
    pdf_text += page.extract_text()

print(pdf_text)
