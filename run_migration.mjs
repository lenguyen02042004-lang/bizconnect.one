import postgres from "postgres";
import fs from "fs";

const sql = postgres(
  "postgresql://postgres.umvwsgrpsjqxurehqjbs:DaGyx6tj+-BEVst@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
);
const migration = fs.readFileSync(
  "supabase/migrations/20260912075600_fix_follows_count_trigger.sql",
  "utf8",
);

async function run() {
  try {
    await sql.unsafe(migration);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Error executing migration:", err);
  } finally {
    process.exit(0);
  }
}
run();
