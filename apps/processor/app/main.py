import os
from io import BytesIO
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from pypdf import PdfReader

app = FastAPI(title="ClassNest File Processor", version="0.1.0")
PROCESSOR_TOKEN = os.getenv("PROCESSOR_TOKEN", "")
MAX_BYTES = 20 * 1024 * 1024


@app.get("/health")
def health():
    return {"status": "ok", "service": "processor"}


@app.post("/process")
async def process_file(
    file: UploadFile = File(...), x_processor_token: str | None = Header(default=None)
):
    # Configure a long random PROCESSOR_TOKEN. Keep this service private in deployment.
    if PROCESSOR_TOKEN and x_processor_token != PROCESSOR_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid service token")
    content = await file.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit")
    name = (file.filename or "upload").lower()
    mime = file.content_type or "application/octet-stream"
    extracted = ""
    if name.endswith(".pdf") or mime == "application/pdf":
        try:
            reader = PdfReader(BytesIO(content))
            extracted = "\n\n".join(
                page.extract_text() or "" for page in reader.pages
            ).strip()
        except Exception as exc:
            raise HTTPException(status_code=422, detail="Could not read PDF") from exc
    elif name.endswith(".txt") or mime.startswith("text/"):
        extracted = content.decode("utf-8", errors="replace")
    elif mime.startswith("image/"):
        return {
            "filename": file.filename,
            "mime_type": mime,
            "status": "OCR_REQUIRED",
            "text": "",
            "message": "Image received. Add Tesseract OCR to enable image text extraction.",
        }
    else:
        raise HTTPException(
            status_code=415,
            detail="Supported formats: PDF, TXT, and images (OCR setup required)",
        )
    return {
        "filename": file.filename,
        "mime_type": mime,
        "status": "PROCESSED" if extracted else "NO_TEXT_FOUND",
        "text": extracted,
    }
