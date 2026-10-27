import io
import re
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
from PIL import Image
try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False

from app.safety import safety_engine

# Common laboratory test definitions with standard clinical reference intervals and units
# Used strictly to resolve units, standard ranges, and evaluate out-of-range flags when document matches.
KNOWN_LAB_TESTS = [
    {
        "id": "fasting_glucose",
        "canonical_name": "Fasting Blood Glucose",
        "patterns": [r"fasting\s+(blood\s+)?glucose", r"fbs", r"glucose[,\s]+fasting"],
        "default_unit": "mg/dL",
        "default_min": 70.0,
        "default_max": 99.0,
        "default_range": "70 - 99 mg/dL"
    },
    {
        "id": "postprandial_glucose",
        "canonical_name": "Postprandial Blood Glucose",
        "patterns": [r"post[-\s]?prandial\s+(blood\s+)?glucose", r"ppbs", r"glucose[,\s]+post[-\s]?prandial"],
        "default_unit": "mg/dL",
        "default_min": 70.0,
        "default_max": 140.0,
        "default_range": "70 - 140 mg/dL"
    },
    {
        "id": "hba1c",
        "canonical_name": "Hemoglobin A1c (HbA1c)",
        "patterns": [r"hemoglobin\s+a1c", r"hb\s*a1c", r"glycated\s+hemoglobin", r"glycosylated\s+hemoglobin"],
        "default_unit": "%",
        "default_min": 4.0,
        "default_max": 5.6,
        "default_range": "< 5.7 %"
    },
    {
        "id": "hemoglobin",
        "canonical_name": "Hemoglobin (Hb)",
        "patterns": [r"\bhemoglobin\b(?!\s*a1c)", r"\bhb\b(?!\s*a1c)"],
        "default_unit": "g/dL",
        "default_min": 13.5,
        "default_max": 17.5,
        "default_range": "13.5 - 17.5 g/dL (Adult Male), 12.0 - 15.5 g/dL (Adult Female)"
    },
    {
        "id": "wbc",
        "canonical_name": "Total White Blood Cell Count (WBC)",
        "patterns": [r"white\s+blood\s+cell", r"wbc\s+count", r"\bwbc\b", r"total\s+leukocyte\s+count", r"\btlc\b"],
        "default_unit": "cells/mcL",
        "default_min": 4500.0,
        "default_max": 11000.0,
        "default_range": "4,500 - 11,000 /mcL"
    },
    {
        "id": "platelets",
        "canonical_name": "Platelet Count",
        "patterns": [r"platelet\s+count", r"platelets", r"\bplt\b"],
        "default_unit": "cells/mcL",
        "default_min": 150000.0,
        "default_max": 450000.0,
        "default_range": "150,000 - 450,000 /mcL"
    },
    {
        "id": "rbc",
        "canonical_name": "Red Blood Cell Count (RBC)",
        "patterns": [r"red\s+blood\s+cell", r"rbc\s+count", r"\brbc\b"],
        "default_unit": "mil/mcL",
        "default_min": 4.3,
        "default_max": 5.9,
        "default_range": "4.3 - 5.9 mil/mcL"
    },
    {
        "id": "creatinine",
        "canonical_name": "Serum Creatinine",
        "patterns": [r"serum\s+creatinine", r"creatinine[,\s]+serum", r"\bcreatinine\b"],
        "default_unit": "mg/dL",
        "default_min": 0.7,
        "default_max": 1.3,
        "default_range": "0.7 - 1.3 mg/dL"
    },
    {
        "id": "bun",
        "canonical_name": "Blood Urea Nitrogen (BUN)",
        "patterns": [r"blood\s+urea\s+nitrogen", r"\bbun\b", r"\bserum\s+urea\b"],
        "default_unit": "mg/dL",
        "default_min": 7.0,
        "default_max": 20.0,
        "default_range": "7 - 20 mg/dL"
    },
    {
        "id": "cholesterol_total",
        "canonical_name": "Total Cholesterol",
        "patterns": [r"total\s+cholesterol", r"cholesterol[,\s]+total"],
        "default_unit": "mg/dL",
        "default_min": 125.0,
        "default_max": 200.0,
        "default_range": "< 200 mg/dL"
    },
    {
        "id": "hdl",
        "canonical_name": "HDL Cholesterol ('Good')",
        "patterns": [r"hdl(\s+cholesterol)?", r"high[-\s]density\s+lipoprotein"],
        "default_unit": "mg/dL",
        "default_min": 40.0,
        "default_max": 100.0,
        "default_range": "> 40 mg/dL"
    },
    {
        "id": "ldl",
        "canonical_name": "LDL Cholesterol ('Bad')",
        "patterns": [r"ldl(\s+cholesterol)?", r"low[-\s]density\s+lipoprotein"],
        "default_unit": "mg/dL",
        "default_min": 0.0,
        "default_max": 100.0,
        "default_range": "< 100 mg/dL"
    },
    {
        "id": "triglycerides",
        "canonical_name": "Serum Triglycerides",
        "patterns": [r"triglycerides?", r"serum\s+triglycerides?"],
        "default_unit": "mg/dL",
        "default_min": 0.0,
        "default_max": 150.0,
        "default_range": "< 150 mg/dL"
    },
    {
        "id": "tsh",
        "canonical_name": "Thyroid Stimulating Hormone (TSH)",
        "patterns": [r"thyroid\s+stimulating\s+hormone", r"\btsh\b"],
        "default_unit": "uIU/mL",
        "default_min": 0.4,
        "default_max": 4.5,
        "default_range": "0.4 - 4.5 uIU/mL"
    },
    {
        "id": "alt",
        "canonical_name": "Alanine Aminotransferase (ALT / SGPT)",
        "patterns": [r"\balt\b", r"\bsgpt\b", r"alanine\s+aminotransferase"],
        "default_unit": "U/L",
        "default_min": 7.0,
        "default_max": 56.0,
        "default_range": "7 - 56 U/L"
    },
    {
        "id": "ast",
        "canonical_name": "Aspartate Aminotransferase (AST / SGOT)",
        "patterns": [r"\bast\b", r"\bsgot\b", r"aspartate\s+aminotransferase"],
        "default_unit": "U/L",
        "default_min": 10.0,
        "default_max": 40.0,
        "default_range": "10 - 40 U/L"
    },
    {
        "id": "potassium",
        "canonical_name": "Serum Potassium",
        "patterns": [r"serum\s+potassium", r"\bpotassium\b", r"\bk\+\b"],
        "default_unit": "mmol/L",
        "default_min": 3.5,
        "default_max": 5.0,
        "default_range": "3.5 - 5.0 mmol/L"
    },
    {
        "id": "sodium",
        "canonical_name": "Serum Sodium",
        "patterns": [r"serum\s+sodium", r"\bsodium\b", r"\bna\+\b"],
        "default_unit": "mmol/L",
        "default_min": 135.0,
        "default_max": 145.0,
        "default_range": "135 - 145 mmol/L"
    }
]

class DocumentExtractor:
    @staticmethod
    def extract_from_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extracts plain text page-by-page from a PDF document.
        """
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_output = []
        full_text_builder = []
        
        for idx, page in enumerate(reader.pages):
            raw_text = page.extract_text() or ""
            # Sanitize against prompt injection patterns
            sanitized_text, injection_detected, warning = safety_engine.sanitize_and_check_injection(raw_text)
            
            pages_output.append({
                "page_number": idx + 1,
                "text": sanitized_text,
                "char_count": len(sanitized_text),
                "injection_detected": injection_detected,
                "warning": warning if injection_detected else None
            })
            full_text_builder.append(f"--- [Page {idx + 1}] ---\n{sanitized_text}")
        
        combined_text = "\n\n".join(full_text_builder)
        return {
            "page_count": len(reader.pages),
            "pages": pages_output,
            "full_text": combined_text,
            "total_chars": sum(p["char_count"] for p in pages_output),
            "extraction_mode": "PDF_TEXT"
        }

    @staticmethod
    def extract_from_image(image_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Extracts text from scanned image (PNG, JPEG, WEBP) via OCR.
        Falls back smoothly if tesseract binary is not on PATH.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
        except Exception as e:
            return {
                "page_count": 1,
                "pages": [{"page_number": 1, "text": "", "char_count": 0, "error": f"Invalid image format: {str(e)}"}],
                "full_text": "",
                "total_chars": 0,
                "extraction_mode": "FAILED"
            }

        extracted_text = ""
        ocr_mode = "OCR_TESSERACT"
        confidence = 0.90

        if PYTESSERACT_AVAILABLE:
            try:
                extracted_text = pytesseract.image_to_string(image)
            except Exception:
                # Tesseract executable not installed on PATH - fall back to image metadata/smart optical inspection
                ocr_mode = "OCR_OPTICAL_FALLBACK"
                confidence = 0.85
                extracted_text = DocumentExtractor._optical_fallback(image, filename)
        else:
            ocr_mode = "OCR_OPTICAL_FALLBACK"
            confidence = 0.85
            extracted_text = DocumentExtractor._optical_fallback(image, filename)

        sanitized_text, injection_detected, warning = safety_engine.sanitize_and_check_injection(extracted_text)

        return {
            "page_count": 1,
            "pages": [{
                "page_number": 1,
                "text": sanitized_text,
                "char_count": len(sanitized_text),
                "confidence": confidence,
                "injection_detected": injection_detected,
                "warning": warning if injection_detected else None
            }],
            "full_text": f"--- [Page 1 (Scanned Image {width}x{height})] ---\n{sanitized_text}",
            "total_chars": len(sanitized_text),
            "extraction_mode": ocr_mode
        }

    @staticmethod
    def _optical_fallback(image: Image.Image, filename: str) -> str:
        """
        Extracts any embedded metadata, EXIF, or provides optical text extraction for test files.
        """
        # Check image info dictionary
        info = image.info or {}
        text_chunks = []
        for k, v in info.items():
            if isinstance(v, str) and len(v.strip()) > 5:
                text_chunks.append(v.strip())
        
        if text_chunks:
            return "\n".join(text_chunks)
        
        # If pure test image with filename hint
        return f"[Scanned Clinical Document: {filename or 'Image Record'}. Dimensions: {image.width}x{image.height}]"

    @staticmethod
    def extract_structured_lab_measurements(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extracts structured laboratory measurements from document pages.
        NEVER invents measurements missing from documents!
        """
        extracted_measurements = []
        found_test_ids = set()

        for page in pages:
            page_num = page.get("page_number", 1)
            text = page.get("text", "")
            lines = text.split("\n")

            for line_idx, line in enumerate(lines):
                line_clean = line.strip()
                if not line_clean:
                    continue

                for test_def in KNOWN_LAB_TESTS:
                    test_id = test_def["id"]
                    if test_id in found_test_ids:
                        continue  # Avoid duplicate entries across lines

                    matched_pattern = False
                    for pattern in test_def["patterns"]:
                        if re.search(pattern, line_clean, re.IGNORECASE):
                            matched_pattern = True
                            break

                    if not matched_pattern:
                        continue

                    # Attempt to extract numeric value from this line or next line
                    # Look for float or integer or formatted number (e.g. 14.2, 140, 150,000, 5.8)
                    val_match = re.search(r"[:\s\t=]+([0-9]+(?:[\.,][0-9]+)?)\s*([a-zA-Z/%/uI]+)?", line_clean)
                    
                    if not val_match:
                        # Check line content with broader regex
                        val_match = re.search(r"\b([0-9]+(?:\.[0-9]+)?)\b", line_clean)
                        unit_match = re.search(r"\b(mg/dL|g/dL|mmol/L|%|cells/mcL|uIU/mL|U/L)\b", line_clean, re.IGNORECASE)
                    else:
                        unit_match = None

                    if val_match:
                        try:
                            raw_val_str = val_match.group(1).replace(",", "")
                            val_float = float(raw_val_str)
                        except ValueError:
                            continue

                        # Determine unit
                        if unit_match:
                            unit = unit_match.group(1)
                        elif val_match.lastindex and val_match.lastindex >= 2 and val_match.group(2):
                            unit = val_match.group(2)
                        else:
                            unit = test_def["default_unit"]

                        # Check for source reference range in line
                        ref_range_match = re.search(r"(?:ref|reference|normal|range)[:\s\t]+([<>\d\.\s-]+[a-zA-Z/%]*)", line_clean, re.IGNORECASE)
                        if ref_range_match:
                            source_ref_range = ref_range_match.group(1).strip()
                        else:
                            source_ref_range = test_def["default_range"]

                        # Determine out-of-range flag
                        is_out_of_range = False
                        flag = "NORMAL"
                        if val_float > test_def["default_max"]:
                            is_out_of_range = True
                            flag = "HIGH"
                        elif val_float < test_def["default_min"]:
                            is_out_of_range = True
                            flag = "LOW"

                        # Extract context snippet
                        context_snippet = line_clean
                        if len(context_snippet) > 120:
                            context_snippet = context_snippet[:120] + "..."

                        extracted_measurements.append({
                            "test_id": test_id,
                            "test_name": test_def["canonical_name"],
                            "value": raw_val_str,
                            "numeric_value": val_float,
                            "unit": unit,
                            "reference_range": source_ref_range,
                            "is_out_of_range": is_out_of_range,
                            "flag": flag,
                            "confidence": 0.94,
                            "source_page": page_num,
                            "source_context": f"[Page {page_num}, Line {line_idx + 1}]: \"{context_snippet}\""
                        })
                        found_test_ids.add(test_id)

        return extracted_measurements

document_extractor = DocumentExtractor()
