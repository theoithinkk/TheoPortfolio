#!/bin/sh
# Build command for the Cloudflare Worker (theo-writeups) behind writeups.theoith.ink.
# Output is _site/: the CTF writeups and only the assets they load, with writeups/index.html as the
# home page. The rest of the portfolio (homepage, projects, CV) is never copied, so it can't be reached there.
# The writeup pages link with ../../ paths, which resolve to the root here, so they need no changes.
set -e
rm -rf _site
mkdir -p _site/img
cp -R writeups/. _site/
cp style.css paper.css prefs.js favicon.svg _headers _site/   # the only root files writeup pages load
cp -R fonts _site/
cp -R img/icons img/paper _site/img/
