#!/usr/bin/env python3
"""Import the WoTUG paper database into src/assets/data/wotug.js.

The WoTUG paper database (https://www.wotug.org/paperdb/) is backed by a
MySQL server that often refuses connections, so every page is cached under
.cache/wotug/ and re-fetched only while it still contains a database error.
Re-run the script to fill gaps; each run keeps everything it has already got.

    python3 tools/import-wotug.py            # fetch what's missing, then generate
    python3 tools/import-wotug.py --offline  # generate from the cache only
    python3 tools/import-wotug.py --passes 5 # extra retry passes for detail pages
    python3 tools/import-wotug.py --mirror   # also download papers/slides into src/papers/wotug/

Mirrored files are served from occamlang.org so the corpus survives if wotug.org goes;
links in the generated data then point at the local copy.
"""
import argparse, html, json, os, re, shutil, sys, time, urllib.request

BASE = "https://www.wotug.org/paperdb/"
CACHE = os.path.join(".cache", "wotug")
OUT = os.path.join("src", "assets", "data", "wotug.js")
MIRROR = os.path.join("src", "papers", "wotug")
MAGIC = {b"%PDF": "pdf", b"%!PS": "ps", b"\xd0\xcf\x11\xe0": "ppt"}
DB_ERROR = "db_connect: Could not connect"


DB_NOISE = re.compile(r'db_connect: Could not connect to paper db at "[^"]*"<br>|\w+: query "[^"]*" failed\.<br>')


def read(path):
    """Cached page text with the database's inline error messages removed."""
    with open(path, "rb") as f:
        data = f.read()
    try:
        return data.decode("utf-8")  # many pages are UTF-8 despite their charset header
    except UnicodeDecodeError:
        return data.decode("latin-1")


def read_clean(path):
    return DB_NOISE.sub("", read(path))


def fetch(url, path, good, attempts=1, delay=0.6):
    """Fetch url into path unless a cached copy satisfies good(text)."""
    if os.path.exists(path) and good(read(path)):
        return True
    for _ in range(attempts):
        try:
            data = urllib.request.urlopen(url, timeout=40).read()
            with open(path, "wb") as f:
                f.write(data)
            if good(read(path)):
                return True
        except Exception:
            pass
        time.sleep(delay)
    return False


def clean(t):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", t))).strip()


def absolute(href):
    if href.startswith("http"):
        return href
    return "https://www.wotug.org" + (href if href.startswith("/") else "/paperdb/" + href)


TOPICS = [
    ("csp", r"\bCSP\b|\bFDR\b|refinement|process algebra|formal|semantic|model.?check|verif|proof|pi-calculus|π-calculus|algebra"),
    ("language", r"occam|language|\bmobile|type system|syntax|\bhoneysuckle|\brain\b|channel type|extension"),
    ("implementation", r"compil|kernel|run-?time|schedul|\bKRoC\b|transterpreter|\bJCSP\b|C\+\+CSP|PyCSP|library|virtual machine|implementation|\bCCSP\b"),
    ("hardware", r"transputer|\bFPGA|hardware|\bT9000|\bT800|\bT414|\bVLSI|silicon|\blink|router|Handel|SpaceWire|1355|processor|robot|embedded|chip"),
    ("design", r"deadlock|livelock|design|pattern|client.?server|architecture|real-?time|priority|fault"),
    ("education", r"teach|educat|course|student|curricul|learning"),
]


def topics_for(title, abstract):
    text = title + " " + abstract
    found = [name for name, rx in TOPICS if re.search(rx, text, re.I)]
    return found or ["design"]


def cached_name(url):
    m = re.search(r"send_file\.php\?num=(\d+)", url)
    return f"send_file-{m.group(1)}" if m else re.sub(r"^https?://www\.wotug\.org/", "", url).replace("/", "__")


def file_kind(data):
    """Return the extension for complete file data, or None if it is unusable.

    WoTUG's send_file.php sometimes writes database errors ahead of the file but keeps
    the original Content-Length, which silently truncates the end of the file. So only
    data that starts with a known signature *and* ends with its trailer is accepted."""
    for magic, ext in MAGIC.items():
        if data.startswith(magic):
            tail = data[-4096:]
            if ext == "pdf" and b"%%EOF" not in tail:
                return None
            if ext == "ps" and b"%%EOF" not in tail and b"%%Trailer" not in tail:
                return None
            return ext
    return None


def mirror_file(url, offline=False, attempts=10):
    """Return a cached, complete copy of url (with its real extension), downloading if needed."""
    path = os.path.join(CACHE, "files", cached_name(url))

    def kind():
        if not os.path.exists(path):
            return None
        with open(path, "rb") as f:
            return file_kind(f.read())

    for a in range(0 if offline or kind() else attempts):
        try:
            data = urllib.request.urlopen(url, timeout=90).read()
            if file_kind(data):
                with open(path, "wb") as f:
                    f.write(data)
                break
        except Exception:
            pass
        time.sleep(2 + a)
    ext = kind()
    if not ext:
        if not offline:
            print(f"could not mirror {url}", file=sys.stderr)
        return None
    typed = path + "." + ext
    if not os.path.exists(typed) or os.path.getsize(typed) != os.path.getsize(path):
        shutil.copyfile(path, typed)
    return typed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--passes", type=int, default=1)
    ap.add_argument("--mirror", action="store_true", help="download files and serve local copies")
    args = ap.parse_args()
    for d in ("", "procs", "papers", "files"):
        os.makedirs(os.path.join(CACHE, d), exist_ok=True)

    # 1. master list: number, title, authors, year
    list_path = os.path.join(CACHE, "list_papers.html")
    if not args.offline:
        fetch(BASE + "list_papers.php", list_path, lambda t: "show_pap.php" in t, attempts=5)
    rows = re.findall(
        r'<tr><td><a href="show_pap\.php\?f=1&amp;num=(\d+)">(.*?)</a>\s*(.*?)</td><td>(\d*)</td><td>(\d*)</td>',
        read(list_path), re.S)
    papers = {}
    for num, title, authors, year, pages in rows:
        papers[int(num)] = {
            "id": int(num), "t": clean(title), "a": clean(authors).replace(" ,", ","),
            "y": int(year) if year else None, "n": int(pages) if pages else None,
            "p": None, "l": {}, "x": "",
        }

    # 2. proceedings: venue for each paper and file links (union over cached copies,
    #    since a DB error part-way through a page drops some links)
    proc_list = os.path.join(CACHE, "list_proceeds.html")
    if not args.offline:
        fetch(BASE + "list_proceeds.php?f=1", proc_list, lambda t: "show_proc.php" in t, attempts=5)
    procs = {}
    for pnum in sorted({int(n) for n in re.findall(r"show_proc\.php\?f=1&amp;num=(\d+)", read(proc_list))}):
        copies = [os.path.join(CACHE, "procs", f) for f in os.listdir(os.path.join(CACHE, "procs"))
                  if f.split("_")[0].split(".")[0] == str(pnum)]
        if not args.offline:
            for k in range(3):
                path = os.path.join(CACHE, "procs", f"{pnum}_{int(time.time())}_{k}.html")
                if fetch(BASE + f"show_proc.php?f=1&num={pnum}", path, lambda t: "show_pap" in t, attempts=2):
                    copies.append(path)
                if copies and all(DB_ERROR not in read(c) for c in copies[-1:]):
                    break
        meta = {}
        for c in copies:
            t = read_clean(c)
            if "show_pap" not in t:
                continue
            m = re.search(r"<b>Title:</b>(.*?)<br>", t, re.S)
            if m and clean(m.group(1)):
                meta["title"] = clean(m.group(1))
            m = re.search(r"Subtitle:(.*?)<br>", t, re.S)
            if m and clean(m.group(1)):
                meta["sub"] = clean(m.group(1))
            m = re.search(r"<b>Editors:</b>(.*?)<br>", t, re.S)
            if m and clean(m.group(1)):
                meta["ed"] = clean(m.group(1))
            for item in re.findall(r"<li>(.*?)</li>", t, re.S):
                pm = re.search(r"show_pap\.php\?f=1&amp;num=(\d+)", item)
                if not pm or int(pm.group(1)) not in papers:
                    continue
                p = papers[int(pm.group(1))]
                p["p"] = pnum
                for href, label in re.findall(r'<a href="(send_file[^"]+|[^"]+\.pdf)">([^<]*)</a>', item):
                    label = clean(label) or "file"
                    p["l"].setdefault(label, absolute(href))
        if meta:
            years = [papers[i]["y"] for i in papers if papers[i]["p"] == pnum and papers[i]["y"]]
            ym = re.search(r"\b(19|20)\d\d\b", meta.get("title", ""))
            meta["year"] = int(ym.group(0)) if ym else (min(years) if years else None)
            procs[pnum] = meta

    # 3. detail pages: abstracts and any extra files (slides, direct PDFs)
    def detail_ok(t):
        return "<b>Authors:</b>" in t

    ids = sorted(papers)
    for rnd in range(0 if args.offline else args.passes):
        todo = [i for i in ids if not (os.path.exists(os.path.join(CACHE, "papers", f"{i}.html"))
                                       and detail_ok(read(os.path.join(CACHE, "papers", f"{i}.html"))))]
        print(f"detail pass {rnd + 1}: {len(todo)} missing", file=sys.stderr, flush=True)
        for i in todo:
            fetch(BASE + f"show_pap.php?f=1&num={i}", os.path.join(CACHE, "papers", f"{i}.html"), detail_ok, delay=0.4)

    with_abstract = 0
    for i, p in papers.items():
        path = os.path.join(CACHE, "papers", f"{i}.html")
        if not os.path.exists(path):
            continue
        t = read_clean(path)
        if not detail_ok(t):
            continue
        body = t[t.find("Paper Details"):]
        m = re.search(r"<b>Abstract:</b></p>\s*<p>(?!<b>)(.*?)</p>", body, re.S)
        if m and clean(m.group(1)):
            p["x"] = clean(m.group(1))
            with_abstract += 1
        for href, label in re.findall(r'<a href="([^"]+)">([^<]*)</a>', body):
            if re.search(r"\.pdf$|send_file", href):
                key = "slides" if "slide" in href.lower() else (clean(label) or "PDF")
                p["l"].setdefault(key, absolute(href))

    mirrored = 0
    if args.mirror:
        for p in papers.values():
            for label, url in list(p["l"].items()):
                path = mirror_file(url, offline=args.offline)
                if not path:
                    continue
                ext = path.rsplit(".", 1)[-1]
                slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-") or "file"
                dest = os.path.join(MIRROR, str(p["id"]), f"{slug}.{ext}")
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                if not os.path.exists(dest) or os.path.getsize(dest) != os.path.getsize(path):
                    shutil.copyfile(path, dest)
                # site-relative path; the archive page prefixes it with the site root
                p["l"][label] = "papers/wotug/%d/%s.%s" % (p["id"], slug, ext)
                mirrored += 1

    out = []
    for p in sorted(papers.values(), key=lambda p: (p["y"] or 0, p["t"].lower())):
        p["k"] = topics_for(p["t"], p["x"])
        out.append({k: v for k, v in p.items() if v not in (None, "", {}, [])})

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* Generated by tools/import-wotug.py from the WoTUG paper database\n"
                " * (https://www.wotug.org/paperdb/). Do not edit by hand; re-run the importer.\n"
                " * Copyright in the papers and abstracts remains with their authors.\n"
                " * Keys: id, t title, a authors, y year, n pages, p proceedings id, l links,\n"
                " * x abstract, k topics. */\n")
        f.write("window.WOTUG_PROCS = " + json.dumps(procs, ensure_ascii=False, separators=(",", ":")) + ";\n")
        f.write("window.WOTUG_PAPERS = [\n" + ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in out) + "\n];\n")
    linked = sum(1 for p in out if p.get("l"))
    print(f"{len(out)} papers, {len(procs)} proceedings, {with_abstract} abstracts, {linked} with files, "
          f"{mirrored} files mirrored -> {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
