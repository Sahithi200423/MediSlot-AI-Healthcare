import type { Doctor } from '@/lib/api'

/**
 * Identifies confirmed automated test suite artifact accounts at the presentation layer.
 * Does not modify production database records.
 */
export function isSyntheticDoctorAccount(doc: Doctor): boolean {
  if (!doc) return false

  const email = (doc.profile?.email || '').trim().toLowerCase()
  if (email) {
    if (
      /^(p\d+_doc_|ai\.doc\.|sec\.doc[ab]\.|editorial\.doc\.|audit\.doc\.|doctor_\d{10,14}@|doctortest\.)/i.test(email) ||
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
 * Uses verified account credentials (email / profile id) when available,
 * falling back to doctor record ID.
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

type ClinicObj = {
  id: string
  name: string
  city: string
  state: string
  address: string
}

/**
 * Consolidates multi-clinic affiliations for verified doctor identities
 * while safely keeping distinct doctors separate.
 */
export function processDoctorDirectory(rawDoctors: Doctor[]): Doctor[] {
  if (!Array.isArray(rawDoctors)) return []

  const doctorMap = new Map<string, Doctor>()
  const affiliationsMap = new Map<string, Map<string, ClinicObj>>()

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
      affiliationsMap.set(identityKey, new Map<string, ClinicObj>())
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
