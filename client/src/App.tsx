import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { MotionConfig, motion } from "framer-motion"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { LandingPage } from "@/pages/LandingPage"
import { EDITORIAL_EASE } from "@/lib/motion"

// Lazy-loaded route components for optimized bundle performance
const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage").then(m => ({ default: m.RegisterPage })))
const PatientDashboard = lazy(() => import("@/pages/dashboards/PatientDashboard").then(m => ({ default: m.PatientDashboard })))
const DoctorDashboard = lazy(() => import("@/pages/dashboards/DoctorDashboard").then(m => ({ default: m.DoctorDashboard })))
const ClinicAdminDashboard = lazy(() => import("@/pages/dashboards/ClinicAdminDashboard").then(m => ({ default: m.ClinicAdminDashboard })))
const PlatformAdminDashboard = lazy(() => import("@/pages/dashboards/PlatformAdminDashboard").then(m => ({ default: m.PlatformAdminDashboard })))

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#141210] flex flex-col items-center justify-center p-6 text-[#1e1815] dark:text-[#fbf9f5] font-editorial-sans">
      <div className="w-10 h-10 rounded-full border-2 border-[#cb6440] border-t-transparent animate-spin mb-4" />
      <span className="text-xs uppercase tracking-widest text-[#8c7e77] dark:text-[#c4b5a8]">Loading MediSlot Portal...</span>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
    >
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes location={location}>
          {/* Public Marketing & Discovery */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 4 Dedicated Dashboard Layouts - Protected with Server-Verified RBAC */}
          <Route
            path="/dashboard/patient"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/doctor"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clinic"
            element={
              <ProtectedRoute allowedRoles={["CLINIC_ADMIN"]}>
                <ClinicAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/platform"
            element={
              <ProtectedRoute allowedRoles={["PLATFORM_ADMIN"]}>
                <PlatformAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </motion.div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Toaster
              richColors
              position="top-right"
              closeButton
              toastOptions={{
                style: {
                  fontFamily: "var(--font-editorial-body)",
                  borderRadius: "1rem",
                  border: "1px solid #e8e2d8",
                },
              }}
            />
            <AppRoutes />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </MotionConfig>
  )
}
