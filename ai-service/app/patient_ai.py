from typing import List, Dict, Any
from app.safety import safety_engine, MANDATORY_PATIENT_DISCLAIMER

# Patient-friendly medical dictionary
PLAIN_ENGLISH_GLOSSARY = {
    "hba1c": {
        "term": "Hemoglobin A1c (HbA1c)",
        "simple_definition": "A blood test that shows your average blood sugar levels over the past 2 to 3 months.",
        "why_it_matters": "Sugar in your bloodstream sticks to red blood cells. Since red blood cells live for about 90 days, this test gives your doctor a steady picture of blood sugar rather than just a single moment.",
        "common_lifestyle_factors": "Balanced meals, physical activity, and prescribed medications help keep this in a healthy zone."
    },
    "creatinine": {
        "term": "Serum Creatinine",
        "simple_definition": "A natural waste product produced by your muscles during normal daily movement.",
        "why_it_matters": "Healthy kidneys filter creatinine out of your blood and remove it in urine. If kidneys are working more slowly, creatinine levels in blood can rise.",
        "common_lifestyle_factors": "Staying well hydrated, avoiding overuse of certain pain relievers (like NSAIDs), and monitoring blood pressure."
    },
    "dyslipidemia": {
        "term": "Dyslipidemia / High Cholesterol",
        "simple_definition": "An imbalance of fats (lipids), such as cholesterol or triglycerides, circulating in your bloodstream.",
        "why_it_matters": "Certain types of cholesterol (like LDL) can slowly build up on artery walls over time, making it harder for blood to flow smoothly.",
        "common_lifestyle_factors": "Eating heart-healthy fats, regular aerobic exercise, and avoiding smoking."
    },
    "tsh": {
        "term": "Thyroid Stimulating Hormone (TSH)",
        "simple_definition": "A chemical messenger sent from your brain to tell your thyroid gland how much energy-controlling hormone to make.",
        "why_it_matters": "When your thyroid is slow, the brain sends extra TSH to stimulate it. When the thyroid is overactive, TSH drops low.",
        "common_lifestyle_factors": "Adequate sleep, stress management, and proper dietary iodine."
    },
    "hypertension": {
        "term": "Hypertension (High Blood Pressure)",
        "simple_definition": "A condition where blood pushes against the walls of your blood vessels with more force than normal.",
        "why_it_matters": "Over time, constant high pressure can strain your heart, kidneys, and blood vessels.",
        "common_lifestyle_factors": "Limiting salt/sodium, regular walking or exercise, reducing stress, and heart-healthy eating."
    },
    "anemia": {
        "term": "Anemia (Low Hemoglobin)",
        "simple_definition": "When your blood doesn't have enough healthy red blood cells or hemoglobin to carry oxygen around your body.",
        "why_it_matters": "It can make you feel tired, dizzy, or short of breath because your body's tissues aren't receiving enough oxygen.",
        "common_lifestyle_factors": "Iron-rich foods (leafy greens, beans, lean meats), vitamin B12, and medical evaluation by your doctor."
    },
    "leukocytosis": {
        "term": "Leukocytosis (Elevated White Blood Cells)",
        "simple_definition": "A higher than normal number of white blood cells in your bloodstream.",
        "why_it_matters": "White blood cells are your body's immune defenders. They multiply when fighting an infection, reacting to inflammation, or responding to stress.",
        "common_lifestyle_factors": "Resting, recovering from recent colds, and discussing possible infections or allergies with your physician."
    },
    "thrombocytopenia": {
        "term": "Thrombocytopenia (Low Platelets)",
        "simple_definition": "A lower than normal count of platelets—the tiny cell fragments that help your blood clot when you have a cut.",
        "why_it_matters": "Low platelets can cause you to bruise more easily or bleed longer from small scrapes.",
        "common_lifestyle_factors": "Preventing trauma, avoiding unapproved blood-thinning supplements, and consulting your doctor."
    }
}

class PatientAiEngine:
    @staticmethod
    def explain_term(term: str) -> Dict[str, Any]:
        """
        Explains a complex medical term in simple 6th-grade language.
        """
        is_emergency, emergency_msg = safety_engine.check_emergency(term)
        if is_emergency:
            return {
                "term": term,
                "is_emergency": True,
                "explanation": emergency_msg,
                "disclaimer": MANDATORY_PATIENT_DISCLAIMER
            }

        sanitized_term, is_injection, warning = safety_engine.sanitize_and_check_injection(term)
        key = sanitized_term.strip().lower()

        # Check known dictionary
        matched_entry = None
        for dict_key, entry in PLAIN_ENGLISH_GLOSSARY.items():
            if dict_key in key or key in dict_key or key in entry["term"].lower():
                matched_entry = entry
                break

        if matched_entry:
            explanation = (
                f"### {matched_entry['term']}\n\n"
                f"**What it means:** {matched_entry['simple_definition']}\n\n"
                f"**Why doctors look at it:** {matched_entry['why_it_matters']}\n\n"
                f"**Healthy habits to discuss with your doctor:** {matched_entry['common_lifestyle_factors']}"
            )
        else:
            explanation = (
                f"### Understanding '{sanitized_term}'\n\n"
                f"In medical discussions, **{sanitized_term}** refers to a clinical observation or measurement. "
                "Medical terms often combine roots indicating the body part and a suffix describing whether it is higher, "
                "lower, or experiencing inflammation. "
                "Because lab measurements and medical terms have unique significance for each person, your doctor is the best person "
                "to explain what this specific result means for your overall health."
            )

        if warning:
            explanation = f"[{warning}]\n\n{explanation}"

        return {
            "term": sanitized_term,
            "is_emergency": False,
            "explanation": explanation,
            "disclaimer": MANDATORY_PATIENT_DISCLAIMER
        }

    @staticmethod
    def suggest_questions(report_category: str, abnormal_tests: List[str] = None) -> Dict[str, Any]:
        """
        Generates 3 to 5 clear, empowering questions for the patient to ask their doctor.
        """
        abnormal_tests = abnormal_tests or []
        questions = []

        if abnormal_tests:
            test_list_str = ", ".join(abnormal_tests[:3])
            questions.append(f"My lab report flagged {test_list_str} as outside the standard range. What might be causing these specific values for me?")
            questions.append(f"Could any medications, supplements, or recent meals have influenced these test results?")
            questions.append("Do you recommend we repeat these tests in a few weeks or months to see if the numbers change?")
        else:
            questions.append("Are there any specific lifestyle habits (nutrition, sleep, physical activity) that can help me keep these healthy numbers?")
            questions.append("When do you recommend I schedule my next routine screening or lab panel?")

        questions.append("Are there any warning signs or symptoms I should watch out for between now and my next visit?")
        questions.append("Is there anything else from this report that we should consider in light of my family medical history?")

        return {
            "category": report_category,
            "abnormal_tests": abnormal_tests,
            "suggested_questions": questions,
            "disclaimer": MANDATORY_PATIENT_DISCLAIMER
        }

patient_ai_engine = PatientAiEngine()
