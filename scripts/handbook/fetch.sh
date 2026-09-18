#!/usr/bin/env bash
# Fetches the Student Parliament (sp.euba.sk) pages that back the "Univerzita"
# handbook screen and stores their plain text in raw/.
#
# Usage:  bash scripts/handbook/fetch.sh
#
# Notes:
#   * euba.sk answers 403 to curl's default User-Agent, so a browser UA is sent.
#   * One request at a time with a pause in between; no retry loops.
#   * The extractor keeps only the article body (div.contentT) plus the page
#     title, decodes entities, collapses whitespace and keeps one block element
#     per line so that `git diff` / `diff` over raw/ stays readable.
#   * Link targets are appended in [square brackets] after the link text, because
#     the URLs (catalogue, webmail, Teams, IBAN pages) are the facts we care
#     about and they would be lost by a pure tag strip.
set -euo pipefail

BASE="https://sp.euba.sk"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$DIR/raw"
PAUSE="${PAUSE:-2}"

PATHS=(
  /student/organizacia-studia
  /student/ais
  /student/orientacia-na-univerzite
  /student/stravovanie
  /student/doprava
  /student/kniznica
  /student/isic
  /student/e-mail-a-ms-teams
  /ubytovanie
  /zapoj-sa/prieskumy
  /zapoj-sa/svoc
  /zapoj-sa/euromates
  /zapoj-sa/erasmus
  /zapoj-sa/ponuka-vymennych-programov
  /univerzita/zakladne-informacie
  /kontakt
)

# refresh a subset:  bash scripts/handbook/fetch.sh /kontakt /student/isic
if [ "$#" -gt 0 ]; then
  PATHS=("$@")
fi

mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

first=1
for p in "${PATHS[@]}"; do
  slug="${p##*/}"
  url="$BASE$p"
  [ $first -eq 1 ] || sleep "$PAUSE"
  first=0
  echo "fetch $url"
  if ! curl -sS --fail --max-time 30 --retry 0 -A "$UA" "$url" -o "$TMP/$slug.html"; then
    echo "  FAILED: $url (left previous raw/$slug.txt untouched)" >&2
    continue
  fi
  URL="$url" SLUG="$slug" SRC="$TMP/$slug.html" DST="$OUT/$slug.txt" python3 - <<'PY'
import html, os, re, datetime

src = open(os.environ["SRC"], encoding="utf-8", errors="replace").read()

def block(text, marker, tag="div"):
    """Return the balanced <tag ...> element whose opening tag contains marker."""
    i = text.find(marker)
    if i < 0:
        return ""
    start = text.rfind("<" + tag, 0, i)
    if start < 0:
        return ""
    depth = 0
    for m in re.finditer(r"<%s\b|</%s>" % (tag, tag), text[start:]):
        depth += 1 if m.group(0) != "</%s>" % tag else -1
        if depth == 0:
            return text[start:start + m.end()]
    return text[start:]

title = ""
m = re.search(r'<div class="page-header">.*?<h1[^>]*>(.*?)</h1>', src, re.S)
if m:
    title = re.sub(r"<[^>]+>", " ", m.group(1))

# article pages keep their text in div.contentT; category/blog pages (Ubytovanie,
# Prieskumy) render a list of teasers inside <main id="content"> instead.
body = (block(src, 'itemprop="articleBody"')
        or block(src, 'class="contentT"')
        or block(src, 'class="item-page"')
        or block(src, 'id="content"', "main"))

# Joomla hides e-mail addresses behind a script that fills <span id="cloakID">;
# rebuild the address from that script so the contact data survives in the text.
for cid, expr in re.findall(r"var addy_text([0-9a-f]+)\s*=\s*((?:'[^']*'\s*\+\s*)*'[^']*')", src):
    addr = "".join(re.findall(r"'([^']*)'", expr))
    body = re.sub(r'(?is)(<span id="cloak%s">).*?(</span>)' % cid,
                  lambda m: m.group(1) + addr + m.group(2), body)

# the right-hand section menu is navigation, not content
body = re.sub(r"(?is)<aside\b.*?</aside>", " ", body)
body = re.sub(r'(?is)<p class="readmore">.*?</p>', " ", body)
# the faculty-parliament banner strip and photo galleries repeat on every page
body = re.sub(r'(?is)<div class="bannergroup.*', " ", body)

# drop everything we never want as text
body = re.sub(r"(?is)<(script|style|noscript)\b.*?</\1>", " ", body)
# keep link targets
def anchor(m):
    href, inner = m.group(1).strip(), m.group(2)
    inner_txt = re.sub(r"<[^>]+>", " ", inner)
    if not inner_txt.strip():
        return " "          # image-only link (gallery thumb, banner, teaser image)
    if href and not href.startswith(("#", "javascript:")) and href not in inner_txt:
        return inner + " [" + href + "]"
    return inner
body = re.sub(r'(?is)<a\b[^>]*href="([^"]*)"[^>]*>(.*?)</a>', anchor, body)
body = re.sub(r"(?i)<br\s*/?>", "\n", body)
body = re.sub(r"(?i)</(p|div|li|h[1-6]|tr|table|ul|ol|blockquote)>", "\n", body)
body = re.sub(r"(?i)<(h[1-6])\b[^>]*>", "\n", body)
body = re.sub(r"(?i)</t[dh]>", " | ", body)
body = re.sub(r"<[^>]+>", " ", body)
body = html.unescape(body)
body = body.replace(" ", " ").replace("​", "")
lines = [re.sub(r"[ \t]+", " ", ln).strip(" |") for ln in body.split("\n")]
lines = [ln.strip() for ln in lines if ln.strip()]

out = [
    "SOURCE: " + os.environ["URL"],
    "FETCHED: " + datetime.date.today().isoformat(),
    "",
]
if title.strip():
    out.append("# " + re.sub(r"\s+", " ", html.unescape(title)).strip())
    out.append("")
out += lines
open(os.environ["DST"], "w", encoding="utf-8").write("\n".join(out) + "\n")
print("  -> raw/%s.txt (%d chars of text)" % (os.environ["SLUG"], sum(len(l) for l in lines)))
PY
done

echo "done: $(ls -1 "$OUT" | wc -l) files in $OUT"
