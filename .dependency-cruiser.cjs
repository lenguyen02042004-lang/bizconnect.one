/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    doNotFollow: {
      path: "node_modules",
    },
  },
};
