import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { PatientDashboard } from "@/pages/dashboards/PatientDashboard"
import { DoctorDashboard } from "@/pages/dashboards/DoctorDashboard"
import { ClinicAdminDashboard } from "@/pages/dashboards/ClinicAdminDashboard"
import { PlatformAdminDashboard } from "@/pages/dashboards/PlatformAdminDashboard"

export default function App() {
  return (
    <Router>
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        {/* Public Marketing & Discovery */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 4 Dedicated Dashboard Layouts */}
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/clinic" element={<ClinicAdminDashboard />} />
        <Route path="/dashboard/platform" element={<PlatformAdminDashboard />} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
