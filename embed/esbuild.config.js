/* eslint-disable no-console */
const esbuild = require("esbuild");
const path = require("path");

const entry = path.join(__dirname, "src", "index.ts");
const outfile = path.join(__dirname, "..", "public", "embed.js");

esbuild
  .build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    minify: true,
    target: ["es2018"],
    platform: "browser",
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
