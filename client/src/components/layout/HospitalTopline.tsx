export function HospitalSpark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2v28M2 16h28M6.1 6.1l19.8 19.8M6.1 25.9 25.9 6.1" stroke="currentColor" strokeWidth="3.2" />
    </svg>
  );
}

export function HospitalTopline() {
  return (
    <div className="w-full border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] text-[#2a201e] dark:text-[#f5f1e9] px-4 sm:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-editorial-sans">
        
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-2 font-bold tracking-tight text-sm text-[#2a201e] dark:text-[#fbf9f5]">
          <HospitalSpark className="text-[#e17145] transform rotate-12 w-4 h-4" />
          <span className="tracking-[-0.04em] text-base">
            medislot<span className="text-[#e17145]">.</span>
          </span>
          <span className="hidden md:inline-block text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#4a6b5d]/10 text-[#4a6b5d] dark:text-[#99aa77] font-semibold border border-[#4a6b5d]/20 ml-2">
            Hospital Pavilion
          </span>
        </div>

        {/* Center: Clinical Descriptor */}
        <div className="hidden lg:block text-[10px] uppercase tracking-[1.2px] text-[#8b7566] dark:text-[#c4b5a8] leading-tight text-center">
          <span>COMPASSIONATE MEDICINE.</span><br />
          <span>SUPERIOR HEALTHCARE OUTCOMES, TOGETHER.</span>
        </div>

        {/* Right: Availability Status Badge */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[1.4px] text-[#4a6b5d] dark:text-[#99aa77] font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7e8a59] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7e8a59]"></span>
          </span>
          <span>ACCEPTING NEW PATIENTS</span>
        </div>

      </div>
    </div>
  );
}
