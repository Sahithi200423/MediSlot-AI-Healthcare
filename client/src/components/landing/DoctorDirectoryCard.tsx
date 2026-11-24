import { memo } from 'react'
import { ShieldCheck, MapPin } from 'lucide-react'
import { formatINR } from '@/lib/currency'
import type { BookingPreviewDoctor } from '@/components/booking/InteractiveBookingModal'

export interface DiscoveryDoctor extends BookingPreviewDoctor {
  experience: string
  nextAvailable: string
  city?: string
  isAccepting: boolean
  clinics: string[]
  clinicDisplay: string
  affiliatedCount: number
  isDemo?: boolean
}

interface DoctorDirectoryCardProps {
  doctor: DiscoveryDoctor
  onSelect: (doctorId: string) => void
  onPrefetchBooking?: () => void
}

export const DoctorDirectoryCard = memo(function DoctorDirectoryCard({
  doctor,
  onSelect,
  onPrefetchBooking,
}: DoctorDirectoryCardProps) {
  const isDemo = Boolean(doctor.isDemo)

  return (
    <button
      type="button"
      onClick={() => onSelect(doctor.id)}
      onPointerEnter={isDemo ? undefined : onPrefetchBooking}
      onFocus={isDemo ? undefined : onPrefetchBooking}
      className="text-left bg-white rounded-2xl border border-[#e8e2d8] p-4 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-[#cb6440]/55 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      {doctor.avatar ? (
        <img
          src={doctor.avatar}
          alt={doctor.name}
          width="72"
          height="72"
          loading="lazy"
          decoding="async"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-[#ebe4da] shrink-0 group-hover:scale-[1.03] transition-transform duration-200"
        />
      ) : (
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-br from-[#4a6356]/15 to-[#cb6440]/12 border border-[#e8e2d8] text-[#4a6356] flex items-center justify-center font-editorial-serif text-2xl shrink-0 group-hover:scale-[1.03] transition-transform duration-200">
          {doctor.initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#1e1815] truncate group-hover:text-[#cb6440] transition-colors">
            {doctor.name}
          </h3>
          {doctor.isVerified ? (
            <span
              title="Verified Clinician"
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#4a6356] bg-[#4a6356]/10 px-1.5 py-0.5 rounded-full shrink-0"
            >
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          ) : isDemo ? (
            <span
              title="Simulated Department Profile"
              className="inline-flex items-center text-[10px] font-semibold text-[#8c7e77] bg-[#ede5d9] border border-[#dcd3c6] px-1.5 py-0.5 rounded-full shrink-0"
            >
              Demo profile
            </span>
          ) : null}
        </div>
        <p className="text-xs text-[#cb6440] font-medium truncate mt-0.5">
          {doctor.specialty}
        </p>
        <p className="text-[11px] text-[#6e6059] truncate mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#a28c7a] shrink-0" />
          <span className="truncate" title={doctor.clinics.join(' · ')}>
            {doctor.clinicDisplay}
            {doctor.city ? ` · ${doctor.city}` : ''}
          </span>
        </p>
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#f2ede4]">
          {isDemo ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8c7e77] truncate">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#c5a880]" />
              <span className="truncate">Not bookable · Department showcase</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4a6b5d] truncate">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  doctor.isAccepting ? 'bg-[#4a6b5d]' : 'bg-[#c5a880]'
                }`}
              />
              <span className="truncate">{doctor.nextAvailable}</span>
            </span>
          )}
          <span className="shrink-0 text-xs font-bold text-[#1e1815] bg-[#f5f1e9] px-2.5 py-0.5 rounded-full">
            {formatINR(doctor.fee)}
          </span>
        </div>
      </div>
    </button>
  )
})

