#!/usr/bin/env python3
"""
Free OCR Service using Tesseract
No API keys required. Run once to install dependencies:
pip install pytesseract pillow

Then make sure Tesseract is installed:
- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
- Mac: brew install tesseract
- Linux: sudo apt-get install tesseract-ocr
"""

import sys
import base64
import json
from io import BytesIO
from PIL import Image

try:
    import pytesseract
except ImportError:
    print(json.dumps({"error": "pytesseract not installed. Run: pip install pytesseract pillow"}))
    sys.exit(1)

def extract_text(base64_image: str) -> str:
    """Extract text from base64 encoded image using Tesseract"""
    try:
        # Decode base64
        image_data = base64.b64decode(base64_image)
        image = Image.open(BytesIO(image_data))
        
        # Extract text using Tesseract
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        return f"ERROR: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        base64_input = sys.argv[1]
        extracted = extract_text(base64_input)
        result = {"success": True, "text": extracted}
    else:
        result = {"success": False, "error": "No image provided"}
    
    print(json.dumps(result))
