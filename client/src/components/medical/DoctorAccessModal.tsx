import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShieldCheck, UserCheck, UserX, AlertCircle, Clock, Plus } from "lucide-react"
import { api, type Doctor, type DoctorRecordAccess } from "../../lib/api"

interface DoctorAccessModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DoctorAccessModal: React.FC<DoctorAccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [accessList, setAccessList] = useState<DoctorRecordAccess[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [expiresInDays, setExpiresInDays] = useState<number>(90)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    Promise.all([
      api.getDoctorAccessList(),
      api.getDoctors(),
    ])
      .then(([accessData, doctorsData]) => {
        setAccessList(accessData)
        setDoctors(doctorsData)
        if (doctorsData.length > 0) {
          setSelectedDoctorId(doctorsData[0].id)
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load doctor authorization settings")
      })
      .finally(() => setIsLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctorId) return

    try {
      setIsSubmitting(true)
      setError(null)
      await api.grantDoctorRecordAccess(selectedDoctorId, expiresInDays || undefined)
      setSuccessMsg("Doctor access granted successfully.")
      const updated = await api.getDoctorAccessList()
      setAccessList(updated)
    } catch (err: any) {
      setError(err.message || "Failed to grant doctor access")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = async (doctorId: string) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await api.revokeDoctorRecordAccess(doctorId)
      setSuccessMsg("Doctor access revoked. They can no longer view your medical history.")
      const updated = await api.getDoctorAccessList()
      setAccessList(updated)
    } catch (err: any) {
      setError(err.message || "Failed to revoke access")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Doctor Record Permissions</h3>
                <p className="text-xs text-slate-400">Explicitly control which physicians can view your clinical records</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs shrink-0">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Grant New Access Form */}
            <form onSubmit={handleGrant} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Grant Access to a Physician</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={isSubmitting || doctors.length === 0}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.profile.firstName} {doc.profile.lastName} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>6 Months</option>
                    <option value={365}>1 Year</option>
                    <option value={0}>Indefinite</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedDoctorId}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Authorize Medical Record Access</span>
              </button>
            </form>

            {/* Existing Permissions List */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Authorized Physicians ({accessList.filter((a) => !a.isRevoked).length})
              </h4>

              {isLoading ? (
                <div className="py-6 text-center text-xs text-slate-500">Loading authorized doctors...</div>
              ) : accessList.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  No individual doctor access grants configured.
                </p>
              ) : (
                <div className="space-y-2">
                  {accessList.map((access) => {
                    const isExpired = access.expiresAt && new Date(access.expiresAt).getTime() < Date.now()
                    const isActive = !access.isRevoked && !isExpired

                    return (
                      <div
                        key={access.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition ${
                          isActive
                            ? "bg-slate-900/60 border-slate-800"
                            : "bg-slate-950/40 border-slate-900 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white">
                              Dr. {access.doctor.profile.firstName} {access.doctor.profile.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {access.doctor.clinic?.name || "Independent Clinic"} •{" "}
                              {isActive ? (
                                <span className="text-emerald-400">
                                  {access.expiresAt ? `Expires ${new Date(access.expiresAt).toLocaleDateString()}` : "Ongoing access"}
                                </span>
                              ) : (
                                <span className="text-rose-400">
                                  {access.isRevoked ? "Access Revoked" : "Expired"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => handleRevoke(access.doctorId)}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 text-[11px] font-medium text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">REVOKED</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>Doctors assigned to an active consultation can view records relevant to that visit.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
