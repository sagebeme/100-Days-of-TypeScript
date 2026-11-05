#!/usr/bin/env bash
# Puts together the course website for GitHub Pages, in the folder given (default _site):
#   site/                    the website itself
#   phase-*/day-*/README.md  the lessons, which the website fetches as they are
#   index.html               sends the address with no path to site/
# Nothing else from the repository is published: links in a lesson to any other file open on GitHub.
# Every path in the site is relative, so it works under https://<owner>.github.io/<repo>/.
# Try it locally the way Pages serves it, under a subpath:
#   scripts/build-pages.sh /tmp/pages/100-Days-of-TypeScript
#   python3 -m http.server 8000 -d /tmp/pages   # then open http://localhost:8000/100-Days-of-TypeScript/
set -euo pipefail

cd "$(dirname "$0")/.."
out="${1:-_site}"

rm -rf "$out"
mkdir -p "$out"
cp -R site "$out/site"
for readme in phase-*/day-*/README.md; do
  mkdir -p "$out/$(dirname "$readme")"
  cp "$readme" "$out/$readme"
done
cat > "$out/index.html" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>100 Days of TypeScript</title>
<meta http-equiv="refresh" content="0; url=site/">
<link rel="canonical" href="site/">
<p><a href="site/">100 Days of TypeScript</a></p>
HTML

echo "Built $out: the website and $(ls "$out"/phase-*/day-*/README.md | wc -l) lessons"
