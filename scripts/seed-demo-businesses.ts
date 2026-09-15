import { DEMO_BUSINESSES } from "../src/lib/mock-businesses";
import { supabaseAdmin } from "../src/integrations/supabase/client.server";

async function run() {
  console.log("Fetching users...");
  const { data: users, error: userErr } = await supabaseAdmin.auth.admin.listUsers();

  if (userErr) {
    console.error("Error fetching users:", userErr);
    return;
  }

  if (!users || users.users.length === 0) {
    console.log("No users found to assign as owner. Creating a test user...");
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: "test.owner@bizconnect.local",
      password: "password123",
      email_confirm: true,
    });
    if (createErr) {
      console.error("Failed to create test user", createErr);
      return;
    }
    users.users = [newUser.user];
  }

  const owner_id = users.users[0].id;
  console.log("Using owner_id:", owner_id);

  // Get industries
  const { data: industries } = await supabaseAdmin.from("industries").select("id, slug");
  const indMap = new Map((industries || []).map((i: any) => [i.slug, i.id]));

  for (const b of DEMO_BUSINESSES) {
    const industry_id = indMap.get(b.industry_slug) || null;

    const { error } = await supabaseAdmin.from("businesses").upsert({
      id: b.id,
      slug: b.slug,
      name: b.name,
      owner_id,
      status: "public",
      country_code: b.country_code,
      province: b.province,
      address: b.address,
      lat: b.lat,
      lng: b.lng,
      logo_url: b.logo_url,
      banner_url: b.banner_url,
      short_intro: b.short_intro,
      description: b.description,
      email: b.email,
      phone: b.phone,
      website: b.website,
      icon_tier: b.icon_tier,
      views_count: b.views_count,
      industry_id,
    });

    if (error) {
      console.error(`Error inserting ${b.name}:`, error.message);
    } else {
      console.log(`Inserted ${b.name}`);
    }
  }
}
run();
