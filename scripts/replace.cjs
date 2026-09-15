const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk("./src");
files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  let newContent = content
    .replace(/GlobalBiz\.Connect/g, "BizConnect.One")
    .replace(
      /GlobalBiz<span className="text-gradient">\.Connect<\/span>/g,
      'BizConnect<span className="text-gradient">.One</span>',
    )
    .replace(/demo\.globalbiz\.test/g, "demo.bizconnect.test")
    .replace(/contact@globalbiz\.connect/g, "contact@bizconnect.one")
    .replace(/GlobalBizConnect\/1\.0/g, "BizConnectOne/1.0");

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, "utf8");
    console.log(`Updated ${file}`);
  }
});
