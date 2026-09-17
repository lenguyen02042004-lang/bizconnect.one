import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  console.log("Signing in as consumer...");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient = createClient(supabaseUrl, serviceKey);

  console.log("Admin creating consumer...");
  const email = `test_save_${Date.now()}@test.com`;
  const { data: userAuth, error: authErr } = await adminClient.auth.admin.createUser({
    email,
    password: "Password123!",
    email_confirm: true,
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  const userId = userAuth.user.id;
  console.log("User created:", userId);

  const { data: session, error: loginErr } = await supabase.auth.signInWithPassword({
    email,
    password: "Password123!",
  });

  if (loginErr) {
    console.error("Login error:", loginErr);
    return;
  }
  
  console.log("Calling my_wallet_limits to create row...");
  const { error: rpcErr } = await supabase.rpc("my_wallet_limits");
  if (rpcErr) console.error("RPC Error:", rpcErr);

  console.log("Creating business...");
  const businessId = "00000000-0000-0000-0000-000000000001";
  
  console.log("Upserting contact...");
  const { error: insertErr } = await supabase.from("saved_contacts").upsert({
    user_id: userId,
    business_id: businessId,
    business_name: "Test Business",
    business_slug: "test-biz",
    industry: "tech",
    country_name: "Vietnam",
    province: "Hanoi",
  }, { onConflict: "user_id,business_id" });

  if (insertErr) {
    console.error("UPSERT ERROR:", insertErr);
  } else {
    console.log("UPSERT SUCCESS!");
  }
}

testSave().catch(console.error);
