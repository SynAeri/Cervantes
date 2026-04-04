"""Utility for extracting text from uploaded rubric files (PDF, DOCX, TXT)."""

from fastapi import UploadFile, HTTPException

ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

MAX_FILE_SIZE_MB = 10


async def extract_text_from_upload(file: UploadFile) -> str:
    """Extract text content from an uploaded PDF, DOCX, or TXT file.

    Args:
        file: The uploaded file from a multipart form request.

    Returns:
        The extracted text as a string.

    Raises:
        HTTPException: If the file type is unsupported or parsing fails.
    """
    filename = file.filename or ""
    extension = _get_extension(filename)

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{extension}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB} MB.",
        )

    try:
        if extension == ".pdf":
            return _extract_from_pdf(content)
        elif extension == ".docx":
            return _extract_from_docx(content)
        else:
            return content.decode("utf-8", errors="replace")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text from file: {str(e)}",
        )


def _get_extension(filename: str) -> str:
    """Get lowercase file extension including the dot."""
    dot_idx = filename.rfind(".")
    if dot_idx == -1:
        return ""
    return filename[dot_idx:].lower()


def _extract_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2."""
    import io
    from PyPDF2 import PdfReader

    reader = PdfReader(io.BytesIO(content))
    pages_text = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages_text.append(text)

    if not pages_text:
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the PDF. It may be image-based.",
        )
    return "\n\n".join(pages_text)


def _extract_from_docx(content: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    import io
    from docx import Document

    doc = Document(io.BytesIO(content))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

    if not paragraphs:
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the DOCX file.",
        )
    return "\n\n".join(paragraphs)
