const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
let envContent = fs.readFileSync(envPath, 'utf8');

envContent = envContent.replace(/(DATABASE_URL\s*=\s*["'])([^"']+)(["'])/, (match, openQuote, url, closeQuote) => {
  if (url.includes('pgbouncer=true')) return match;
  const separator = url.includes('?') ? '&' : '?';
  const updatedUrl = url + separator + 'pgbouncer=true';
  return openQuote + updatedUrl + closeQuote;
});

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✅ Safely appended pgbouncer=true to DATABASE_URL in server/.env');
