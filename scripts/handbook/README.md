# Handbook data

`public/handbook.js` is generated. Never edit it by hand — edit the sources here and rebuild:

```bash
bash scripts/handbook/fetch.sh          # refresh raw/ from sp.euba.sk (git-ignored)
node scripts/handbook/build.mjs         # facts.json + translations.json -> public/handbook.js
```

| File | What it holds |
| --- | --- |
| `screen.json` | the cards, their order, icons and source links |
| `facts.json` | the facts themselves, in Slovak, written in our own words |
| `translations.json` | the same facts in ru, uk and en; a missing string falls back to Slovak |
| `fetch.sh` | downloads the public pages into `raw/` so a change is a `git diff` away |
| `thumbs.sh` | turns the full-size images into the 240px thumbnails the cards wear |

`raw/` is deliberately not part of the repository: it is the university's own text, downloaded to
compare against, not to republish. The facts that ship are rewritten, each card carries a link to
its source page and the date it was last checked.
