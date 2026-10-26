import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth, type UserRole } from "@/context/AuthContext"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { toast } from "sonner"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" text="Verifying MediSlot security credentials..." />
      </div>
    )
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error("Access Restricted", {
      description: `Your account role (${user.role}) is not authorized for this dashboard.`,
    })

    // Redirect to their appropriate home dashboard
    const roleRoutes: Record<UserRole, string> = {
      PATIENT: "/dashboard/patient",
      DOCTOR: "/dashboard/doctor",
      CLINIC_ADMIN: "/dashboard/clinic",
      PLATFORM_ADMIN: "/dashboard/platform",
    }

    return <Navigate to={roleRoutes[user.role]} replace />
  }

  return <>{children}</>
}
