#!/usr/bin/env node
// Static site builder for occamlang.org — no dependencies.
//
// Each file in src/pages/**.html starts with a metadata comment:
//   <!--meta {"title": "...", "description": "...", "section": "learn"} -->
// and is wrapped in src/layout.html. Assets are copied verbatim.
// Output goes to dist/ using relative links so it also works from file://.

import { readFile, writeFile, mkdir, readdir, cp, rm, stat } from "node:fs/promises";
import { join, relative, dirname, posix } from "node:path";

const SRC = "src";
const OUT = "dist";

const NAV = [
  { href: "history.html", label: "History", section: "history" },
  { href: "csp.html", label: "CSP", section: "csp" },
  { href: "implementations.html", label: "Implementations", section: "implementations" },
  { href: "learn/index.html", label: "Learn", section: "learn" },
  { href: "archive.html", label: "Archive", section: "archive" },
  { href: "hardware.html", label: "Hardware", section: "hardware" },
];

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

function parseMeta(src, file) {
  const m = src.match(/^<!--meta\s+([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> header`);
  return { meta: JSON.parse(m[1]), body: src.slice(m[0].length) };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });
  for (const f of ["CNAME", "robots.txt", "favicon.svg"]) {
    await cp(join(SRC, f), join(OUT, f)).catch(() => {});
  }

  const layout = await readFile(join(SRC, "layout.html"), "utf8");
  const pages = (await walk(join(SRC, "pages"))).filter((p) => p.endsWith(".html"));
  const urls = [];

  for (const file of pages) {
    const rel = relative(join(SRC, "pages"), file).split("\\").join("/");
    const depth = rel.split("/").length - 1;
    const root = depth ? "../".repeat(depth) : "./";
    const { meta, body } = parseMeta(await readFile(file, "utf8"), file);

    const nav = NAV.map(
      (n) =>
        `<a href="${root}${n.href}"${n.section === meta.section ? ' aria-current="page"' : ""}>${n.label}</a>`
    ).join("\n        ");

    const title = meta.title === "occam" ? "occam — the language of communicating processes" : `${meta.title} — occam`;
    const html = layout
      .replaceAll("{{title}}", esc(title))
      .replaceAll("{{description}}", esc(meta.description || ""))
      .replaceAll("{{section}}", esc(meta.section || ""))
      .replaceAll("{{canonical}}", `https://occamlang.org/${rel === "index.html" ? "" : rel}`)
      .replace("{{nav}}", nav)
      .replace("{{content}}", body.replaceAll("{{root}}", root))
      .replaceAll("{{root}}", root);

    const dest = join(OUT, rel);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, html);
    urls.push(rel === "index.html" ? "" : rel);
  }

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.sort().map((u) => `  <url><loc>https://occamlang.org/${posix.normalize(u).replace(/^\.$/, "")}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  await writeFile(join(OUT, "sitemap.xml"), sitemap);
  console.log(`built ${pages.length} pages → ${OUT}/`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
