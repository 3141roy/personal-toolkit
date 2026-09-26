const CACHE_NAME = 'bundle-models-v1';

export async function isCached(url: string): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  const match = await cache.match(url);
  return match !== undefined;
}

export async function loadModel(url: string): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(url);
  if (cached) return cached.arrayBuffer();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`modelLoader: failed to fetch ${url} (status ${response.status})`);
  }
  await cache.put(url, response.clone());
  return response.arrayBuffer();
}
