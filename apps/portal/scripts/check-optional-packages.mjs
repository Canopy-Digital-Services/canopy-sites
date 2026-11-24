// Fails when `npm ci` left out an optional package this machine should have.
// Every `npm ci` in a container is followed by it: the Dockerfiles' RUN, the
// entrypoint in Dockerfile.dev, and the dependency recipe in
// .claude/rules/docker.md.
//
// npm skips an optional package that fails to install, whatever the reason (a
// download that failed as much as a wrong platform), and exits 0. Every binary
// built for a platform is such a package: Next's compiler, Tailwind's,
// lightningcss, esbuild, sharp. An install without one is a layer Docker
// caches as good, so whatever fails for the lack of it fails again on every
// retry. A layer whose RUN failed is not cached, and the retry installs again.
// The dev stack's node_modules volume keeps such an install the same way:
// nothing installs into a volume that has next.

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");

// Whether a package is for this machine (os, cpu, libc, engines) is asked of
// the npm that ran the install, so the two can't disagree. Node's images and
// tarballs keep npm at ../lib/node_modules/npm from the binary's directory.
const npmRequire = createRequire(
  path.resolve(process.execPath, "../../lib/node_modules/npm/package.json"),
);
const { checkEngine, checkPlatform } = npmRequire("npm-install-checks");
const npmVersion = npmRequire("./package.json").version;

function isForThisMachine(entry) {
  try {
    checkEngine(entry, npmVersion, process.version);
    checkPlatform(entry);
    return true;
  } catch {
    return false;
  }
}

const lock = JSON.parse(
  readFileSync(path.join(root, "package-lock.json"), "utf8"),
);

// Only the packages that name a platform. Whether npm installs any other
// optional package depends on which packages need it, and its entry in the
// lockfile doesn't say.
const expected = Object.entries(lock.packages)
  .filter(
    ([, entry]) =>
      entry.optional &&
      (entry.os || entry.cpu || entry.libc) &&
      isForThisMachine(entry),
  )
  .map(([location]) => location);

const missing = expected.filter(
  (location) => !existsSync(path.join(root, location, "package.json")),
);

const machine = `${process.platform}-${process.arch}`;

if (expected.length === 0) {
  console.error(
    `package-lock.json names no optional package for ${machine}, so this check tested nothing.`,
  );
  process.exit(1);
}

if (missing.length > 0) {
  console.error(
    `npm ci left out ${missing.length} of the ${expected.length} optional packages package-lock.json gives ${machine}:`,
  );
  for (const location of missing) console.error(`  ${location}`);
  console.error(
    "npm exits 0 when an optional package fails to install. Install again. In an image build this step is not cached, so building again does.",
  );
  process.exit(1);
}

console.log(
  `All ${expected.length} optional packages for ${machine} are installed.`,
);
