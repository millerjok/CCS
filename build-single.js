/* Bundles the app into one file you can upload anywhere (tiiny.site, a VLE,
 * a USB stick) exactly the way the flashcard app in this repo is deployed:
 *
 *   node ccs/build-single.js            -> ccs/ccs-standalone.html
 *   node ccs/build-single.js --body out -> markup only, no <html> wrapper
 *
 * Everything is inlined except the Google font and the sound effects, which
 * stay as they are: both degrade quietly when they cannot be reached.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const bodyOnly = process.argv.indexOf('--body') !== -1;
const outArg = bodyOnly ? process.argv[process.argv.indexOf('--body') + 1] : null;
const out = outArg || path.join(dir, 'ccs-standalone.html');

let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

/* Local hrefs/srcs carry a "?v=N" cache-buster for the real deployment (so a
 * browser or GitHub's CDN can never serve stale JS/CSS after a push again);
 * strip it before resolving to a file on disk. */
function localPath(src) { return path.join(dir, src.replace(/\?.*$/, '')); }

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, function (_, href) {
  return '<style>\n' + fs.readFileSync(localPath(href), 'utf8') + '\n</style>';
});

/* Inlines every local js/*.js file (defer or not - the attribute is dropped,
 * since an inlined script always runs synchronously anyway). External CDN
 * scripts (the optional Firebase SDK for shared word packs) are left exactly
 * as they are - they can't be bundled, and still work fine standalone. */
html = html.replace(/<script src="([^"]+)"[^>]*><\/script>/g, function (whole, src) {
  if (/^https?:\/\//.test(src)) return whole;
  return '<script>\n' + fs.readFileSync(localPath(src), 'utf8') + '\n</script>';
});

if (bodyOnly) {
  /* Keep the title and styles, drop the document wrapper. */
  const title = (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
  const fonts = html.match(/<link[^>]+fonts\.(googleapis|gstatic)[^>]*>/g) || [];
  const styles = html.match(/<style>[\s\S]*?<\/style>/g) || [];
  const body = (html.match(/<body>([\s\S]*)<\/body>/) || [, ''])[1];
  html = title + '\n' + fonts.join('\n') + '\n' + styles.join('\n') + '\n' + body;
}

fs.writeFileSync(out, html);
console.log('wrote ' + path.relative(process.cwd(), out) + ' (' + Math.round(html.length / 1024) + ' KB)');
