import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { collections, COLLECTION_NAMES, validateContent, type CollectionName, type ContentIssue, type RawContent, type ValidationResult } from "./index.js";

export const CONTENT_DIR = "src/content";
export const ASSETS_DIR = "src/assets";

const exists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );

/**
 * Reads every collection file present in a site repo. A collection whose file
 * is absent is simply not part of that site. Malformed JSON is reported as an
 * issue rather than thrown, so the builder can show it like any other.
 */
export async function readContent(siteDir: string): Promise<{ content: RawContent; issues: ContentIssue[] }> {
  const content: RawContent = {};
  const issues: ContentIssue[] = [];
  for (const name of COLLECTION_NAMES) {
    const file = path.join(siteDir, CONTENT_DIR, collections[name].file);
    if (!(await exists(file))) continue;
    try {
      content[name] = JSON.parse(await readFile(file, "utf8"));
    } catch (err) {
      issues.push({ collection: name, path: "", message: `${collections[name].file} is not valid JSON: ${(err as Error).message}` });
    }
  }
  return { content, issues };
}

/** Writes the given collections back, formatted the way a person would. */
export async function writeContent(siteDir: string, content: RawContent, names: readonly CollectionName[]): Promise<void> {
  for (const name of names) {
    const file = path.join(siteDir, CONTENT_DIR, collections[name].file);
    await writeFile(file, JSON.stringify(content[name], null, 2) + "\n", "utf8");
  }
}

/**
 * The builder's gate before `astro build`: every collection file parses and
 * matches the contract, references resolve, and every gallery image exists.
 */
export async function validateSite(siteDir: string): Promise<ValidationResult> {
  const { content, issues } = await readContent(siteDir);
  const result = validateContent(content);
  const all = [...issues, ...(result.ok ? [] : result.issues)];
  if (result.ok) {
    for (const [i, item] of (result.content.gallery ?? []).entries()) {
      if (!(await exists(path.join(siteDir, ASSETS_DIR, item.src)))) {
        all.push({ collection: "gallery", path: `/${i}/src`, message: `No image at src/assets/${item.src}` });
      }
    }
  }
  return all.length ? { ok: false, issues: all } : (result as ValidationResult);
}

export function formatIssues(issues: readonly ContentIssue[]): string {
  return issues.map((i) => `${i.collection}${i.path}: ${i.message}`).join("\n");
}
