// Verify every relative href/src in dist/ points at an existing file (and #anchor).
import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";

async function walk(d) {
  const out = [];
  for (const n of await readdir(d)) {
    const p = join(d, n);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith(".html")) out.push(p);
  }
  return out;
}
const exists = (p) => stat(p).then(() => true, () => false);
const ids = new Map();
async function idsOf(file) {
  if (!ids.has(file)) ids.set(file, new Set([...(await readFile(file, "utf8")).matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
}

let bad = 0;
for (const file of await walk("dist")) {
  const html = await readFile(file, "utf8");
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(url) || url.includes("' +")) continue; // skip JS string templates
    const [path, hash] = url.split("#");
    const target = path ? resolve(dirname(file), path) : resolve(file);
    if (!(await exists(target))) { console.log(`${file}: missing ${url}`); bad++; continue; }
    if (hash && target.endsWith(".html") && !(await idsOf(target)).has(hash)) { console.log(`${file}: missing anchor ${url}`); bad++; }
  }
}
console.log(bad ? `${bad} broken link(s)` : "all internal links ok");
process.exit(bad ? 1 : 0);
