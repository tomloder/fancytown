/**
 * generate-manifests.js
 *
 * Run this with Node.js after adding/removing content files:
 *   node generate-manifests.js
 *
 * It scans each _data/ subfolder and writes a _manifest.json listing all files.
 * This lets the browser fetch content without needing a server-side directory listing.
 *
 * For GitHub Pages + Decap CMS, add this as a GitHub Action that runs on every push.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '_data');

const folders = ['events', 'news', 'sponsors', 'hpde', 'anniversaries', 'newsletter'];

folders.forEach(folder => {
  const dir = path.join(DATA_DIR, folder);
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f !== '_manifest.json')
    .sort();

  const manifestPath = path.join(dir, '_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(files, null, 2));
  console.log(`✓ ${folder}/_manifest.json — ${files.length} file(s)`);
});

console.log('\nDone! Commit the updated _manifest.json files.');
