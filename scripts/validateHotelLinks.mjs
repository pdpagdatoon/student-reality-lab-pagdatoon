import { readFile } from 'node:fs/promises';

const serverPath = new URL('../api/server.js', import.meta.url);
const source = await readFile(serverPath, 'utf-8');

const urls = [...source.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]);
const uniqueUrls = [...new Set(urls)];

if (uniqueUrls.length === 0) {
  console.log('No hotel URLs found in api/server.js');
  process.exit(0);
}

const checkUrl = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const head = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);
    if (head.ok) return { url, status: head.status, ok: true, method: 'HEAD' };
  } catch {
    // Fall through to GET.
  }

  try {
    const getController = new AbortController();
    const getTimeout = setTimeout(() => getController.abort(), 10000);
    const get = await fetch(url, { method: 'GET', redirect: 'follow', signal: getController.signal });
    clearTimeout(getTimeout);
    return { url, status: get.status, ok: get.ok, method: 'GET' };
  } catch {
    return { url, status: 0, ok: false, method: 'GET' };
  }
};

const results = [];
for (const url of uniqueUrls) {
  results.push(await checkUrl(url));
}

const failed = results.filter(r => !r.ok);
results.forEach(r => {
  const mark = r.ok ? 'OK' : 'FAIL';
  console.log(`${mark} [${r.method}] ${r.status} ${r.url}`);
});

console.log(`\nChecked ${results.length} hotel URLs. Failures: ${failed.length}`);
if (failed.length > 0) process.exit(1);
