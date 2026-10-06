#!/usr/bin/env python3
"""Check every week's reading passage against the CEI 2008 text on bibbiaedu.it.

    python3 scripts/verify-passages.py            # all weeks
    python3 scripts/verify-passages.py 26 27      # just these weeks

For each `passage` in courses/it-bible-cei/exercises.js it expands the `ref`
(e.g. "Atti 22,26-28; 23,11") into chapter/verse pairs, fetches those chapters,
and compares the verse text. Quote marks are ignored (the site prints straight
quotes; the course uses guillemets) and a trailing "[" footnote artefact is
stripped, so any DIFF it prints is a real wording difference.

Needs network. Pages are slow (~30 s each), so chapters are cached in
$TMPDIR/cei-cache. Exits 1 if any verse differs.
"""
import html, json, os, re, subprocess, sys, tempfile, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.environ.get("CEI_CACHE") or os.path.join(tempfile.gettempdir(), "cei-cache")
BOOKS = {"Giovanni": ("nt", "Gv"), "Luca": ("nt", "Lc"), "Atti": ("nt", "At"),
         "Romani": ("nt", "Rm"), "Salmo": ("ot", "Sal")}


def passages():
    js = ("import { EXERCISES } from '%s/courses/it-bible-cei/exercises.js';"
          "const o={};for(const [n,w] of Object.entries(EXERCISES))"
          "if(w.passage)o[n]={ref:w.passage.ref,verses:w.passage.verses.map(v=>({n:v.n,t:v.t}))};"
          "console.log(JSON.stringify(o))" % ROOT)
    out = subprocess.run(["node", "--input-type=module", "-e", js], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def expand(ref):
    book, rest = ref.split(" ", 1)
    out, ch = [], None
    for part in rest.split(";"):
        part = part.strip()
        if "," in part:
            c, vs = part.split(",", 1)
            ch = int(c)
        else:
            vs = part
        for seg in vs.split("."):
            if "-" in seg:
                a, b = map(int, seg.split("-"))
                out += [(ch, x) for x in range(a, b + 1)]
            else:
                out.append((ch, int(seg)))
    return book, out


def chapter(book, ch):
    testament, code = BOOKS[book]
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"{code}-{ch}.html")
    if not os.path.exists(path):
        req = urllib.request.Request(f"https://www.bibbiaedu.it/CEI2008/{testament}/{code}/{ch}/",
                                     headers={"User-Agent": "Mozilla/5.0"})
        for attempt in range(4):
            try:
                open(path, "w", encoding="utf-8").write(urllib.request.urlopen(req, timeout=90).read().decode("utf-8"))
                break
            except Exception:
                time.sleep(3 * (attempt + 1))
        else:
            raise SystemExit(f"could not fetch {book} {ch}")
    h = open(path, encoding="utf-8").read()
    verses = {}
    # Verses with a footnote use a <button> for the number instead of <sup>.
    for m in re.finditer(r'<span class="text-to-speech">\s*(?:<sup><span class="verse_number">(\d+)</span></sup>'
                         r'|<button[^>]*>(\d+)</button>)(?:<!--.*?-->)?(.*?)</span>', h, re.S):
        t = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(3)))).strip()
        verses[int(m.group(1) or m.group(2))] = t
    return verses


def norm(t):
    t = t.replace("«", '"').replace("»", '"').replace("“", '"').replace("”", '"').replace("’", "'")
    t = re.sub(r'["\s]+', " ", t)
    t = re.sub(r"\s+([,.;:!?])", r"\1", t)
    return re.sub(r"\s*\[\s*$", "", t.strip())


def main(only):
    bad = 0
    for wk, p in passages().items():
        if only and wk not in only:
            continue
        book, exp = expand(p["ref"])
        issues = []
        if len(exp) != len(p["verses"]):
            issues.append(f"ref lists {len(exp)} verses, data has {len(p['verses'])}")
        for (ch, v), r in zip(exp, p["verses"]):
            site = chapter(book, ch).get(v)
            if site is None:
                issues.append(f"{ch},{v}: not found on the site")
            elif r["n"] != v:
                issues.append(f"{ch},{v}: data is numbered {r['n']}")
            elif norm(site) != norm(r["t"]):
                issues.append(f"{ch},{v}: DIFF\n      course: {r['t']}\n      site:   {site}")
        print(f"week {wk:>2}  {p['ref']:<34}", "OK" if not issues else f"{len(issues)} issue(s)")
        for i in issues:
            print("   ", i)
        bad += bool(issues)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main(set(sys.argv[1:]))
