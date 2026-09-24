import puppeteer from "puppeteer";
import { supabase, randomDelay } from "./utils.mjs";

const EXCLUDED_EMAILS = ["sentry", "example", "test", "w3.org", "google.com", "schema.org", "domain.com", "email.com"];

function extractEmails(text) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = text.match(emailRegex) || [];
  const unique = [...new Set(matches.map((e) => e.toLowerCase()))];
  return unique.filter((email) => {
    if (email.endsWith(".png") || email.endsWith(".jpg") || email.endsWith(".jpeg") || email.endsWith(".gif") || email.endsWith(".webp") || email.endsWith(".svg")) return false;
    for (const ex of EXCLUDED_EMAILS) {
      if (email.includes(ex)) return false;
    }
    return true;
  });
}

function extractPhones(text) {
  const phoneRegex = /(\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g;
  const matches = text.match(phoneRegex) || [];
  const valid = matches.filter((p) => p.replace(/\D/g, "").length >= 8 && p.replace(/\D/g, "").length <= 15);
  return [...new Set(valid)];
}

async function searchDuckDuckGo(page, query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const links = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll(".result__url").forEach((node) => {
        const parentA = node.closest('.result__body')?.querySelector('a.result__url');
        if (parentA) {
             let realHref = parentA.getAttribute("href");
             if (realHref.includes("uddg=")) {
                 const match = realHref.match(/uddg=([^&]+)/);
                 if (match) realHref = decodeURIComponent(match[1]);
             }
             if (realHref) {
                 const BAD_DOMAINS = ["duckduckgo.com", "youtube.com", "facebook.com", "chanchao.com.tw", "saigontex.com.vn", "vietnamplas.com", "textiledirectory.net", "yellowpages.vn", "trangvangvietnam.com", "hosocongty.vn", "cnverify.com", "chemical-indonesia.net", "inacoating-exhibition.net", "vietnamprintpack.com", "alibaba.com", "kompass.com", "linkedin.com", "instagram.com"];
                 const isBad = BAD_DOMAINS.some(d => realHref.includes(d));
                 if (!isBad) {
                     results.push(realHref);
                 }
             }
        }
      });
      return results;
    });
    return links.slice(0, 2);
  } catch (err) {
    console.error(`Error searching DDG for ${query}:`, err.message);
    return [];
  }
}

async function scrapeContactInfo(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const text = await page.evaluate(() => document.body.innerText || "");
    const emails = extractEmails(text);
    const phones = extractPhones(text);
    return { emails, phones };
  } catch (err) {
    console.error(`Error visiting ${url}:`, err.message);
    return { emails: [], phones: [] };
  }
}

async function main() {
  console.log("Starting Global Enrichment Scraper...");
  
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name, website, email, phone")
    .eq("owner_id", "f10d8c15-ad18-4b87-b6a4-24428a20967d")
    .is("email", null)
    .limit(1500); // limit per run

  if (error) {
    console.error("Error fetching businesses:", error);
    process.exit(1);
  }

  if (!businesses || businesses.length === 0) {
    console.log("No businesses found that need enrichment.");
    process.exit(0);
  }

  console.log(`Found ${businesses.length} businesses to enrich in this chunk.`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  let successCount = 0;

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    console.log(`\n[${i + 1}/${businesses.length}] Processing: ${biz.name}`);

    let emailsFound = [];
    let phonesFound = [];

    if (biz.website && biz.website.startsWith("http")) {
       console.log(` Visiting known website: ${biz.website}`);
       const { emails, phones } = await scrapeContactInfo(page, biz.website);
       emailsFound.push(...emails);
       phonesFound.push(...phones);
    } else {
       const query = `"${biz.name}" contact email official`;
       console.log(` Searching: ${query}`);
       const links = await searchDuckDuckGo(page, query);
       
       if (links.length > 0) {
         for (const link of links) {
           console.log(` -> Visiting ${link}`);
           const { emails, phones } = await scrapeContactInfo(page, link);
           emailsFound.push(...emails);
           phonesFound.push(...phones);
           if (emailsFound.length > 0) break;
         }
       }
    }

    emailsFound = [...new Set(emailsFound)];
    phonesFound = [...new Set(phonesFound)];

    if (emailsFound.length > 0 || phonesFound.length > 0) {
      console.log(`   => SUCCESS: Emails: [${emailsFound.join(", ")}], Phones: [${phonesFound.join(", ")}]`);
      
      const updateData = {};
      if (emailsFound.length > 0 && !biz.email) updateData.email = emailsFound[0];
      if (phonesFound.length > 0 && !biz.phone) updateData.phone = phonesFound[0];

      if (Object.keys(updateData).length > 0) {
         const { error: upErr } = await supabase.from("businesses").update(updateData).eq("id", biz.id);
         if (upErr) {
            console.error("   => Failed to update DB:", upErr.message);
         } else {
            console.log("   => Updated DB successfully.");
            successCount++;
         }
      }
    } else {
      console.log(`   => FAILED to find any contact info.`);
    }

    const delay = Math.floor(Math.random() * 20000) + 25000; // 25-45s
    console.log(` Waiting ${delay/1000}s...`);
    await randomDelay(delay, delay);
  }

  await browser.close();
  console.log(`\nEnrichment complete! Enriched ${successCount}/${businesses.length} businesses.`);
}

main().catch(console.error);
