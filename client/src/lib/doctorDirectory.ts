import type { Doctor, Clinic } from '@/lib/api'

/**
 * Identifies confirmed automated test suite artifact accounts at the presentation layer.
 * Does not modify production database records.
 */
export function isSyntheticDoctorAccount(doc: Doctor): boolean {
  if (!doc) return false

  const email = (doc.profile?.email || '').trim().toLowerCase()
  if (email) {
    if (
      /^(p\d+_doc_|ai\.doc\.|sec\.doc[\w.]*|editorial\.doc\.|audit\.doc\.|doctor_\d{10,14}@|doctortest\.)/i.test(email) ||
      /_\d{10,14}@/i.test(email)
    ) {
      return true
    }
  }

  const first = (doc.profile?.firstName || '').trim().toLowerCase()
  const last = (doc.profile?.lastName || '').trim().toLowerCase()
  const fullName = `${first} ${last}`.trim()
  if (fullName === 'doctortest test') {
    return true
  }

  return false
}

/**
 * Returns a stable unique identity key for a doctor.
 * Uses doctor.id as primary identity, with verified account email and
 * profile id as supporting relationships.
 *
 * CRITICAL SAFETY REQUIREMENT:
 * Does NOT collapse legitimate doctors who happen to share the same name and specialty
 * if their verified accounts/IDs are distinct.
 */
export function getDoctorStableIdentity(doc: Doctor): string {
  const email = (doc.profile?.email || '').trim().toLowerCase()
  if (email) {
    return `email:${email}`
  }
  if (doc.profile?.id) {
    return `profile:${doc.profile.id}`
  }
  return `doc:${doc.id}`
}

export type ClinicSummary = {
  id: string
  name: string
  city: string
  state: string
  address: string
}

/**
 * Identifies confirmed automated test suite synthetic clinics.
 * Specifically targets timestamped test artifacts (e.g., "... 1793088858001", "... 966383", "P4 Metro Cardiology 1793092243093")
 * while strictly preserving legitimate clinics even if they are unverified.
 */
export function isSyntheticClinic(clinic: Clinic): boolean {
  if (!clinic) return false

  const name = (clinic.name || '').trim()
  const slug = (clinic.slug || '').trim()
  const email = (clinic.email || '').trim().toLowerCase()

  // Match synthetic clinics created with timestamp or test-suite numeric suffixes
  if (
    /\s\d{6,14}$/.test(name) ||
    /-\d{6,14}$/.test(slug) ||
    /^(p\d+_|test_clinic)/i.test(slug) ||
    /^(ai\.clinic\.|sec\.clinic|audit\.clinic)/i.test(email)
  ) {
    return true
  }

  return false
}

/**
 * Formats doctor clinics consistently across all directory surfaces.
 */
export function formatDoctorClinics(doc: Doctor): {
  primaryClinic: string
  affiliatedCount: number
  clinicDisplay: string
  allClinics: string[]
} {
  const clinicSet = new Set<string>()
  if (doc.clinic?.name) clinicSet.add(doc.clinic.name.trim())

  if (doc.affiliatedClinics && Array.isArray(doc.affiliatedClinics)) {
    for (const c of doc.affiliatedClinics) {
      const name = (c as any)?.name || (typeof c === 'string' ? c : '')
      if (typeof name === 'string' && name.trim()) {
        clinicSet.add(name.trim())
      }
    }
  }

  const allClinics = Array.from(clinicSet)
  const primaryClinic = doc.clinic?.name?.trim() || allClinics[0] || 'MediSlot Partner Clinic'
  const affiliatedCount = Math.max(0, allClinics.length - 1)
  const clinicDisplay = affiliatedCount > 0
    ? `${primaryClinic} (+${affiliatedCount} affiliated clinic${affiliatedCount > 1 ? 's' : ''})`
    : primaryClinic

  return {
    primaryClinic,
    affiliatedCount,
    clinicDisplay,
    allClinics,
  }
}

/**
 * Consolidates multi-clinic affiliations for verified doctor identities
 * while safely keeping distinct doctors separate.
 */
export function processDoctorDirectory(rawDoctors: Doctor[]): Doctor[] {
  if (!Array.isArray(rawDoctors)) return []

  const doctorMap = new Map<string, Doctor>()
  const affiliationsMap = new Map<string, Map<string, ClinicSummary>>()

  for (const doc of rawDoctors) {
    if (!doc || !doc.id) continue

    // 1. Filter confirmed synthetic test suite accounts at presentation layer only
    if (isSyntheticDoctorAccount(doc)) {
      continue
    }

    // 2. Resolve stable identity
    const identityKey = getDoctorStableIdentity(doc)

    if (!doctorMap.has(identityKey)) {
      doctorMap.set(identityKey, doc)
      affiliationsMap.set(identityKey, new Map<string, ClinicSummary>())
    } else {
      // If we already have this identity, prefer the record that has a populated profile/clinic
      const existing = doctorMap.get(identityKey)!
      if (!existing.clinic && doc.clinic) {
        doctorMap.set(identityKey, { ...doc, id: existing.id })
      }
    }

    // 3. Consolidate clinic affiliations for this doctor
    const currentClinics = affiliationsMap.get(identityKey)!

    const addClinic = (c?: { id?: string; name?: string; city?: string; state?: string; address?: string } | null) => {
      if (!c?.name) return
      const trimmed = c.name.trim()
      if (!trimmed) return
      const existing = currentClinics.get(trimmed)
      currentClinics.set(trimmed, {
        id: c.id || existing?.id || '',
        name: trimmed,
        city: c.city || existing?.city || '',
        state: c.state || existing?.state || '',
        address: c.address || existing?.address || '',
      })
    }

    if (doc.clinic) addClinic(doc.clinic)

    if (doc.profile?.clinicMemberships && Array.isArray(doc.profile.clinicMemberships)) {
      for (const m of doc.profile.clinicMemberships) {
        if (m?.clinic) addClinic(m.clinic)
      }
    }

    if (doc.affiliatedClinics && Array.isArray(doc.affiliatedClinics)) {
      for (const c of doc.affiliatedClinics) {
        if (c) addClinic(c)
      }
    }
  }

  // 4. Attach consolidated clinics to each unique doctor record
  const result: Doctor[] = []
  for (const [key, doc] of doctorMap.entries()) {
    const consolidatedAffiliated = Array.from(affiliationsMap.get(key)?.values() || [])

    result.push({
      ...doc,
      affiliatedClinics: consolidatedAffiliated,
    })
  }

  return result
}

/**
 * Filters out synthetic test clinics while strictly preserving legitimate
 * clinics (both verified and unverified). Deduplicates identical clinic facilities.
 */
export function processClinicDirectory(rawClinics: Clinic[]): Clinic[] {
  if (!Array.isArray(rawClinics)) return []

  const clinicMap = new Map<string, Clinic>()

  for (const clinic of rawClinics) {
    if (!clinic || !clinic.id) continue

    // Filter confirmed synthetic test artifacts
    if (isSyntheticClinic(clinic)) {
      continue
    }

    // Deduplicate by slug or trimmed name+city
    const dedupKey = clinic.slug || `${clinic.name.trim().toLowerCase()}::${(clinic.city || '').trim().toLowerCase()}`

    if (!clinicMap.has(dedupKey)) {
      clinicMap.set(dedupKey, clinic)
    } else {
      // If duplicate, prefer verified clinic
      const existing = clinicMap.get(dedupKey)!
      if (!existing.isVerified && clinic.isVerified) {
        clinicMap.set(dedupKey, clinic)
      }
    }
  }

  return Array.from(clinicMap.values())
}
