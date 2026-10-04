# occamlang.org

Source for [occamlang.org](https://occamlang.org), also reachable at occam-lang.org. The site covers the
occam programming language: its history and CSP foundations, its implementations
(Razor, SPoC, KRoC and others), tutorials, a research archive, CSP/FDR, and hardware
(the transputer, Handel-C, FPGAs and XMOS).

## Build

No dependencies beyond Node 18 or later.

```sh
npm run build     # src/ → dist/
npm run check     # build, then verify all internal links and #anchors
npm run serve     # build, then serve dist/ on http://localhost:8000
```

The output uses relative links, so `dist/index.html` also works when opened straight from disk.

## Layout

```
build.mjs                  tiny static-site builder (layout + pages → dist/)
src/layout.html            shared page shell: header, nav, footer
src/pages/**.html          page bodies; each starts with <!--meta {"title", "description", "section"} -->
src/assets/css/site.css    all styles, including light/dark tokens
src/assets/js/occam-highlight.js   occam listings: highlighting and {{{ }}} folds
src/assets/js/procnet.js           nested Welch-style process diagrams
src/assets/js/site.js              preferences, fold tools, TOC
src/assets/data/papers.js          archive catalogue (papers + collections)
docs/sources.md            verified source URLs used for content
tools/check-links.mjs      internal link checker
```

`{{root}}` in a page is replaced by the relative path to the site root.

## Authoring conventions

**Folds.** Page sections use folds in the style of the Inmos TDS:

```html
<details class="fold" open id="slug">
  <summary><h2>Title</h2></summary>
  <div class="fold-body"> … </div>
</details>
```

**occam listings.** Write `<pre class="occam">` with keywords in upper case. Fold markers
inside the code work too: `{{{ title` opens a fold, `{{{! title` opens one that starts closed,
and `}}}` closes it. The header's SEQ/seq button switches every listing between Inmos
typescript and the hand-written lecture-note style (lower case, underlined keywords).
Use `<pre class="code">` for other languages.

**Process diagrams.** Coordinates are node centres. Nodes with `net` open in place, and nodes
with `href` are links. Channel endpoints are node ids or `[x, y]` points for external
channels. See the comment at the top of `procnet.js` for the full schema.

```html
<div class="procnet"><script type="application/json">
{ "title": "numbers", "w": 640, "h": 280, "boundary": true, "animate": true,
  "nodes": [ { "id": "d", "label": "delta", "x": 420, "y": 110 } ],
  "chans": [ { "from": "d", "to": [626, 110], "label": "out" } ] }
</script></div>
```

**Archive entries.** Add hand-picked papers to `OCCAM_PAPERS` in `src/assets/data/papers.js`.
They appear as "key" papers. A WoTUG record with the same title is merged into the curated entry.

`src/assets/data/wotug.js` is generated from the WoTUG paper database (708 papers, 1987–2013)
by `python3 tools/import-wotug.py`. That database's server often refuses connections, so the
importer caches every page in `.cache/wotug/` (gitignored) and only re-fetches pages that came
back with an error. Re-run it with `--passes N` to recover more abstracts, or with `--offline`
to regenerate from the cache alone. Topic tags are assigned automatically by keyword.

## Deploy

`.github/workflows/deploy.yml` builds, link-checks and publishes `dist/` to GitHub Pages on a
push to `main`. `src/CNAME` sets the custom domain to occamlang.org. To make occam-lang.org
redirect there, point its DNS at the same host, or set up a redirect with your registrar.
