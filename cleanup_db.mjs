import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log("=== CLEANING DATABASE ===");

  // 1. Delete all "Unknown Company" entries
  const { data: deleted1, error: e1 } = await supabase
    .from("businesses")
    .delete()
    .eq("name", "Unknown Company")
    .select("id");
  console.log(`Deleted ${deleted1?.length ?? 0} "Unknown Company" rows`, e1?.message || "");

  // 2. Delete all "Unknown-company" slug entries
  const { data: deleted2, error: e2 } = await supabase
    .from("businesses")
    .delete()
    .ilike("slug", "unknown%")
    .select("id");
  console.log(`Deleted ${deleted2?.length ?? 0} "unknown*" slug rows`, e2?.message || "");

  // 3. Find duplicates by name and keep only the latest
  const { data: allBiz, error: e3 } = await supabase
    .from("businesses")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (e3) {
    console.error("Error fetching:", e3.message);
    process.exit(1);
  }

  const seen = new Map();
  const toDelete = [];
  for (const b of allBiz) {
    const key = b.name.toLowerCase().trim();
    if (seen.has(key)) {
      toDelete.push(b.id);
    } else {
      seen.set(key, b.id);
    }
  }

  if (toDelete.length > 0) {
    const { data: deleted3, error: e4 } = await supabase
      .from("businesses")
      .delete()
      .in("id", toDelete)
      .select("id");
    console.log(`Deleted ${deleted3?.length ?? 0} duplicate rows`, e4?.message || "");
  } else {
    console.log("No duplicates found.");
  }

  // 4. Show final count
  const { count } = await supabase.from("businesses").select("*", { count: "exact", head: true });
  console.log(`\n✅ Database now has ${count} businesses.`);
  process.exit(0);
})();
