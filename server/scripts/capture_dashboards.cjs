const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (_) { data = text; }
  return { status: res.status, ok: res.ok, body: data };
}

async function registerAndVerifyUser(email, firstName, lastName, role = 'PATIENT') {
  const regRes = await request(`${API_URL}/auth/register`, {
    method: 'POST',
    body: { email, password: 'Password123!', firstName, lastName }
  });

  if (!regRes.body?.data) {
    throw new Error(`Registration failed for ${email}: ${JSON.stringify(regRes.body)}`);
  }

  let token = regRes.body.data.token;
  const otp = regRes.body.data.emailOtp;
  const userId = regRes.body.data.user?.id;

  if (otp) {
    const vRes = await request(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      body: { email, token: otp }
    });
    token = vRes.body?.data?.session?.access_token || token;
  }

  if (!token) {
    const lRes = await request(`${API_URL}/auth/login`, {
      method: 'POST',
      body: { email, password: 'Password123!' }
    });
    token = lRes.body?.data?.token;
  }

  let profile = await prisma.profile.findUnique({ where: { id: userId } });
  for (let i = 0; i < 6 && !profile; i++) {
    await new Promise(r => setTimeout(r, 400));
    profile = await prisma.profile.findUnique({ where: { id: userId } });
  }

  if (!profile && userId) {
    profile = await prisma.profile.create({
      data: { id: userId, email, firstName, lastName, role }
    });
  } else if (profile && role && profile.role !== role) {
    profile = await prisma.profile.update({
      where: { id: userId },
      data: { role }
    });
    const lRes = await request(`${API_URL}/auth/login`, {
      method: 'POST',
      body: { email, password: 'Password123!' }
    });
    if (lRes.body?.data?.token) {
      token = lRes.body.data.token;
    }
  }

  return { token, userId, profile: { ...profile, role } };
}

async function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const artifactDir = 'C:\\Users\\MI\\.gemini\\antigravity-ide\\brain\\20e5634f-969f-42b3-bc66-857131ae9c06';
  const stamp = Math.floor(100000 + Math.random() * 900000);
  
  console.log('1. Provisioning test patient and doctor actors...');
  const patUser = await registerAndVerifyUser(`editorial.pat.${stamp}@example.com`, 'Elena', 'Rostova', 'PATIENT');
  let patRec = await prisma.patient.findUnique({ where: { profileId: patUser.userId } });
  if (!patRec) {
    patRec = await prisma.patient.create({ data: { profileId: patUser.userId } });
  }

  // Find or create clinic
  let clinic = await prisma.clinic.findFirst();
  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: 'St. Jude Metropolitan Medical Pavilion',
        slug: `st-jude-metro-${stamp}`,
        address: '742 Healthcare Boulevard',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        phone: '+1 (555) 234-5678',
        email: `info.${stamp}@stjude-hospital.org`
      }
    });
  }

  const docUser = await registerAndVerifyUser(`editorial.doc.${stamp}@example.com`, 'Marcus', 'Vance', 'DOCTOR');
  
  // Onboard doctor via API
  const onboardRes = await request(`${API_URL}/doctors/onboard`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${docUser.token}` },
    body: {
      specialty: 'Cardiovascular Medicine',
      licenseNumber: `WA-MD-EDITORIAL-${stamp}`,
      qualifications: 'MD, FACC',
      consultationFee: 175,
      clinicId: clinic.id
    }
  });

  const doctorId = onboardRes.body?.data?.doctor?.id;

  // Add 7-day availability
  if (doctorId) {
    for (let d = 0; d < 7; d++) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId,
          dayOfWeek: d,
          startTime: '08:30',
          endTime: '17:30',
          slotDurationMinutes: 30,
          isActive: true
        }
      });
    }

    // Create an upcoming appointment
    const scheduledStart = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    scheduledStart.setHours(10, 30, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + 30 * 60 * 1000);

    await prisma.appointment.create({
      data: {
        patientId: patRec.id,
        doctorId,
        clinicId: clinic.id,
        scheduledStart,
        scheduledEnd,
        reasonForVisit: 'Post-operative cardiac evaluation & diagnostic follow-up',
        status: 'CONFIRMED'
      }
    });

    // Create sample clinical document
    await prisma.medicalRecord.create({
      data: {
        patientId: patRec.id,
        uploadedByProfileId: patUser.userId,
        title: 'Diagnostic Echocardiogram Panel',
        description: 'Comprehensive Doppler & 2D echocardiogram evaluation report.',
        category: 'LAB_REPORT',
        fileName: 'Diagnostic_Echocardiogram_Panel.pdf',
        storagePath: 'demo-storage/echo_report.pdf',
        fileType: 'application/pdf',
        fileSize: 245000
      }
    });
  }

  console.log('2. Launching headless Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(artifactDir, 'scratch', 'chrome-profile-' + stamp);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,1050'
  ]);

  // Wait for remote debugging endpoint
  await new Promise(r => setTimeout(r, 2000));

  let versionInfo;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        versionInfo = await res.json();
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }

  if (!versionInfo?.webSocketDebuggerUrl) {
    throw new Error('Failed to connect to Chrome DevTools debugging endpoint');
  }

  // Get the default open page target
  const targetsRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await targetsRes.json();
  const target = targets.find(t => t.type === 'page') || targets[0];
  const wsUrl = target.webSocketDebuggerUrl;

  console.log('3. Connecting to Page WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to origin first
  console.log('4. Setting up Patient session on origin...');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  // Set patient localStorage and navigate to /dashboard/patient
  console.log('5. Navigating to Patient Dashboard...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      localStorage.setItem('medislot_token', ${JSON.stringify(patUser.token)});
      localStorage.setItem('medislot_user', ${JSON.stringify(JSON.stringify(patUser.profile))});
      window.location.href = '/dashboard/patient';
    `
  });

  // Wait for patient dashboard and all data to load
  await new Promise(r => setTimeout(r, 7000));

  // Capture Patient Dashboard Screenshot
  console.log('6. Capturing Patient Dashboard screenshot...');
  const patientScreenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const patientImgPath = path.join(artifactDir, 'patient_dashboard_editorial.png');
  fs.writeFileSync(patientImgPath, Buffer.from(patientScreenshot.data, 'base64'));
  console.log('✓ Patient Dashboard saved to:', patientImgPath);

  // Now set doctor credentials and navigate to doctor dashboard
  console.log('7. Navigating to Doctor Dashboard with doctor credentials...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      localStorage.setItem('medislot_token', ${JSON.stringify(docUser.token)});
      localStorage.setItem('medislot_user', ${JSON.stringify(JSON.stringify(docUser.profile))});
      window.location.href = '/dashboard/doctor';
    `
  });

  // Wait for doctor dashboard to load and render
  await new Promise(r => setTimeout(r, 7000));

  // Capture Doctor Dashboard Screenshot
  console.log('8. Capturing Doctor Dashboard screenshot...');
  const docScreenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const docImgPath = path.join(artifactDir, 'doctor_dashboard_editorial.png');
  fs.writeFileSync(docImgPath, Buffer.from(docScreenshot.data, 'base64'));
  console.log('✓ Doctor Dashboard saved to:', docImgPath);

  ws.close();
  chromeProc.kill();
  console.log('✓ All dashboard screenshots captured successfully.');
}

main()
  .catch(err => {
    console.error('Execution failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
