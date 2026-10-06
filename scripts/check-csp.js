#!/usr/bin/env node
/*
 * Verify (default) or update (--write) the CSP hashes in index.html.
 *
 * The Content-Security-Policy <meta> allows exactly one inline <script> and one
 * inline <style> by SHA-256 hash. Editing either block changes its hash, so:
 *   node scripts/check-csp.js          # exit 1 if the hashes are stale
 *   node scripts/check-csp.js --write  # recompute and update the meta tag
 *
 * Browsers hash the element's text after the HTML parser normalises CRLF to LF,
 * so we do the same (Windows checkouts may have CRLF on disk).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const file = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(file, "utf8");
const normalised = html.replace(/\r\n?/g, "\n");

function blockHash(tag) {
  const matches = [...normalised.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))];
  if (matches.length !== 1) {
    console.error(`Expected exactly one <${tag}> block, found ${matches.length}.`);
    process.exit(1);
  }
  return crypto.createHash("sha256").update(matches[0][1], "utf8").digest("base64");
}

const want = { script: blockHash("script"), style: blockHash("style") };
const meta = normalised.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
if (!meta) {
  console.error("No Content-Security-Policy <meta> tag found.");
  process.exit(1);
}
const have = {
  script: (meta[1].match(/script-src 'sha256-([^']+)'/) || [])[1],
  style: (meta[1].match(/style-src 'sha256-([^']+)'/) || [])[1],
};

if (process.argv.includes("--write")) {
  const updated = html
    .replace(/(script-src 'sha256-)[^']+(')/, `$1${want.script}$2`)
    .replace(/(style-src 'sha256-)[^']+(')/, `$1${want.style}$2`);
  fs.writeFileSync(file, updated);
  console.log(`CSP hashes written: script sha256-${want.script}, style sha256-${want.style}`);
  process.exit(0);
}

let ok = true;
for (const k of ["script", "style"]) {
  if (have[k] !== want[k]) {
    ok = false;
    console.error(`CSP ${k}-src hash is stale: meta has ${have[k]}, block hashes to ${want[k]}.`);
  }
}
if (!ok) {
  console.error("Run: node scripts/check-csp.js --write");
  process.exit(1);
}
console.log("CSP hashes match the <script> and <style> blocks.");
