from typing import Union, Annotated
import os

from fastapi import FastAPI, File, Form, UploadFile

from pdf_genai import PDFGenAI

app = FastAPI()
API_KEY = os.environ.get("GEMINI_API_KEY")


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.post("/api/v1/process_pdf")
def process_pdf(
    file: Annotated[bytes, File()]
):
    pdf_gen = PDFGenAI(API_KEY)
    res = pdf_gen.extract_pdf(file)

    print(res)

    return {"message": "It worked!!"}


@app.post("/files/")
async def create_file(
    file: Annotated[bytes, File()],
    # fileb: Annotated[UploadFile, File()],
    # token: Annotated[str, Form()],
):
    return {
        "file_size": len(file),
        # "token": token,
        # "fileb_content_type": fileb.content_type,
    }