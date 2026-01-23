"""
File parser module for extracting text from PDF and DOCX files.
"""

import io
import re
from typing import Optional

from PyPDF2 import PdfReader
from docx import Document


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        file_bytes: PDF file content as bytes
        
    Returns:
        Extracted text as string
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        
        return "\n".join(text_parts)
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""


def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extract text content from a DOCX file.
    
    Args:
        file_bytes: DOCX file content as bytes
        
    Returns:
        Extracted text as string
    """
    try:
        docx_file = io.BytesIO(file_bytes)
        doc = Document(docx_file)
        
        text_parts = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)
        
        return "\n".join(text_parts)
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return ""


def extract_title(text: str) -> Optional[str]:
    """
    Extract the song title from text.
    The title is the first meaningful line (at least 3 characters, not just digits).
    
    Args:
        text: Full text content
        
    Returns:
        Extracted title or None if not found
    """
    if not text:
        return None
    
    lines = text.strip().split("\n")
    
    for line in lines:
        # Clean the line
        clean_line = line.strip()
        
        # Skip empty lines
        if not clean_line:
            continue
        
        # Skip lines that are just numbers (page numbers, etc.)
        if clean_line.isdigit():
            continue
        
        # Skip lines that are too short
        if len(clean_line) < 3:
            continue
        
        # Skip lines that look like metadata (common patterns)
        lower_line = clean_line.lower()
        skip_patterns = [
            "page", "сторінка", "стр.", "copyright", "©",
            "author", "автор", "music", "музика", "text", "текст",
            "arrangement", "аранжування", "arr.", "ар."
        ]
        if any(pattern in lower_line for pattern in skip_patterns):
            continue
        
        # This looks like a valid title
        return clean_line
    
    return None


def normalize_title(title: str) -> str:
    """
    Normalize a title for duplicate checking.
    Converts to lowercase, removes extra whitespace and punctuation.
    
    Args:
        title: Original title
        
    Returns:
        Normalized title
    """
    if not title:
        return ""
    
    # Convert to lowercase
    normalized = title.lower()
    
    # Remove common punctuation but keep Ukrainian/Russian letters
    normalized = re.sub(r'[^\w\s]', '', normalized, flags=re.UNICODE)
    
    # Normalize whitespace
    normalized = " ".join(normalized.split())
    
    return normalized


def get_file_type(filename: str) -> Optional[str]:
    """
    Determine file type from filename.
    
    Args:
        filename: Name of the file
        
    Returns:
        'pdf', 'docx', or None if unsupported
    """
    if not filename:
        return None
    
    lower_name = filename.lower()
    
    if lower_name.endswith(".pdf"):
        return "pdf"
    elif lower_name.endswith(".docx"):
        return "docx"
    elif lower_name.endswith(".doc"):
        return "doc"  # Old format, not supported but we can inform user
    
    return None


def parse_file(file_bytes: bytes, filename: str) -> tuple[Optional[str], Optional[str]]:
    """
    Parse a file and extract its title.
    
    Args:
        file_bytes: File content as bytes
        filename: Name of the file
        
    Returns:
        Tuple of (extracted_text, suggested_title)
    """
    file_type = get_file_type(filename)
    
    if file_type == "pdf":
        text = extract_text_from_pdf(file_bytes)
    elif file_type == "docx":
        text = extract_text_from_docx(file_bytes)
    else:
        return None, None
    
    title = extract_title(text)
    
    return text, title
