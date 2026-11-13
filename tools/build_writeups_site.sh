#!/bin/sh
# Build command for the Cloudflare Pages project behind writeups.theoith.ink.
# Output is _site/: the CTF writeups and only the assets they load, with writeups/index.html as the
# home page. The rest of the portfolio (homepage, projects, CV) is never copied, so it can't be reached there.
# The writeup pages link with ../../ paths, which resolve to the root here, so they need no changes.
set -e
rm -rf _site
mkdir -p _site/img
cp -R writeups/. _site/
cp *.css favicon.svg _headers _site/
cp prefs.js _site/ 2>/dev/null || true   # only the older page design loads it
cp -R fonts _site/
cp -R img/icons img/paper _site/img/
