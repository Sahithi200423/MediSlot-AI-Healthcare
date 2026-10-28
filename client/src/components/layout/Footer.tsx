import { Link } from "react-router-dom"
import { Shield, Award, Stethoscope, Lock } from "lucide-react"
import { HospitalSpark } from "./HospitalTopline"

export function Footer() {
  return (
    <footer className="w-full border-t border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] text-[#542f28] dark:text-[#f5f1e9] pt-16 pb-10 px-6 sm:px-12 font-editorial-sans transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* Upper Hospital Standards & Trust Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-10 border-b border-[#dcd3c6] dark:border-[#362f2a] text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#4a6b5d]/10 flex items-center justify-center text-[#4a6b5d] dark:text-[#99aa77] shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#2a201e] dark:text-[#fbf9f5] uppercase tracking-wider text-[11px]">HIPAA Architecture</p>
              <p className="text-[11px] text-[#8b7566] dark:text-[#c4b5a8] mt-0.5">Encrypted health record storage & RLS isolation</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e17145]/10 flex items-center justify-center text-[#e17145] shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#2a201e] dark:text-[#fbf9f5] uppercase tracking-wider text-[11px]">Verified Faculty</p>
              <p className="text-[11px] text-[#8b7566] dark:text-[#c4b5a8] mt-0.5">State-licensed clinicians & accredited pavilions</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#4a6b5d]/10 flex items-center justify-center text-[#4a6b5d] dark:text-[#99aa77] shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#2a201e] dark:text-[#fbf9f5] uppercase tracking-wider text-[11px]">Physician Supervised</p>
              <p className="text-[11px] text-[#8b7566] dark:text-[#c4b5a8] mt-0.5">Clinical AI decision support with doctor sign-off</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#c5a880]/15 flex items-center justify-center text-[#c5a880] shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#2a201e] dark:text-[#fbf9f5] uppercase tracking-wider text-[11px]">Immutable Audit Trail</p>
              <p className="text-[11px] text-[#8b7566] dark:text-[#c4b5a8] mt-0.5">Cryptographic log of all patient record views</p>
            </div>
          </div>
        </div>

        {/* Middle Main: Soft Spot Editorial Arrangement */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pt-2">
          
          {/* Two-Line Editorial Manifesto */}
          <div className="max-w-md">
            <p className="font-editorial-serif text-3xl sm:text-4xl leading-[1.05] tracking-[-0.03em] text-[#2a201e] dark:text-[#fbf9f5] m-0">
              Modern medicine.<br />
              <em className="text-[#a17c63] dark:text-[#d8c29d] not-italic font-editorial-serif italic">Wide-open compassion.</em>
            </p>
            <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] mt-2 max-w-sm">
              Connecting patients with leading clinical specialists, automated queue management, and physician-supervised diagnostic intelligence.
            </p>
          </div>

          {/* Center Topic Navigation */}
          <div className="flex flex-wrap gap-8 text-xs font-editorial-sans tracking-wide">
            <a href="#specialties" className="hover:text-[#e17145] transition-colors">Verified Specialties</a>
            <a href="#doctors" className="hover:text-[#e17145] transition-colors">Clinical Faculty</a>
            <a href="#ai-features" className="hover:text-[#e17145] transition-colors">AI Safety & OCR</a>
            <Link to="/login" className="hover:text-[#e17145] transition-colors">Patient Health Vault</Link>
          </div>

          {/* Right: Exact SVG Social Platforms */}
          <div className="flex items-center gap-5 shrink-0" aria-label="Hospital social channels">
            <span role="img" aria-label="Instagram" className="opacity-75 hover:opacity-100 transition-opacity">
              <img src="/instagram.svg" alt="" width="18" height="18" className="dark:invert" />
            </span>
            <span role="img" aria-label="LinkedIn" className="opacity-75 hover:opacity-100 transition-opacity">
              <img src="/linkedin.svg" alt="" width="18" height="18" className="dark:invert" />
            </span>
            <span role="img" aria-label="TikTok" className="opacity-75 hover:opacity-100 transition-opacity">
              <img src="/tiktok.svg" alt="" width="18" height="18" className="dark:invert" />
            </span>
          </div>

        </div>

        {/* Bottom Fineprint Row */}
        <div className="pt-6 border-t border-[#dcd3c6] dark:border-[#362f2a] flex flex-col sm:flex-row items-center justify-between text-[10px] tracking-[1.1px] text-[#8b7566] dark:text-[#c4b5a8] gap-4">
          <span>© 2026 MEDISLOT HEALTHCARE PLATFORM</span>
          
          <span className="hidden md:inline-block uppercase tracking-[1.4px]">
            COMPASSIONATE MEDICINE. ALWAYS.
          </span>

          <span className="flex items-center gap-2">
            <span>HEALING WITH FEELING</span>
            <HospitalSpark className="w-3.5 h-3.5 text-[#e17145]" />
          </span>
        </div>

      </div>
    </footer>
  );
}
