const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/api';
const ARTIFACT_DIR = 'C:\\Users\\MI\\.gemini\\antigravity-ide\\brain\\f3597ef0-5909-4c4f-a78d-babd1433936f';

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

async function loginUser(email, password = 'Password123!') {
  const lRes = await request(`${API_URL}/auth/login`, {
    method: 'POST',
    body: { email, password }
  });
  if (!lRes.body?.data?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(lRes.body)}`);
  }
  return {
    token: lRes.body.data.token,
    user: lRes.body.data.user
  };
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
  const stamp = Math.floor(100000 + Math.random() * 900000);
  console.log('1. Logging in admin accounts...');

  const clinicAdmin = await loginUser('admin.metro@demo.medislot.com');
  console.log('✓ Clinic Admin logged in:', clinicAdmin.user.email);

  const platformAdmin = await loginUser('superadmin@medislot.com');
  console.log('✓ Platform Admin logged in:', platformAdmin.user.email);

  console.log('2. Launching headless Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(ARTIFACT_DIR, 'scratch', 'chrome-profile-admin-' + stamp);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,1050'
  ]);

  // Wait for remote debugging port
  await new Promise(r => setTimeout(r, 2000));

  let versionInfo;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9224/json/version');
      if (res.ok) {
        versionInfo = await res.json();
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }

  if (!versionInfo?.webSocketDebuggerUrl) {
    throw new Error('Failed to connect to Chrome DevTools debugging endpoint on port 9224');
  }

  const targetsRes = await fetch('http://127.0.0.1:9224/json/list');
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

  // Navigate to client
  console.log('4. Navigating to origin...');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  // --- A. CLINIC ADMINISTRATOR DASHBOARD ---
  console.log('5. Injecting Clinic Admin session...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      localStorage.setItem('medislot_token', ${JSON.stringify(clinicAdmin.token)});
      localStorage.setItem('medislot_user', ${JSON.stringify(JSON.stringify(clinicAdmin.user))});
      window.location.href = '/dashboard/clinic';
    `
  });

  console.log('Waiting for Clinic Admin dashboard to load...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      new Promise((resolve) => {
        const interval = setInterval(() => {
          const h1 = document.querySelector('h1');
          if (h1 && !document.querySelector('.animate-spin')) {
            clearInterval(interval);
            resolve(true);
          }
        }, 200);
        setTimeout(() => { clearInterval(interval); resolve(false); }, 12000);
      })
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('6. Capturing Clinic Admin Overview screenshot...');
  const clinicScreenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const clinicOverviewPath = path.join(ARTIFACT_DIR, 'clinic_admin_overview.png');
  fs.writeFileSync(clinicOverviewPath, Buffer.from(clinicScreenshot.data, 'base64'));
  console.log('✓ Clinic Admin Overview saved to:', clinicOverviewPath);

  // Switch to Master Appointments tab
  console.log('7. Switching to Master Appointments tab in Clinic Admin...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      const apptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Master Appointments'));
      if (apptBtn) apptBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 3000));

  const clinicApptsScreenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const clinicApptsPath = path.join(ARTIFACT_DIR, 'clinic_admin_appointments.png');
  fs.writeFileSync(clinicApptsPath, Buffer.from(clinicApptsScreenshot.data, 'base64'));
  console.log('✓ Clinic Admin Appointments saved to:', clinicApptsPath);

  // Mobile viewport responsiveness check for Clinic Admin
  console.log('8. Capturing Clinic Admin Mobile responsive screenshot (390x844)...');
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 2000));
  const clinicMobileScreenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const clinicMobilePath = path.join(ARTIFACT_DIR, 'clinic_admin_mobile.png');
  fs.writeFileSync(clinicMobilePath, Buffer.from(clinicMobileScreenshot.data, 'base64'));
  console.log('✓ Clinic Admin Mobile saved to:', clinicMobilePath);

  // Restore desktop dimensions
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));

  // --- B. PLATFORM ADMINISTRATOR DASHBOARD ---
  console.log('9. Injecting Platform Super Admin session...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      localStorage.setItem('medislot_token', ${JSON.stringify(platformAdmin.token)});
      localStorage.setItem('medislot_user', ${JSON.stringify(JSON.stringify(platformAdmin.user))});
      window.location.href = '/dashboard/platform';
    `
  });

  console.log('Waiting for Platform Admin dashboard to load...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      new Promise((resolve) => {
        const interval = setInterval(() => {
          const h1 = document.querySelector('h1');
          if (h1 && !document.querySelector('.animate-spin')) {
            clearInterval(interval);
            resolve(true);
          }
        }, 200);
        setTimeout(() => { clearInterval(interval); resolve(false); }, 12000);
      })
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('10. Capturing Platform Admin Overview screenshot...');
  const platformScreenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const platformOverviewPath = path.join(ARTIFACT_DIR, 'platform_admin_overview.png');
  fs.writeFileSync(platformOverviewPath, Buffer.from(platformScreenshot.data, 'base64'));
  console.log('✓ Platform Admin Overview saved to:', platformOverviewPath);

  // Switch to Managed Facilities tab
  console.log('11. Switching to Managed Facilities tab...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      const facBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Managed Facilities'));
      if (facBtn) facBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 3000));

  const platformFacilitiesScreenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const platformFacilitiesPath = path.join(ARTIFACT_DIR, 'platform_admin_facilities.png');
  fs.writeFileSync(platformFacilitiesPath, Buffer.from(platformFacilitiesScreenshot.data, 'base64'));
  console.log('✓ Platform Admin Facilities saved to:', platformFacilitiesPath);

  // Switch to Immutable Audit Trail tab
  console.log('12. Switching to Immutable Audit Trail tab...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `
      const auditBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Immutable Audit Trail'));
      if (auditBtn) auditBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 4000));

  const platformAuditScreenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const platformAuditPath = path.join(ARTIFACT_DIR, 'platform_admin_audit.png');
  fs.writeFileSync(platformAuditPath, Buffer.from(platformAuditScreenshot.data, 'base64'));
  console.log('✓ Platform Admin Audit Trail saved to:', platformAuditPath);

  ws.close();
  chromeProc.kill();
  console.log('✓ All dashboard captures complete!');
}

main()
  .catch(err => {
    console.error('Execution failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
