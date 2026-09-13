const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/SUPABASE_ACCESS_TOKEN=\"?([^\"\r\n]+)/);
if (!match) {
  console.error("Token not found");
  process.exit(1);
}
const token = match[1];
const { execSync } = require('child_process');
try {
  execSync('npx supabase db pull', { env: { ...process.env, SUPABASE_ACCESS_TOKEN: token }, stdio: 'inherit' });
} catch (e) {
  console.error("Failed", e);
}
