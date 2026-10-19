const HOST = 'bundle.tools';
const ORIGIN = `https://${HOST}`;
const KEY = process.env.INDEXNOW_KEY;
const SITEMAP = `${ORIGIN}/sitemap-0.xml`;
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

if (!KEY) {
  throw new Error('indexnow: INDEXNOW_KEY is not set, add it to .env');
}
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;

async function allUrls() {
  const response = await fetch(SITEMAP);
  if (!response.ok) {
    throw new Error(`indexnow: failed to fetch sitemap (status ${response.status})`);
  }
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function toUrl(arg) {
  if (arg.startsWith('http')) return arg;
  return `${ORIGIN}${arg.startsWith('/') ? arg : `/${arg}`}`;
}

const args = process.argv.slice(2);
const urlList = args.length ? args.map(toUrl) : await allUrls();

const offHost = urlList.filter((url) => new URL(url).host !== HOST);
if (offHost.length) {
  throw new Error(`indexnow: urls not on ${HOST}: ${offHost.join(', ')}`);
}

const keyCheck = await fetch(KEY_LOCATION);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  throw new Error('indexnow: key file not live on the site, deploy first');
}

console.log(`indexnow: submitting ${urlList.length} url(s)`);
const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

if (response.status !== 200 && response.status !== 202) {
  throw new Error(`indexnow: rejected with status ${response.status}`);
}
console.log(`indexnow: accepted (status ${response.status})`);
