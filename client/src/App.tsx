import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { PatientDashboard } from "@/pages/dashboards/PatientDashboard"
import { DoctorDashboard } from "@/pages/dashboards/DoctorDashboard"
import { ClinicAdminDashboard } from "@/pages/dashboards/ClinicAdminDashboard"
import { PlatformAdminDashboard } from "@/pages/dashboards/PlatformAdminDashboard"

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster richColors position="top-right" closeButton />
          <Routes>
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
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
