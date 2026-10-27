import re
from typing import Dict, Any, List, Tuple

MANDATORY_CLINICAL_DISCLAIMER = (
    "AI-Generated Clinical Decision Support Draft. Not a licensed physician, independent diagnosis, "
    "or autonomous treatment directive. Must be reviewed, verified, and approved by a licensed healthcare provider."
)

MANDATORY_PATIENT_DISCLAIMER = (
    "MediSlot AI Assistant provides general educational information and plain-language summaries only. "
    "It is not a doctor and cannot diagnose medical conditions, recommend drug dosages, or provide treatment. "
    "Always discuss your medical results and symptoms directly with your licensed doctor or healthcare provider."
)

# High-risk acute emergency symptoms that require immediate 911 / emergency room care
EMERGENCY_PATTERNS = [
    r"\b(chest\s+pain|crushing\s+(chest\s+)?pressure|radiating\s+pain\s+(to\s+)?(left\s+arm|jaw|neck))\b",
    r"\b(slurred\s+speech|facial\s+droop(ing)?|sudden\s+weakness\s+(in\s+)?(arm|leg|side))\b",
    r"\b(cannot\s+breathe|severe\s+shortness\s+of\s+breath|choking|asphyxi|gasping\s+for\s+air)\b",
    r"\b(anaphyla|throat\s+swelling|lips?\s+swelling\s+after\s+(peanut|sting|medication|food))\b",
    r"\b(suicid(e|al)|kill\s+myself|end\s+my\s+life|self[-\s]harm)\b",
    r"\b(massive\s+bleed(ing)?|uncontrollable\s+bleed(ing)?|coughing\s+up\s+large\s+amounts\s+of\s+blood)\b",
    r"\b(unconscious|unresponsive|collapsed|sudden\s+loss\s+of\s+consciousness)\b",
]

# Prompt-injection / jailbreak patterns
INJECTION_PATTERNS = [
    r"\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts)\b",
    r"\b(system\s+prompt|reveal\s+system\s+prompt|disregard\s+system\s+instructions)\b",
    r"\b(you\s+are\s+now|act\s+as)\s+(DAN|unrestricted|jailbroken|evil|an\s+unlicensed\s+doctor)\b",
    r"\b(bypass\s+(safety|guardrails?|filter)|jailbreak)\b",
    r"\b(simulate\s+a\s+doctor\s+prescribing\s+controlled\s+substances?)\b",
    r"<\s*script\b",
    r"\{\{.*\}\}",  # Template injection
    r"\bUNION\s+SELECT\b",  # SQL injection
    r"\brm\s+-rf\b|;\s*cat\s+/etc/passwd",  # Command injection
]

# Autonomous prescribing / dosing patterns that must be blocked
AUTONOMOUS_PRESCRIBE_PATTERNS = [
    r"\b(prescribe\s+(me|patient)|give\s+(me|patient)\s+a\s+prescription\s+for)\b",
    r"\b(tell\s+me\s+the\s+exact\s+dose\s+of\s+(insulin|morphine|fentanyl|adderall|xanax|oxycodone|warfarin))\b",
    r"\b(calculate\s+my\s+(lethal|maximum)\s+dose)\b",
]

class SafetyEngine:
    @staticmethod
    def check_emergency(text: str) -> Tuple[bool, str]:
        """
        Deterministic check for life-threatening acute symptoms.
        Returns (is_emergency, emergency_message).
        """
        if not text:
            return False, ""
        
        lowered = text.lower()
        for pattern in EMERGENCY_PATTERNS:
            if re.search(pattern, lowered, re.IGNORECASE):
                return True, (
                    "CRITICAL MEDICAL EMERGENCY DETECTED: The symptoms or query describe a potentially "
                    "life-threatening emergency. Please IMMEDIATELY call local emergency services (e.g., 911, 112, 999) "
                    "or proceed to the nearest emergency room. MediSlot AI does not provide emergency intervention."
                )
        return False, ""

    @staticmethod
    def sanitize_and_check_injection(text: str) -> Tuple[str, bool, str]:
        """
        Scans for prompt injection / jailbreak patterns.
        Returns (sanitized_text, is_injection_detected, warning_message).
        """
        if not text:
            return "", False, ""
        
        is_detected = False
        warning = ""
        sanitized = text
        
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, sanitized, re.IGNORECASE):
                is_detected = True
                warning = "Security Warning: Adversarial prompt-injection pattern detected and neutralized."
                # Neutralize matched substring
                sanitized = re.sub(pattern, "[FILTERED_ADVERSARIAL_INSTRUCTION]", sanitized, flags=re.IGNORECASE)
        
        return sanitized, is_detected, warning

    @staticmethod
    def check_autonomous_prescribing(text: str) -> Tuple[bool, str]:
        """
        Blocks requests for autonomous drug prescription or lethal/dangerous dosage calculations.
        """
        if not text:
            return False, ""
        
        lowered = text.lower()
        for pattern in AUTONOMOUS_PRESCRIBE_PATTERNS:
            if re.search(pattern, lowered, re.IGNORECASE):
                return True, (
                    "Autonomous prescribing and personalized drug dosing calculations are strictly blocked. "
                    "Only a licensed physician who has directly examined the patient can calculate and authorize medication prescriptions."
                )
        return False, ""

    @staticmethod
    def redact_phi_for_logging(text: str) -> str:
        """
        Redacts highly sensitive identifiers from server application logs.
        """
        if not text:
            return ""
        # Redact SSN
        text = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED_SSN]", text)
        # Redact credit cards
        text = re.sub(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", "[REDACTED_CC]", text)
        # Truncate if exceptionally long
        if len(text) > 200:
            return text[:200] + "... [TRUNCATED_LOG]"
        return text

safety_engine = SafetyEngine()
