import { execSync } from "child_process";
import fs from "fs";

try {
  console.log("Generating DOT graph using dependency-cruiser...");
  const dotGraph = execSync(
    'npx depcruise src --include-only "^src" -c .dependency-cruiser.cjs --output-type dot',
    { encoding: "utf8" },
  );

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dependency Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="https://unpkg.com/@hpcc-js/wasm@2.20.0/dist/graphviz.umd.js"></script>
  <script src="https://unpkg.com/d3-graphviz@5.1.0/build/d3-graphviz.js"></script>
  <style>
    body { font-family: sans-serif; background: #f8f9fa; margin: 0; padding: 0; overflow: hidden; }
    #graph { width: 100vw; height: 100vh; }
    .title { position: absolute; top: 10px; left: 10px; z-index: 10; background: rgba(255,255,255,0.8); padding: 5px 15px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <div class="title"><h2>Codebase Graph (D3-Graphviz)</h2></div>
  <div id="graph"></div>
  <script>
    const dotSrc = \`${dotGraph.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;
    d3.select("#graph")
      .graphviz()
      .zoomScaleExtent([0.1, 10])
      .renderDot(dotSrc);
  </script>
</body>
</html>
  `;

  fs.writeFileSync("graph.html", htmlContent, "utf8");
  console.log("Successfully generated interactive graph.html with D3-Graphviz!");
} catch (error) {
  console.error("Failed to generate graph:", error.message);
}
