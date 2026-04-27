import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const chatJs = readFileSync(join(__dirname, '../api/chat.js'), 'utf-8');

// Extract all URLs from the DESTINATION_HOTELS object
const urlRegex = /url:\s*['"]([^'"]+)['"]/g;
const urls = [];
let match;
while ((match = urlRegex.exec(chatJs)) !== null) {
  urls.push(match[1]);
}

console.log(`Found ${urls.length} hotel URLs to validate...\n`);

const results = [];
let broken = 0;

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StudentRealityLabBot/1.0)'
      }
    });
    clearTimeout(timeout);
    const finalUrl = res.url || url;
    const domainChanged = new URL(url).hostname !== new URL(finalUrl).hostname;
    const status = res.status;
    if (status >= 200 && status < 300 && !domainChanged) {
      return { url, status, result: 'OK', finalUrl };
    }
    if (domainChanged) {
      return { url, status, result: 'REDIRECT_DOMAIN', finalUrl };
    }
    return { url, status, result: 'ERROR', finalUrl };
  } catch (err) {
    return { url, status: 0, result: 'TIMEOUT_OR_ERROR', error: String(err) };
  }
}

(async () => {
  for (const u of urls) {
    process.stdout.write(`Checking ${u} ... `);
    // normalize
    let url = u;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const r = await checkUrl(url);
    results.push(r);
    if (r.result === 'OK') console.log(`✅ ${r.status}`);
    else if (r.result === 'REDIRECT_DOMAIN') { console.log(`⚠️ ${r.status} DOMAIN CHANGED -> ${r.finalUrl}`); broken++; }
    else if (r.result === 'ERROR') { console.log(`❌ ${r.status}`); broken++; }
    else { console.log(`❌ ${r.result}`); broken++; }
  }

  const report = {
    checkedAt: new Date().toISOString(),
    total: urls.length,
    broken,
    ok: urls.length - broken,
    results,
  };

  writeFileSync(join(__dirname, '../data/hotel-link-audit.json'), JSON.stringify(report, null, 2));
  console.log(`\n📊 Summary: ${report.ok} OK, ${broken} broken of ${urls.length} total`);
  console.log(`Report saved to data/hotel-link-audit.json`);

  if (broken > 0) process.exit(1);
})();
