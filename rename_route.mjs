import fs from "fs";
import path from "path";

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk("src", (filePath) => {
  if (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts")) return;
  if (filePath.includes("routeTree.gen.ts")) return; // let tanstack router handle this

  let content = fs.readFileSync(filePath, "utf8");
  let newContent = content
    .replace(/"\/b\//g, '"/business/')
    .replace(/'\/b\//g, "'/business/")
    .replace(/`\/b\//g, "`/business/")
    .replace(/>\/b\//g, ">/business/");

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
});
