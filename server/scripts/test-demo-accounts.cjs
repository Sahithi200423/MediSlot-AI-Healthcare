const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const presets = [
  { role: 'PATIENT', email: 'patient@demo.medislot.com', password: 'Password123!' },
  { role: 'DOCTOR', email: 'dr.jenkins@demo.medislot.com', password: 'Password123!' },
  { role: 'CLINIC_ADMIN', email: 'admin.metro@demo.medislot.com', password: 'Password123!' },
  { role: 'PLATFORM_ADMIN', email: 'superadmin@medislot.com', password: 'Password123!' },
];


async function checkPresets() {
  console.log('Testing LoginPage Presets against live API...');
  for (const p of presets) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: p.email, password: p.password })
      });
      const data = await res.json();
      console.log(`- ${p.role} (${p.email}): Status ${res.status} -> ${res.ok ? 'SUCCESS' : JSON.stringify(data.message || data)}`);
    } catch (e) {
      console.log(`- ${p.role}: Error: ${e.message}`);
    }
  }
}

checkPresets();
