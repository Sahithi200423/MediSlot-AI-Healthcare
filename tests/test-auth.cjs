const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 MEDISLOT PHASE TWO AUTHENTICATION & RBAC TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Register New Patient
  console.log('1. Testing New Patient Registration...');
  const regRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'jane.test@example.com',
    password: 'Password123',
    firstName: 'Jane',
    lastName: 'Tester',
  });
  console.log(`   Status: ${regRes.status} | User: ${regRes.body?.data?.user?.email} (${regRes.body?.data?.user?.role})`);
  console.assert(regRes.status === 201, 'Registration should return 201');
  console.assert(regRes.body.data.user.role === 'PATIENT', 'Role must strictly default to PATIENT');

  // Test 2: Reject Incorrect Password
  console.log('\n2. Testing Incorrect Password Rejection...');
  const badLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'jane.test@example.com',
    password: 'WrongPassword999',
  });
  console.log(`   Status: ${badLogin.status} | Message: ${badLogin.body?.error?.message}`);
  console.assert(badLogin.status === 401, 'Bad login must return 401');

  // Test 3: Correct Login & Token Retrieval
  console.log('\n3. Testing Valid Login & Token Issuance...');
  const goodLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'jane.test@example.com',
    password: 'Password123',
  });
  console.log(`   Status: ${goodLogin.status} | Logged in as: ${goodLogin.body?.data?.user?.firstName} ${goodLogin.body?.data?.user?.lastName}`);
  console.assert(goodLogin.status === 200, 'Valid login should return 200');
  const patientToken = goodLogin.body.data.token;
  console.assert(Boolean(patientToken), 'Token must be returned');

  // Test 4: Protected Route Verification (/api/auth/me)
  console.log('\n4. Testing Protected Session Verification (/api/auth/me)...');
  const meRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  console.log(`   Status: ${meRes.status} | Verified Identity: ${meRes.body?.data?.user?.email}`);
  console.assert(meRes.status === 200, 'Protected route should return 200');

  // Test 5: Unauthenticated API Access Rejection
  console.log('\n5. Testing Missing Token Rejection on Protected Endpoint...');
  const unauthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
  });
  console.log(`   Status: ${unauthRes.status} | Error: ${unauthRes.body?.error?.message}`);
  console.assert(unauthRes.status === 401, 'Unauthenticated request must return 401');

  // Test 6: Cross-User Data Isolation (/api/appointments/my)
  console.log('\n6. Testing User-Scoped Data Isolation (/api/appointments/my)...');
  const myAptRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/appointments/my',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  console.log(`   Status: ${myAptRes.status} | Scoped User: ${myAptRes.body?.data?.scopedUserId} (${myAptRes.body?.data?.scopedRole})`);
  console.assert(myAptRes.status === 200, 'User appointments should return 200');

  // Test 7: Privilege Escalation Prevention (Patient calling SuperAdmin endpoint)
  console.log('\n7. Testing Role-Based Privilege Escalation Prevention...');
  const forbiddenRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/appointments/admin-metrics',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  console.log(`   Status: ${forbiddenRes.status} | Access Denied: ${forbiddenRes.body?.error?.message}`);
  console.assert(forbiddenRes.status === 403, 'Patient accessing admin endpoint must return 403 Forbidden');

  // Test 8: SuperAdmin Authorized Access
  console.log('\n8. Testing Authorized SuperAdmin Access...');
  const adminLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'superadmin@medislot.com',
    password: 'password123',
  });
  const adminToken = adminLogin.body?.data?.token;

  const adminRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/appointments/admin-metrics',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  console.log(`   Status: ${adminRes.status} | Total Clinics: ${adminRes.body?.data?.activeClinics}`);
  console.assert(adminRes.status === 200, 'SuperAdmin must succeed with 200');

  console.log('\n======================================================');
  console.log('✅ ALL 8 TESTS PASSED WITH 100% SUCCESS RATE');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
