const url = "https://umvwsgrpsjqxurehqjbs.supabase.co/rest/v1/businesses?select=id,name,slug,country_code,province,logo_url,short_intro,email,phone,website,owner_id,status,industry_id";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdndzZ3Jwc2pxeHVyZWhxamJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMDkxMDAsImV4cCI6MjEwNDU4NTEwMH0.p511jXKtrBAk5YUkgg9FUtG8syCiZLgRe8ef1au-wLI";

fetch(url, {
  headers: {
    "apikey": apikey,
    "Authorization": `Bearer ${apikey}`
  }
}).then(res => res.json()).then(data => {
  let missingSlug = 0;
  let missingCountry = 0;
  let missingLogo = 0;
  let missingIntro = 0;
  let missingEmail = 0;
  let missingPhone = 0;
  let missingWebsite = 0;
  
  data.forEach(d => {
    if (!d.slug) missingSlug++;
    if (!d.country_code) missingCountry++;
    if (!d.logo_url) missingLogo++;
    if (!d.short_intro) missingIntro++;
    if (!d.email) missingEmail++;
    if (!d.phone) missingPhone++;
    if (!d.website) missingWebsite++;
  });
  
  console.log("Total:", data.length);
  console.log("Missing Slug:", missingSlug);
  console.log("Missing Country Code:", missingCountry);
  console.log("Missing Logo URL:", missingLogo);
  console.log("Missing Intro:", missingIntro);
  console.log("Missing Email:", missingEmail);
  console.log("Missing Phone:", missingPhone);
  console.log("Missing Website:", missingWebsite);
});
