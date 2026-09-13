const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/SUPABASE_ACCESS_TOKEN=\"?([^\"\r\n]+)/);
if (!match) {
  console.error("Token not found");
  process.exit(1);
}
const token = match[1];
const { execSync } = require('child_process');
const envOpts = { env: { ...process.env, SUPABASE_ACCESS_TOKEN: token }, stdio: 'inherit' };

try {
  console.log("Repairing migrations...");
  execSync('npx supabase migration repair --status applied 20260911000300', envOpts);
  execSync('npx supabase migration repair --status applied 20260911000400', envOpts);
  execSync('npx supabase migration repair --status applied 20260912005606', envOpts);
  execSync('npx supabase migration repair --status applied 20260912075600', envOpts);
  
  console.log("Pulling db...");
  execSync('npx supabase db pull', envOpts);
} catch (e) {
  console.error("Failed", e);
}
