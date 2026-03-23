import { readFile, writeFile } from 'node:fs/promises';

const metadataPath = new URL('../src/lib/metadata.ts', import.meta.url);
const content = await readFile(metadataPath, 'utf-8');
const today = new Date().toISOString().slice(0, 10);

const updated = content.replace(/displayedAsOf:\s*'[^']+'/, `displayedAsOf: '${today}'`);

if (updated === content) {
  console.log('No displayedAsOf field found to update.');
  process.exit(1);
}

await writeFile(metadataPath, updated, 'utf-8');
console.log(`Updated displayedAsOf to ${today}`);
