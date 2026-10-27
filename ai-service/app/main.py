import base64
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Header, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings
from app.safety import safety_engine, MANDATORY_CLINICAL_DISCLAIMER, MANDATORY_PATIENT_DISCLAIMER
from app.extractor import document_extractor
from app.copilot import clinical_copilot
from app.patient_ai import patient_ai_engine

app = FastAPI(
    title=settings.AI_SERVICE_NAME,
    version=settings.AI_SERVICE_VERSION,
    description="Physician-supervised Clinical AI Decision Support Microservice for MediSlot"
)

# Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_internal_secret(x_ai_service_secret: Optional[str] = Header(None)):
    """
    Enforces shared secret verification for internal service-to-service communication.
    """
    if not settings.AI_SERVICE_SECRET:
        return True
    if x_ai_service_secret != settings.AI_SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid internal AI service secret.")
    return True

# --- Pydantic Request / Response Schemas ---

class ExtractRequest(BaseModel):
    file_base64: str
    mime_type: str
    filename: Optional[str] = ""

class LabExtractionRequest(BaseModel):
    pages: List[Dict[str, Any]]

class SummarizeRequest(BaseModel):
    pages: List[Dict[str, Any]]
    measurements: Optional[List[Dict[str, Any]]] = []
    document_category: Optional[str] = "LAB_REPORT"
    filename: Optional[str] = ""

class ConsultationDraftRequest(BaseModel):
    patient_info: Dict[str, Any]
    appointment_reason: str
    recent_documents: Optional[List[Dict[str, Any]]] = []
    past_notes: Optional[List[Dict[str, Any]]] = []

class ClinicalQaRequest(BaseModel):
    query: str
    document_text: str
    measurements: Optional[List[Dict[str, Any]]] = []

class PatientExplainRequest(BaseModel):
    term: str

class PatientQuestionsRequest(BaseModel):
    report_category: str
    abnormal_tests: Optional[List[str]] = []

class SafetyCheckRequest(BaseModel):
    text: str

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.AI_SERVICE_NAME,
        "version": settings.AI_SERVICE_VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "timestamp": time.time()
    }

@app.post("/extract/document", dependencies=[Depends(verify_internal_secret)])
def extract_document(req: ExtractRequest):
    """
    Extracts text, pages, and metadata from PDF or image documents.
    """
    try:
        file_bytes = base64.b64decode(req.file_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {str(e)}")

    if req.mime_type == "application/pdf":
        result = document_extractor.extract_from_pdf(file_bytes)
    elif req.mime_type in ["image/png", "image/jpeg", "image/jpg", "image/webp"]:
        result = document_extractor.extract_from_image(file_bytes, req.filename or "")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported MIME type for extraction: {req.mime_type}")

    # Immediately also extract structured lab measurements
    measurements = document_extractor.extract_structured_lab_measurements(result["pages"])
    result["measurements"] = measurements
    result["measurements_count"] = len(measurements)
    result["abnormal_count"] = len([m for m in measurements if m.get("is_out_of_range")])
    return result

@app.post("/extract/lab-measurements", dependencies=[Depends(verify_internal_secret)])
def extract_lab_measurements(req: LabExtractionRequest):
    measurements = document_extractor.extract_structured_lab_measurements(req.pages)
    return {
        "measurements": measurements,
        "total_count": len(measurements),
        "abnormal_count": len([m for m in measurements if m.get("is_out_of_range")])
    }

@app.post("/summarize", dependencies=[Depends(verify_internal_secret)])
def summarize_document(req: SummarizeRequest):
    """
    Generates structured clinical and plain-language summary for an uploaded document.
    """
    measurements = req.measurements
    if not measurements:
        measurements = document_extractor.extract_structured_lab_measurements(req.pages)

    summary_result = clinical_copilot.summarize_document(
        pages=req.pages,
        measurements=measurements,
        document_category=req.document_category or "LAB_REPORT",
        filename=req.filename or ""
    )
    return summary_result

@app.post("/copilot/consultation-draft", dependencies=[Depends(verify_internal_secret)])
def generate_consultation_draft(req: ConsultationDraftRequest):
    """
    Generates a preliminary SOAP note draft and missing-data checklist for the physician.
    """
    return clinical_copilot.generate_consultation_draft(
        patient_info=req.patient_info,
        appointment_reason=req.appointment_reason,
        recent_documents=req.recent_documents or [],
        past_notes=req.past_notes or []
    )

@app.post("/copilot/qa", dependencies=[Depends(verify_internal_secret)])
def answer_clinical_query(req: ClinicalQaRequest):
    """
    Answers clinician questions strictly grounded in the authorized patient documents.
    """
    return clinical_copilot.answer_clinical_query(
        query=req.query,
        document_text=req.document_text,
        measurements=req.measurements or []
    )

@app.post("/patient/explain", dependencies=[Depends(verify_internal_secret)])
def explain_medical_term(req: PatientExplainRequest):
    """
    Explains complex medical terminology in plain, non-alarmist language.
    """
    return patient_ai_engine.explain_term(req.term)

@app.post("/patient/suggest-questions", dependencies=[Depends(verify_internal_secret)])
def suggest_patient_questions(req: PatientQuestionsRequest):
    """
    Provides empowered, respectful questions for patients to discuss with their physician.
    """
    return patient_ai_engine.suggest_questions(
        report_category=req.report_category,
        abnormal_tests=req.abnormal_tests or []
    )

@app.post("/safety/check", dependencies=[Depends(verify_internal_secret)])
def check_safety(req: SafetyCheckRequest):
    """
    Performs deterministic safety, emergency symptom, and injection screening.
    """
    is_emergency, emergency_msg = safety_engine.check_emergency(req.text)
    sanitized, is_injection, warning = safety_engine.sanitize_and_check_injection(req.text)
    is_prescribe, prescribe_msg = safety_engine.check_autonomous_prescribing(req.text)

    return {
        "is_emergency": is_emergency,
        "emergency_message": emergency_msg,
        "is_injection": is_injection,
        "injection_warning": warning,
        "is_prescribing_blocked": is_prescribe,
        "prescribing_block_message": prescribe_msg,
        "sanitized_text": sanitized
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
