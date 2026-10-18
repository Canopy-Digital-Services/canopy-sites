/**
 * Downloads the self-hosted font set from Fontsource (via npm) and writes:
 *   - public/fonts/<id>/*.woff2 + LICENSE   served to embeds and the font picker
 *   - src/lib/self-hosted-fonts.json        manifest read by /api/fonts
 *   - src/app/fonts/*.woff2                 admin UI fonts for next/font/local
 *
 * Usage:
 *   npm run fonts:sync              fetch families missing from the manifest
 *   npm run fonts:sync -- --update  refetch everything at the latest version
 *
 * Output is committed, so builds never touch the network. Packages are pulled
 * with `npm pack` into a temp dir rather than installed, which keeps ~40 font
 * packages out of node_modules and the Docker build.
 *
 * The catalog is CURATED_FONTS + CURATED_HEADING_FONTS (src/lib/google-fonts.ts)
 * plus EXTRA_FAMILIES. Anything else a form picks still loads from Google.
 */

import { execFileSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { CURATED_FONTS, CURATED_HEADING_FONTS } from "../src/lib/google-fonts";

// Fonts in use on client sites or forms that aren't in the curated pickers.
const EXTRA_FAMILIES = ["Jost"];

// The embed and font picker request these weights; missing ones are skipped
// and the browser synthesizes them, as it does with Google.
const WEIGHTS = [300, 400, 700];
// unicode-range means latin-ext only downloads when a page uses those glyphs.
const SUBSETS = ["latin", "latin-ext"];

const ADMIN_FONTS = [
  { pkg: "@fontsource-variable/inter", file: "inter-latin-wght-normal.woff2", out: "Inter-Variable.woff2" },
  { pkg: "@fontsource-variable/urbanist", file: "urbanist-latin-wght-normal.woff2", out: "Urbanist-Variable.woff2" },
  { pkg: "@fontsource-variable/geist-mono", file: "geist-mono-latin-wght-normal.woff2", out: "GeistMono-Variable.woff2" },
];

type Face = { weight: number; subset: string; file: string; unicodeRange: string };
type Manifest = Record<string, { id: string; version: string; faces: Face[] }>;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public", "fonts");
const manifestPath = join(root, "src", "lib", "self-hosted-fonts.json");
const adminDir = join(root, "src", "app", "fonts");
const update = process.argv.includes("--update");
const work = mkdtempSync(join(tmpdir(), "fonts-sync-"));

/** npm pack + extract; returns the extracted package directory. */
function fetchPackage(pkg: string): string {
  const dest = join(work, pkg.replace(/[@/]/g, "_"));
  mkdirSync(dest, { recursive: true });
  const tgz = execFileSync("npm", ["pack", pkg, "--pack-destination", dest, "--silent"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .pop()!;
  execFileSync("tar", ["xzf", join(dest, tgz), "-C", dest]);
  return join(dest, "package");
}

function idFor(family: string) {
  return family.toLowerCase().replace(/ /g, "-");
}

const families = [...new Set([...CURATED_FONTS, ...CURATED_HEADING_FONTS, ...EXTRA_FAMILIES])].sort();
const previous: Manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const manifest: Manifest = {};

try {
  for (const family of families) {
    const id = idFor(family);
    const prior = previous[family];
    const familyDir = join(publicDir, id);
    if (!update && prior && prior.faces.every((f) => existsSync(join(root, "public", f.file)))) {
      manifest[family] = prior;
      continue;
    }

    console.log(`fetching ${family}`);
    const pkgDir = fetchPackage(`@fontsource/${id}`);
    const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    const meta = JSON.parse(readFileSync(join(pkgDir, "metadata.json"), "utf8"));
    const ranges: Record<string, string> = JSON.parse(readFileSync(join(pkgDir, "unicode.json"), "utf8"));

    rmSync(familyDir, { recursive: true, force: true });
    mkdirSync(familyDir, { recursive: true });
    copyFileSync(join(pkgDir, "LICENSE"), join(familyDir, "LICENSE"));

    const faces: Face[] = [];
    for (const weight of WEIGHTS.filter((w) => meta.weights.includes(w))) {
      for (const subset of SUBSETS.filter((s) => meta.subsets.includes(s))) {
        const name = `${id}-${subset}-${weight}-normal.woff2`;
        copyFileSync(join(pkgDir, "files", name), join(familyDir, name));
        faces.push({ weight, subset, file: `/fonts/${id}/${name}`, unicodeRange: ranges[subset] });
      }
    }
    manifest[family] = { id, version: pkg.version, faces };
  }

  // Drop families that left the catalog.
  const keep = new Set(Object.values(manifest).map((m) => m.id));
  for (const dir of existsSync(publicDir) ? readdirSync(publicDir) : []) {
    if (!keep.has(dir)) {
      console.log(`removing ${dir}`);
      rmSync(join(publicDir, dir), { recursive: true, force: true });
    }
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  mkdirSync(adminDir, { recursive: true });
  for (const font of ADMIN_FONTS) {
    if (!update && existsSync(join(adminDir, font.out))) continue;
    console.log(`fetching ${font.pkg}`);
    const pkgDir = fetchPackage(font.pkg);
    copyFileSync(join(pkgDir, "files", font.file), join(adminDir, font.out));
    copyFileSync(join(pkgDir, "LICENSE"), join(adminDir, font.out.replace(".woff2", ".LICENSE")));
  }

  console.log(`${Object.keys(manifest).length} families in ${manifestPath}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
