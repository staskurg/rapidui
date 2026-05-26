import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "lib/docs/content");

/** Reads a markdown file from lib/docs/content/{name}.md */
export function readDoc(name: string): string {
  const filePath = path.join(CONTENT_DIR, `${name}.md`);
  return fs.readFileSync(filePath, "utf8");
}
