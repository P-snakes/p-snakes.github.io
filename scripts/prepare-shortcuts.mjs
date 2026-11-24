import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { shortcuts } from '../site/shortcuts.mjs';

const site = new URL('../site/', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
const files = (await readdir(site, { withFileTypes: true }))
  .filter(entry => entry.isFile()).map(entry => entry.name).sort();
const assets = files.filter(name => /\.(mjs|css)$/.test(name));
const hash = createHash('sha256');
for (const name of assets) {
  hash.update(name + '\0').update(await readFile(new URL(name, site)));
}
const assetPath = 'assets/' + hash.digest('hex').slice(0, 16) + '/';
const assetDir = new URL(assetPath, dist);
await mkdir(assetDir, { recursive: true });

// Keep the original root assets available to visitors holding an older HTML page.
for (const name of files) {
  await copyFile(new URL(name, site), new URL(name, dist));
}
for (const name of assets) {
  await copyFile(new URL(name, site), new URL(name, assetDir));
}
for (const page of ['index.html', '404.html']) {
  const html = await readFile(new URL(page, site), 'utf8');
  const versioned = html.replace(/(src|href)="\.?\/(style\.css|app\.mjs|direct\.mjs)"/g,
    (_, attr, name) => attr + '="/' + assetPath + name + '"');
  await writeFile(new URL(page, dist), versioned);
}
for (const path of ['go', ...shortcuts.map(item => item.code)]) {
  const dir = new URL(path + '/', dist);
  await mkdir(dir, { recursive: true });
  await copyFile(new URL('404.html', dist), new URL('index.html', dir));
}
