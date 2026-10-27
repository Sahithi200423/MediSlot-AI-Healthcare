from typing import List, Dict, Any, Optional
import os
import re

from app.config import settings
from app.safety import safety_engine, MANDATORY_CLINICAL_DISCLAIMER

class ClinicalCopilot:
    @staticmethod
    def summarize_document(
        pages: List[Dict[str, Any]],
        measurements: List[Dict[str, Any]],
        document_category: str = "LAB_REPORT",
        filename: str = ""
    ) -> Dict[str, Any]:
        """
        Generates clinical summary and plain-language summary for an uploaded medical document.
        """
        abnormal_items = [m for m in measurements if m.get("is_out_of_range")]
        normal_items = [m for m in measurements if not m.get("is_out_of_range")]
        
        # Build structured findings
        findings_bullets = []
        citations = []
        for m in measurements:
            status_desc = f"{m['test_name']}: {m['value']} {m['unit']} ({m['flag']}, Ref: {m['reference_range']})"
            findings_bullets.append(status_desc)
            citations.append({
                "test_name": m["test_name"],
                "source_page": m["source_page"],
                "citation": m["source_context"]
            })

        # Generate summary text
        summary_lines = []
        summary_lines.append(f"### Document Analysis: {filename or 'Medical Record'}")
        summary_lines.append(f"**Category:** {document_category} | **Total Pages:** {len(pages)}")
        
        if abnormal_items:
            summary_lines.append("\n**⚠️ Out-of-Range Measurements Detected (Pending Clinician Evaluation):**")
            for m in abnormal_items:
                summary_lines.append(f"- **{m['test_name']}**: **{m['value']} {m['unit']}** [{m['flag']}] (Normal Range: {m['reference_range']}) — *{m['source_context']}*")
        
        if normal_items:
            summary_lines.append("\n**Measurements Within Standard Reference Ranges:**")
            for m in normal_items:
                summary_lines.append(f"- {m['test_name']}: {m['value']} {m['unit']} (Normal Range: {m['reference_range']}) — *{m['source_context']}*")

        if not measurements:
            summary_lines.append("\n**Document Content Overview:**")
            # Pull text excerpts from first 2 pages
            excerpt = " ".join([p.get("text", "")[:300] for p in pages[:2]]).strip()
            if excerpt:
                summary_lines.append(f"> \"{excerpt}...\"")
            else:
                summary_lines.append("Document processed. No discrete laboratory values matched automated recognition patterns.")

        plain_language_summary = ClinicalCopilot._generate_plain_language_summary(measurements, abnormal_items)

        return {
            "summary": "\n".join(summary_lines),
            "plain_language_summary": plain_language_summary,
            "total_measurements_extracted": len(measurements),
            "out_of_range_count": len(abnormal_items),
            "measurements": measurements,
            "citations": citations,
            "is_ai_draft": True,
            "disclaimer": MANDATORY_CLINICAL_DISCLAIMER
        }

    @staticmethod
    def _generate_plain_language_summary(measurements: List[Dict[str, Any]], abnormal_items: List[Dict[str, Any]]) -> str:
        if not measurements:
            return "This document has been saved to your health vault. Your doctor can review the full report during your appointment."
        
        if not abnormal_items:
            return (
                f"We reviewed {len(measurements)} laboratory measurement(s) from this report, and all extracted values appear "
                "within typical standard laboratory ranges. Please review this summary with your doctor to confirm your overall health plan."
            )
        
        abnormal_names = ", ".join([m["test_name"] for m in abnormal_items])
        return (
            f"This laboratory report contains {len(measurements)} extracted test(s). "
            f"Specifically, {len(abnormal_items)} measurement(s) ({abnormal_names}) appear outside the standard reference limits "
            "noted in the report. This does not mean you have a disease; many common factors can influence laboratory tests. "
            "Please bring these results to your physician for professional interpretation."
        )

    @staticmethod
    def generate_consultation_draft(
        patient_info: Dict[str, Any],
        appointment_reason: str,
        recent_documents: List[Dict[str, Any]],
        past_notes: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Prepares a structured SOAP consultation draft suggestion for the attending clinician.
        """
        past_notes = past_notes or []
        patient_name = patient_info.get("name", "Patient")
        age = patient_info.get("age", "Unknown")
        gender = patient_info.get("gender", "Unknown")

        # Compile objective lab values
        all_measurements = []
        for doc in recent_documents:
            all_measurements.extend(doc.get("measurements", []))

        abnormal_measurements = [m for m in all_measurements if m.get("is_out_of_range")]

        # Subjective draft
        s_draft = (
            f"Patient {patient_name} ({age}yo, {gender}) presents for scheduled consultation.\n"
            f"Primary Visit Reason: {appointment_reason or 'Routine follow-up / general checkup'}.\n"
            f"Reported Symptoms & Onset: Patient reports symptoms outlined above. Denies acute red-flag symptoms."
        )

        # Objective draft
        obj_lines = ["Vital Signs: To be measured upon clinical triage."]
        if all_measurements:
            obj_lines.append("\nRecent Laboratory Investigations on File:")
            for m in all_measurements:
                flag_str = f" [{m['flag']}]" if m.get("is_out_of_range") else ""
                obj_lines.append(f"- {m['test_name']}: {m['value']} {m['unit']}{flag_str} (Ref: {m['reference_range']})")
        else:
            obj_lines.append("\nLaboratory Investigations: No recent laboratory reports uploaded in current file.")

        o_draft = "\n".join(obj_lines)

        # Assessment draft
        a_lines = ["Clinical Impression & Differential Considerations (AI Suggestion):"]
        if abnormal_measurements:
            a_lines.append(f"1. Laboratory abnormalities noted on recent panel: {', '.join([m['test_name'] for m in abnormal_measurements])}.")
            a_lines.append(f"2. Evaluation for underlying metabolic/clinical etiology relating to primary complaint: {appointment_reason or 'General'}.")
        else:
            a_lines.append(f"1. Clinical evaluation of presentation: {appointment_reason or 'General consultation'}.")
            a_lines.append("2. Comprehensive physical examination and review of systems indicated.")
        a_draft = "\n".join(a_lines)

        # Plan draft
        p_lines = [
            "1. Diagnostic: Review confirmed laboratory trends with patient; consider repeat panel if clinically indicated.",
            "2. Therapeutic: Tailor pharmacological intervention following direct examination.",
            "3. Lifestyle & Patient Education: Counsel on hydration, diet, and symptom monitoring.",
            "4. Follow-up: Schedule review in 2-4 weeks or sooner if symptoms escalate."
        ]
        p_draft = "\n".join(p_lines)

        # Missing information check
        missing_info = []
        test_names = {m["test_id"] for m in all_measurements if "test_id" in m}
        
        if "fasting_glucose" not in test_names and "hba1c" not in test_names:
            missing_info.append("No recent glycemic markers (Fasting Glucose or HbA1c) found in uploaded records.")
        if "creatinine" not in test_names:
            missing_info.append("No baseline renal function panel (Serum Creatinine / BUN) on file.")
        if "cholesterol_total" not in test_names:
            missing_info.append("No lipid profile on record.")
        if not past_notes:
            missing_info.append("First consultation on MediSlot: no prior internal clinical history recorded.")

        return {
            "soap_draft": {
                "subjective": s_draft,
                "objective": o_draft,
                "assessment": a_draft,
                "plan": p_draft
            },
            "missing_information": missing_info,
            "abnormal_measurements_count": len(abnormal_measurements),
            "is_ai_draft": True,
            "disclaimer": MANDATORY_CLINICAL_DISCLAIMER
        }

    @staticmethod
    def answer_clinical_query(
        query: str,
        document_text: str,
        measurements: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Answers clinician questions strictly using authorized document context and citations.
        """
        # Safety checks
        is_emergency, emergency_msg = safety_engine.check_emergency(query)
        if is_emergency:
            return {
                "answer": emergency_msg,
                "is_emergency": True,
                "citations": [],
                "is_ai_draft": True,
                "disclaimer": MANDATORY_CLINICAL_DISCLAIMER
            }

        is_prescribe, prescribe_msg = safety_engine.check_autonomous_prescribing(query)
        if is_prescribe:
            return {
                "answer": prescribe_msg,
                "is_emergency": False,
                "citations": [],
                "is_ai_draft": True,
                "disclaimer": MANDATORY_CLINICAL_DISCLAIMER
            }

        query_clean, is_injection, warning = safety_engine.sanitize_and_check_injection(query)

        # Context search over document text and measurements
        matched_measurements = []
        citations = []
        query_words = set(re.findall(r"\w+", query_clean.lower()))

        for m in measurements:
            test_words = set(re.findall(r"\w+", m["test_name"].lower()))
            if query_words.intersection(test_words) or m.get("test_id", "") in query_clean.lower():
                matched_measurements.append(m)
                citations.append({
                    "source": m["source_context"],
                    "page": m["source_page"]
                })

        if matched_measurements:
            lines = [f"Based on the patient's authorized records, the following relevant measurement(s) were located:"]
            for m in matched_measurements:
                flag_text = f" ({m['flag']})" if m.get("is_out_of_range") else " (Normal)"
                lines.append(f"- **{m['test_name']}**: **{m['value']} {m['unit']}**{flag_text}. Reference range is {m['reference_range']}. Ref: {m['source_context']}.")
            answer = "\n".join(lines)
        else:
            # Check if query matches general words in text
            if any(w in document_text.lower() for w in query_words if len(w) > 4):
                answer = (
                    "The documents mention related terms, but no exact quantitative laboratory measurements match the query. "
                    "Please review the attached original PDF pages directly to verify contextual details."
                )
            else:
                answer = (
                    "The authorized patient documents do NOT contain information answering this query. "
                    "MediSlot Clinical AI adheres to strict groundedness and will never fabricate clinical data."
                )

        if warning:
            answer = f"[{warning}]\n\n{answer}"

        return {
            "query": query_clean,
            "answer": answer,
            "citations": citations,
            "is_emergency": False,
            "is_ai_draft": True,
            "disclaimer": MANDATORY_CLINICAL_DISCLAIMER
        }

clinical_copilot = ClinicalCopilot()
