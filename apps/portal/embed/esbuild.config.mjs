import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
