import "dotenv/config";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Basic Country Code Mapper (ISO 2-letter)
function getCountryCode(countryName) {
  if (!countryName) return null;
  const map = {
    China: "CN",
    Vietnam: "VN",
    "Viet Nam": "VN",
    Taiwan: "TW",
    "South Korea": "KR",
    Korea: "KR",
    Japan: "JP",
    Singapore: "SG",
    Malaysia: "MY",
    Thailand: "TH",
    India: "IN",
    "Hong Kong": "HK",
    USA: "US",
    "United States": "US",
    Germany: "DE",
    Italy: "IT",
    UK: "GB",
    France: "FR",
  };
  return map[countryName.trim()] || null;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupSystemAccount() {
  const email = "system@bizconnect.one";
  
  // Try to create directly
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: email,
    password: "SystemPassword2026!",
    email_confirm: true,
    user_metadata: { name: "BizConnect System" },
  });
  
  if (error && error.code !== "email_exists" && error.code !== "user_already_exists") {
    throw error;
  }

  // If it exists, find it by listing all users (we can fetch up to 1000)
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  
  const user = usersData.users.find((u) => u.email === email);
  if (!user) throw new Error("Could not find system account even though it exists.");
  
  return user.id;
}

async function setupIndustry(industryName) {
  const slug = slugify(industryName);
  const { data: existing, error: findErr } = await supabase
    .from("industries")
    .select("*")
    .eq("slug", slug)
    .single();
  if (existing) return existing.id;

  const { data: newInd, error: insErr } = await supabase
    .from("industries")
    .insert([{ name: industryName, slug: slug, icon: "Factory" }])
    .select()
    .single();
  if (insErr) throw insErr;
  return newInd.id;
}

(async () => {
  try {
    console.log("--- STARTING VIETNAM PRINTPACK SCRAPER ---");
    const ownerId = await setupSystemAccount();
    const industryId = await setupIndustry("Printing & Packaging");

    const browser = await chromium.launch({ headless: false, channel: "chrome" });
    const context = await browser.newContext();
    const page = await context.newPage();

    for (let pageNum = 1; pageNum <= 40; pageNum++) {
      console.log(`\n=== Navigating to Page ${pageNum} ===`);
      let pageLoaded = false;
      for (let retries = 0; retries < 3; retries++) {
        try {
          await page.goto(`https://vietnamprintpack.chanchao.com.tw/VisitorExhibitor?page=${pageNum}`, {
            waitUntil: "domcontentloaded",
            timeout: 45000,
          });
          await page.waitForTimeout(4000);
          await randomDelay(2000, 5000); // Thêm delay ngẫu nhiên 2-5 giây khi chuyển trang
          pageLoaded = true;
          break;
        } catch (e) {
          console.log(`Timeout loading page ${pageNum}, retrying (${retries + 1}/3)...`);
          await page.waitForTimeout(5000);
        }
      }
      if (!pageLoaded) {
        console.error(`Failed to load page ${pageNum} after 3 retries. Skipping page.`);
        continue;
      }

      const companies = await page.evaluate(() => {
        const linkNodes = Array.from(
          document.querySelectorAll('a[href*="/VisitorExhibitor/Detail"]'),
        );
        const uniqueHrefs = [...new Set(linkNodes.map((a) => a.href))];

        const results = [];
        for (const href of uniqueHrefs) {
          const linksForHref = linkNodes.filter((a) => a.href === href);
          let cardElement = null;
          if (linksForHref.length > 0) {
            let curr = linksForHref[0].parentElement;
            while (curr && curr.tagName !== "BODY") {
              if (
                curr.className.includes("item") ||
                curr.classList.contains("col-md-12") ||
                curr.classList.contains("row")
              ) {
                if (curr.querySelector("img") && curr.innerText.trim().length > 10) {
                  cardElement = curr;
                  break;
                }
              }
              curr = curr.parentElement;
            }
          }

          if (!cardElement) continue;

          const img = cardElement.querySelector("img");
          const logo_url = img ? img.src : null;

          const nameEl =
            cardElement.querySelector('[itemprop="name"]') ||
            linksForHref.find((l) => l.innerText.trim().length > 3);
          const name = nameEl ? nameEl.innerText.trim() : "Unknown";

          const countryEl =
            cardElement.querySelector('[itemprop="addressCountry"]') ||
            cardElement.querySelector(".fa-map-marker")?.parentElement;
          const country = countryEl ? countryEl.innerText.trim() : "";

          const descEl =
            cardElement.querySelector(".ellipsis2") || cardElement.querySelector(".desc");
          const short_intro = descEl ? descEl.innerText.trim() : null;

          results.push({
            name,
            logo_url,
            country,
            short_intro,
            detailUrl: href,
          });
        }
        return results;
      });

      console.log(`Found ${companies.length} companies on Page ${pageNum}. Extracting details...`);
      if (companies.length === 0) {
        console.log("No more companies found. Stopping pagination.");
        break;
      }

      // Visit each detail page to get website
      for (let i = 0; i < companies.length; i++) {
        const comp = companies[i];
        if (comp.detailUrl) {
          console.log(`[${i + 1}/${companies.length}] Getting details for ${comp.name}...`);
          for (let retries = 0; retries < 2; retries++) {
            try {
              await randomDelay(3000, 7000); // Thêm delay ngẫu nhiên 3-7 giây giữa các công ty
              await page.goto(comp.detailUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
              const website = await page.evaluate(() => {
                const websiteIcon = document.querySelector(".fa-globe");
                let rawUrl = null;
                if (websiteIcon) {
                  rawUrl = websiteIcon.parentElement.href;
                } else {
                  const allLinks = Array.from(document.querySelectorAll("a"));
                  const websiteLink = allLinks.find((a) =>
                    a.innerText.toLowerCase().includes("website"),
                  );
                  rawUrl = websiteLink ? websiteLink.href : null;
                }

                if (!rawUrl) return null;
                rawUrl = decodeURIComponent(rawUrl);
                // Split by ; or %20 if there are multiple
                if (rawUrl.includes(";")) rawUrl = rawUrl.split(";")[0].trim();
                // Reject chanchao internal links
                if (rawUrl.includes("chanchao.com.tw")) return null;

                return rawUrl;
              });
              comp.website = website;
              break; // success
            } catch (e) {
              if (retries === 1) {
                console.log(`Timeout getting details for ${comp.name}, skipping website...`);
              }
            }
          }
          // Prepare DB Record
          const cc = getCountryCode(comp.country);
          const slug = slugify(comp.name);

          const record = {
            owner_id: ownerId,
            name: comp.name,
            slug: slug,
            logo_url: comp.logo_url,
            country_code: cc,
            industry_id: industryId,
            status: "public", // Direct to public for demo
            icon_tier: "standard",
            short_intro: comp.short_intro,
            website: comp.website,
            lat: null,
            lng: null,
          };

          // Upsert by slug
          const { error } = await supabase
            .from("businesses")
            .upsert(record, { onConflict: "slug" });

          if (error) {
            console.error(`Error saving ${comp.name}:`, error.message);
          } else {
            console.log(
              `Saved ${comp.name} successfully! (Country: ${cc}, Website: ${comp.website})`,
            );
          }
        }
      }
    } // end page loop

    await browser.close();
    console.log("--- ALL BATCHES DONE ---");
    process.exit(0);
  } catch (e) {
    console.error("FATAL ERROR:", e);
    process.exit(1);
  }
})();
