import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Bot,
  HeartPulse,
  Stethoscope,
  Brain,
  Eye,
  Baby,
  Bone,
  Activity,
  FileText,
  Sparkles,
} from "lucide-react"
import { Footer } from "@/components/layout/Footer"
import {
  EDITORIAL_EASE,
  VIEWPORT_ONCE,
  cardRevealVariants,
  fadeUpVariants,
  staggerContainerVariants,
} from "@/lib/motion"

interface BelowTheFoldLandingProps {
  onOpenBooking: (docId?: string) => void
}

export default function BelowTheFoldLanding({ onOpenBooking }: BelowTheFoldLandingProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const specialties = [
    { name: "General Medicine", icon: Stethoscope, count: "128 Practitioners", desc: "Primary care, preventative wellness, and acute health management" },
    { name: "Cardiology", icon: HeartPulse, count: "45 Cardiologists", desc: "Cardiac evaluations, rhythm telemetry, and vascular prevention" },
    { name: "Neurology", icon: Brain, count: "32 Neurologists", desc: "Neuro-cognitive diagnostics, migraine care, and spinal health" },
    { name: "Pediatrics", icon: Baby, count: "54 Pediatricians", desc: "Newborn screenings, developmental milestones, and adolescent care" },
    { name: "Dermatology", icon: Sparkles, count: "39 Dermatologists", desc: "Clinical dermatology, skin barrier pathology, and biopsies" },
    { name: "Orthopedics", icon: Bone, count: "41 Specialists", desc: "Joint reconstruction, sports medicine, and bone density analysis" },
    { name: "Ophthalmology", icon: Eye, count: "29 Eye Surgeons", desc: "Corneal health, retinal assessments, and optical diagnostics" },
    { name: "Psychiatry", icon: Activity, count: "36 Clinicians", desc: "Behavioral health, neuro-psychological assessments, and therapy" },
  ]

  const faqs = [
    {
      q: "How does MediSlot prevent appointment double-booking?",
      a: "MediSlot uses an ACID-compliant transactional scheduling engine with database-level row locking. Once a patient selects an available slot, it is temporarily reserved for 10 minutes during checkout to guarantee that no two patients can claim the same time window."
    },
    {
      q: "How does the Physician-Supervised AI Copilot assist doctors?",
      a: "Uploaded diagnostic reports and patient histories are parsed by our OCR and clinical AI pipeline. The system extracts structured analyte ranges, highlights abnormal thresholds, and summarizes findings into concise SOAP drafts. All AI outputs require explicit physician review and attestation before clinical acceptance."
    },
    {
      q: "How can patients understand complex medical lab results?",
      a: "The Patient Health Vault includes an educational AI translation feature that converts high-complexity clinical metrics (like HbA1c, eGFR, Dyslipidemia) into 6th-grade simple English, with explanations of why doctors check them and lifestyle questions to ask at consultations."
    },
    {
      q: "How is patient medical data protected?",
      a: "Yes. MediSlot enforces strict multi-tenant boundaries using Supabase Row-Level Security (RLS), encrypted private object storage for diagnostics, and comprehensive audit logs recording every clinician access event."
    },
    {
      q: "Can hospital administrators manage multiple clinics and staff?",
      a: "Yes. Clinic administrators can invite practitioners, manage front desk receptionists, set individual consultation fees, configure custom clinic hours, approve doctor leaves, and view consolidated operational analytics."
    }
  ]

  return (
    <>
      {/* ========================================================= */}
      {/* 3. HOSPITAL CLINICAL DEPARTMENTS & SPECIALTIES */}
      {/* ========================================================= */}
      <section id="specialties" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] max-w-7xl mx-auto w-full scroll-mt-20">
        <div className="space-y-12">
          
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#e17145] font-bold">
              DEPARTMENTAL SPECIALTIES
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              Comprehensive Care Across Fields
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              Verified medical care supported by advanced clinical diagnostics and coordinated specialty referrals.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {specialties.map((spec, i) => {
              const Icon = spec.icon
              return (
                <motion.div
                  key={i}
                  variants={cardRevealVariants}
                  onClick={() => onOpenBooking()}
                  className="p-6 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] hover:border-[#4a6b5d] hover:bg-white dark:hover:bg-[#1a1613] hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-full border border-[#4a6b5d]/30 bg-[#4a6b5d]/10 flex items-center justify-center text-[#4a6b5d] dark:text-[#99aa77] mb-4 group-hover:scale-105 transition-transform duration-200">
                      <Icon className="w-5 h-5 text-[#e17145]" />
                    </div>
                    <h3 className="font-bold text-base text-[#2a201e] dark:text-[#fbf9f5] group-hover:text-[#4a6b5d] transition-colors">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] mt-2 leading-relaxed">
                      {spec.desc}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#4a6b5d] dark:text-[#99aa77] mt-4 inline-flex items-center gap-1">
                    <span>{spec.count}</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </motion.div>
              )
            })}
          </motion.div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. THREE-STEP APPOINTMENT BOOKING PROCESS */}
      {/* ========================================================= */}
      <section id="about" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#f5f1e9]/60 dark:bg-[#1a1714]/40 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#4a6b5d] dark:text-[#99aa77] font-bold">
              EFFORTLESS ACCESS
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              How MediSlot Works
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              A refined three-step booking experience ensuring immediate confirmation with zero double-booking.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={cardRevealVariants}
              className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4 hover:border-[#c5a880] hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                01
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Search & Select</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Filter verified doctors by specialty, medical facility, consultation fee, and patient ratings.
              </p>
            </motion.div>

            <motion.div
              variants={cardRevealVariants}
              className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4 hover:border-[#c5a880] hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                02
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Real-Time Slot Lock</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Select your preferred 30-minute consultation slot. Our transactional engine prevents double-booking with row-level locks.
              </p>
            </motion.div>

            <motion.div
              variants={cardRevealVariants}
              className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4 hover:border-[#c5a880] hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                03
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Attend & Access Care</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Receive instant notifications, upload diagnostic records for physician review, and download signed digital prescriptions.
              </p>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. CLINICAL AI COPILOT & PATIENT HEALTH VAULT */}
      {/* ========================================================= */}
      <section id="ai-features" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#141210] text-[#fbf9f5] scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4a6b5d]/30 text-[#99aa77] text-xs font-semibold border border-[#4a6b5d]/40">
              <Bot className="w-3.5 h-3.5" />
              <span>Physician-Supervised Healthcare Intelligence</span>
            </div>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#fbf9f5] tracking-[-0.02em]">
              AI Built to Assist Clinicians, Never Replace Them
            </h2>
            <p className="text-sm text-[#c4b5a8]">
              Automated document OCR, grounded laboratory extractions, and patient-friendly medical term explainers.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            
            {/* AI Document Extraction Card */}
            <motion.div
              variants={cardRevealVariants}
              className="rounded-2xl border border-[#362f2a] bg-[#1d1916] p-7 space-y-4 hover:border-[#4a6b5d]/70 transition-colors duration-200"
            >
              <div className="flex items-center justify-between border-b border-[#362f2a] pb-4">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#e17145]" />
                  <h3 className="font-bold text-base text-[#fbf9f5]">Clinical Lab Report Analyzer</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#4a6b5d]/30 text-[#99aa77] border border-[#4a6b5d]/40">
                  FastAPI OCR
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#141210] border border-[#362f2a] space-y-2.5 font-editorial-sans text-xs">
                <div className="flex items-center justify-between text-[#8b7566] text-[11px] pb-2 border-b border-[#2b2520]">
                  <span>Specimen: Metabolic_Blood_Count.pdf</span>
                  <span className="text-[#99aa77]">Processed in 1.2s</span>
                </div>
                <p className="text-[#e17145] font-semibold text-xs">🩺 Physician Decision Support Highlights:</p>
                <p className="text-[#c4b5a8]">• Fasting Glucose: 142 mg/dL (Reference: 70 - 99 mg/dL) — <span className="text-rose-400 font-semibold">[HIGH]</span></p>
                <p className="text-[#c4b5a8]">• Hemoglobin A1c: 6.7% (Reference: &lt; 5.7%) — <span className="text-rose-400 font-semibold">[HIGH]</span></p>
                <p className="text-[#c4b5a8]">• Serum Creatinine: 1.05 mg/dL (Normal renal filtration)</p>
              </div>

              <p className="text-xs text-[#8b7566]">
                Clinicians receive a verified, grounded diagnostic brief citing exact source pages before starting consultations.
              </p>
            </motion.div>

            {/* Patient AI Term Explainer Preview */}
            <motion.div
              variants={cardRevealVariants}
              className="rounded-2xl border border-[#362f2a] bg-[#1d1916] p-7 space-y-4 hover:border-[#c5a880]/60 transition-colors duration-200"
            >
              <div className="flex items-center justify-between border-b border-[#362f2a] pb-4">
                <div className="flex items-center gap-2.5">
                  <Brain className="w-5 h-5 text-[#c5a880]" />
                  <h3 className="font-bold text-base text-[#fbf9f5]">Patient Plain-Language Explainer</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#c5a880]/20 text-[#d8c29d] border border-[#c5a880]/30">
                  Patient Vault
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#141210] border border-[#362f2a] space-y-3 font-editorial-sans text-xs">
                <div className="flex items-center justify-between text-[#8b7566] text-[11px] pb-2 border-b border-[#2b2520]">
                  <span>Query: "What does Dyslipidemia mean?"</span>
                  <span className="text-[#c5a880]">6th-Grade Reading Level</span>
                </div>
                <p className="text-[#fbf9f5] leading-relaxed">
                  <strong>What it means:</strong> An imbalance of fats (like cholesterol) in your bloodstream.
                </p>
                <p className="text-[#c4b5a8] leading-relaxed">
                  <strong>Why doctors look at it:</strong> Certain fats can stick to blood vessel walls over time, making it harder for your heart to pump smoothly.
                </p>
              </div>

              <p className="text-xs text-[#8b7566]">
                Educates patients on laboratory metrics without jargon, empowering meaningful conversations with their physicians.
              </p>
            </motion.div>

          </motion.div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] max-w-4xl mx-auto w-full scroll-mt-20">
        <div className="space-y-10">
          
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center space-y-3"
          >
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#4a6b5d] dark:text-[#99aa77] font-bold">
              HOSPITAL FAQs
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              Details on appointment scheduling, medical data isolation, and clinical safety.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="space-y-4"
          >
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                variants={cardRevealVariants}
                className="rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] overflow-hidden hover:border-[#c5a880] transition-colors"
              >
                <button
                  type="button"
                  aria-expanded={openFaq === idx}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-semibold text-sm sm:text-base text-[#2a201e] dark:text-[#fbf9f5] hover:text-[#e17145] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#8b7566] transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-[#e17145]" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed border-t border-[#dcd3c6]/60 dark:border-[#362f2a] pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* Editorial Hospital Footer */}
      <Footer />
    </>
  )
}

