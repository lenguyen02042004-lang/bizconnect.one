const url =
  "https://umvwsgrpsjqxurehqjbs.supabase.co/rest/v1/businesses?select=id,name,industry_id,country_code";
const apikey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdndzZ3Jwc2pxeHVyZWhxamJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMDkxMDAsImV4cCI6MjEwNDU4NTEwMH0.p511jXKtrBAk5YUkgg9FUtG8syCiZLgRe8ef1au-wLI";

fetch(url, {
  headers: {
    apikey: apikey,
    Authorization: `Bearer ${apikey}`,
  },
})
  .then((res) => res.json())
  .then((data) => {
    console.log("Total businesses:", data.length);
    const names = data.map((d) => d.name);
    const uniqueNames = new Set(names);
    console.log("Unique businesses by name:", uniqueNames.size);

    const duplicates = {};
    names.forEach((name) => {
      duplicates[name] = (duplicates[name] || 0) + 1;
    });

    const dups = Object.entries(duplicates).filter(([k, v]) => v > 1);
    console.log("Duplicate names count:", dups.length);
    if (dups.length > 0) {
      console.log("Some duplicates:", dups.slice(0, 5));
    }

    const industryCounts = {};
    data.forEach((d) => {
      industryCounts[d.industry_id] = (industryCounts[d.industry_id] || 0) + 1;
    });
    console.log("By industry:", industryCounts);
  });
