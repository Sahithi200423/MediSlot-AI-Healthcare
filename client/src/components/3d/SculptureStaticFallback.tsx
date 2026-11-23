export function SculptureStaticFallback() {
  return (
    <div
      className="relative w-full h-full min-h-[340px] sm:min-h-[420px] lg:min-h-[480px] flex items-center justify-center isolation-isolate select-none pointer-events-none"
      role="img"
      aria-label="Artistic visual depiction of cellular vitality sculpture with pearl alabaster membrane and golden nucleus"
    >
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Soft grounding contact shadow */}
        <div className="absolute -bottom-4 w-52 h-14 bg-[#4b3014]/15 rounded-full blur-xl" />
        
        {/* Pearl-alabaster outer membrane folds */}
        <div className="absolute inset-0 rounded-[44%_56%_50%_50%/52%_48%_52%_48%] bg-gradient-to-tr from-[#ede4d8] via-[#faf7f2] to-[#f4ebe0] shadow-2xl border border-white/70 transform rotate-12" />
        <div className="absolute inset-3 rounded-[52%_48%_55%_45%/45%_55%_45%_55%] bg-gradient-to-br from-white/95 via-[#f8f4ed]/80 to-[#ecdcc8]/60 backdrop-blur-xs transform -rotate-6" />

        {/* Delicate champagne-gold orbital ring */}
        <div className="absolute inset-[-10%] rounded-full border-[1.5px] border-[#dfba76]/70 transform -rotate-25 scale-y-65 shadow-xs" />
        <div className="absolute top-[22%] -right-[6%] w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#f2cc81] to-[#b37c22] shadow-md" />
        <div className="absolute bottom-[20%] -left-[4%] w-4 h-4 rounded-full bg-gradient-to-br from-[#f2cc81] to-[#b37c22] shadow-md" />

        {/* Central liquid amber-gold nucleus */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#f4cd7b] via-[#d5952c] to-[#996016] shadow-xl border border-[#ffe4a0]/40 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 blur-md -translate-x-2 -translate-y-2" />
        </div>
      </div>
    </div>
  );
}

export default SculptureStaticFallback;

