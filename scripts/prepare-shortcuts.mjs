import { copyFile, mkdir } from 'node:fs/promises';
import { shortcuts } from '../site/shortcuts.mjs';

// Publish actual index pages so shared aliases also resolve on a first visit.
const site = new URL('../site/', import.meta.url);
for (const path of ['go', ...shortcuts.map(item => item.code)]) {
  const dir = new URL(path + '/', site);
  await mkdir(dir, { recursive: true });
  await copyFile(new URL('404.html', site), new URL('index.html', dir));
}
