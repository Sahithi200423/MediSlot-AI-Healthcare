const fs = require('fs');
const path = require('path');

function cleanUrl(filePath, varName) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(new RegExp(`(${varName}\\s*=\\s*["'])([^"']+)(["'])`), (match, open, val, close) => {
    try {
      const parsed = new URL(val);
      const cleanOrigin = parsed.origin;
      return open + cleanOrigin + close;
    } catch (e) {
      return match;
    }
  });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned ${varName} in ${filePath}`);
}

cleanUrl(path.join(__dirname, '../.env'), 'SUPABASE_URL');
cleanUrl(path.join(__dirname, '../../client/.env.local'), 'VITE_SUPABASE_URL');
