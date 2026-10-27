const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  });
  return env;
}

console.log('=== Checking server/.env ===');
const serverEnv = parseEnv(path.join(__dirname, '../.env'));
const serverKeys = ['DATABASE_URL', 'DIRECT_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
let serverAllValid = true;
serverKeys.forEach(k => {
  const val = serverEnv[k] || '';
  const isSet = Boolean(val && !val.includes('[YOUR-PASSWORD]') && !val.includes('localhost') && val.length > 5);
  console.log(`  ${k}: ${isSet ? 'VALID (Configured)' : 'MISSING / PLACEHOLDER'}`);
  if (!isSet) serverAllValid = false;
});

console.log('\n=== Checking client/.env.local ===');
const clientEnv = parseEnv(path.join(__dirname, '../../client/.env.local'));
const clientKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];
let clientAllValid = true;
clientKeys.forEach(k => {
  const val = clientEnv[k] || '';
  const isSet = Boolean(val && val.length > 5 && !val.includes('your-'));
  console.log(`  ${k}: ${isSet ? 'VALID (Configured)' : 'MISSING / PLACEHOLDER'}`);
  if (!isSet) clientAllValid = false;
});

console.log('\n--- Diagnostics ---');
const sRaw = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const cRaw = fs.readFileSync(path.join(__dirname, '../../client/.env.local'), 'utf8');
console.log('server/.env byte length:', sRaw.length);
console.log('client/.env.local byte length:', cRaw.length);
console.log('server/.env keys present:', Object.keys(serverEnv));
console.log('client/.env.local keys present:', Object.keys(clientEnv));
console.log('server DATABASE_URL length:', (serverEnv.DATABASE_URL || '').length);
console.log('client VITE_SUPABASE_URL length:', (clientEnv.VITE_SUPABASE_URL || '').length);

