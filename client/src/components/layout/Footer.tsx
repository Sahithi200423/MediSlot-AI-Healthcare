import { Activity, Heart, Shield, Award, Mail, Phone, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white pt-16 pb-12 dark:border-slate-800 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-100 dark:border-slate-800">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Medi<span className="text-teal-600 dark:text-teal-400">Slot</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Smarter Appointments. Better Clinic Management. MediSlot modernizes clinical workflows with intelligent scheduling, verified practitioners, and AI-assisted healthcare administration.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-teal-600" /> HIPAA Compliant Architecture</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-sky-600" /> Verified Clinics</span>
            </div>
          </div>

          {/* Column 1: For Patients */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              For Patients
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/register" className="hover:text-teal-600 transition-colors">Find a Doctor</Link></li>
              <li><Link to="/register" className="hover:text-teal-600 transition-colors">Book Video or In-Clinic</Link></li>
              <li><Link to="/dashboard/patient" className="hover:text-teal-600 transition-colors">Patient Portal</Link></li>
              <li><Link to="/dashboard/patient" className="hover:text-teal-600 transition-colors">Medical Records</Link></li>
              <li><a href="#faq" className="hover:text-teal-600 transition-colors">Patient FAQs</a></li>
            </ul>
          </div>

          {/* Column 2: For Providers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              For Providers
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/dashboard/doctor" className="hover:text-teal-600 transition-colors">Doctor Workspace</Link></li>
              <li><Link to="/dashboard/clinic" className="hover:text-teal-600 transition-colors">Clinic Management</Link></li>
              <li><a href="#ai-features" className="hover:text-teal-600 transition-colors">No-Show Prediction ML</a></li>
              <li><a href="#ai-features" className="hover:text-teal-600 transition-colors">AI Summary Engine</a></li>
              <li><Link to="/register" className="hover:text-teal-600 transition-colors">Onboard Your Clinic</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact & Demo */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Connect
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>support@medislot.health</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>+1 (800) 555-SLOT</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Healthcare Tech Corridor</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} MediSlot Health, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Security</a>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for healthcare
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
