import type { DiscoveryDoctor } from '@/components/landing/DoctorDirectoryCard'

/**
 * Separate, explicitly labelled demo showcase profiles.
 *
 * SAFETY CONTRACT:
 * 1. These are illustrative department profiles only and are NOT real database records.
 * 2. They are NEVER verified, licensed, or claimed to be real clinicians.
 * 3. They are NEVER bookable and must never be submitted to booking APIs.
 * 4. They must NEVER merge with real database doctor records.
 */
export const DEMO_SHOWCASE_SPECIALISTS: DiscoveryDoctor[] = [
  {
    id: 'demo-specialist-general-medicine',
    name: 'Dr. Sarah Jenkins',
    specialty: 'General Medicine',
    clinic: 'Metropolitan Family Health Center',
    city: 'New York, NY',
    clinics: ['Metropolitan Family Health Center'],
    clinicDisplay: 'Metropolitan Family Health Center',
    affiliatedCount: 0,
    experience: 'Clinical Department Showcase',
    nextAvailable: 'Showcase only',
    fee: 100,
    avatar: null,
    initials: 'SJ',
    isVerified: false,
    isAccepting: false,
    isLive: false,
    isDemo: true,
  },
  {
    id: 'demo-specialist-neurology',
    name: 'Dr. Elena Rostova',
    specialty: 'Neurology',
    clinic: 'Metropolitan Neurology Institute',
    city: 'Boston, MA',
    clinics: ['Metropolitan Neurology Institute'],
    clinicDisplay: 'Metropolitan Neurology Institute',
    affiliatedCount: 0,
    experience: 'Clinical Department Showcase',
    nextAvailable: 'Showcase only',
    fee: 140,
    avatar: null,
    initials: 'ER',
    isVerified: false,
    isAccepting: false,
    isLive: false,
    isDemo: true,
  },
  {
    id: 'demo-specialist-pediatrics',
    name: 'Dr. David Sterling',
    specialty: 'Pediatrics',
    clinic: 'City Children\'s Health Pavilion',
    city: 'Chicago, IL',
    clinics: ['City Children\'s Health Pavilion'],
    clinicDisplay: 'City Children\'s Health Pavilion',
    affiliatedCount: 0,
    experience: 'Clinical Department Showcase',
    nextAvailable: 'Showcase only',
    fee: 110,
    avatar: null,
    initials: 'DS',
    isVerified: false,
    isAccepting: false,
    isLive: false,
    isDemo: true,
  },
  {
    id: 'demo-specialist-dermatology',
    name: 'Dr. Priya Sharma',
    specialty: 'Dermatology',
    clinic: 'Pacific Dermatology Care Center',
    city: 'San Francisco, CA',
    clinics: ['Pacific Dermatology Care Center'],
    clinicDisplay: 'Pacific Dermatology Care Center',
    affiliatedCount: 0,
    experience: 'Clinical Department Showcase',
    nextAvailable: 'Showcase only',
    fee: 125,
    avatar: null,
    initials: 'PS',
    isVerified: false,
    isAccepting: false,
    isLive: false,
    isDemo: true,
  },
  {
    id: 'demo-specialist-orthopedics',
    name: 'Dr. Karthik Venkatesh',
    specialty: 'Orthopedics',
    clinic: 'Garden City Orthopedic Pavilion',
    city: 'Denver, CO',
    clinics: ['Garden City Orthopedic Pavilion'],
    clinicDisplay: 'Garden City Orthopedic Pavilion',
    affiliatedCount: 0,
    experience: 'Clinical Department Showcase',
    nextAvailable: 'Showcase only',
    fee: 135,
    avatar: null,
    initials: 'KV',
    isVerified: false,
    isAccepting: false,
    isLive: false,
    isDemo: true,
  },
  {
    id: 'demo-specialist-ophthalmology',
    name: 'Dr. Deepika Iyer',
    specialty: 'Ophthalmology',
    clinic: 'Bayview Optical Surgery Pavilion',
    city: 'Seattle, WA',
    clinics: ['Bayview Optical Surgery Pavilion'],
    clinicDisplay: 'Bayview Optical Surgery Pavilion',
    affiliatedCount: 0,
    experience: 'Clinical Department Showcase',
    nextAvailable: 'Showcase only',
    fee: 115,
    avatar: null,
    initials: 'DI',
    isVerified: false,
    isAccepting: false,
    isLive: false,
    isDemo: true,
  },
  {
    id: 'demo-specialist-psychiatry',
    name: 'Dr. Sameer Bhatia',
    specialty: 'Psychiatry',
    clinic: 'Sahyadri Mental Wellness Institute',
    city: 'Austin, TX',
    clinics: ['Sahyadri Mental Wellness Institute'],
    clinicDisplay: 'Sahyadri Mental Wellness Institute',
    affiliatedCount: 0,
    experience: 'Clinical Department Showcase',
    nextAvailable: 'Showcase only',
    fee: 130,
    avatar: null,
    initials: 'SB',
    isVerified: false,
    isAccepting: false,
    isLive: false,
    isDemo: true,
  },
]

/**
 * Returns demo fallback profiles only when legitimate database doctors are insufficient.
 *
 * SAFETY INVARIANTS:
 * 1. Legitimate database doctors are strictly preserved and prioritized.
 * 2. If realDoctors.length >= targetMin, returns an empty array.
 * 3. Does not duplicate specialties already served by live doctors.
 */
export function getComplementaryDemoProfiles(
  realDoctors: DiscoveryDoctor[],
  targetMin = 4
): DiscoveryDoctor[] {
  if (realDoctors.length >= targetMin) {
    return []
  }

  const existingSpecialties = new Set(realDoctors.map((d) => d.specialty.toLowerCase().trim()))
  const neededCount = targetMin - realDoctors.length

  // Prefer demo profiles whose specialties are not already served by live doctors
  const unrepresentedDemos = DEMO_SHOWCASE_SPECIALISTS.filter(
    (demo) => !existingSpecialties.has(demo.specialty.toLowerCase().trim())
  )
  const remainingDemos = DEMO_SHOWCASE_SPECIALISTS.filter(
    (demo) => existingSpecialties.has(demo.specialty.toLowerCase().trim())
  )

  const candidatePool = [...unrepresentedDemos, ...remainingDemos]
  return candidatePool.slice(0, neededCount)
}

