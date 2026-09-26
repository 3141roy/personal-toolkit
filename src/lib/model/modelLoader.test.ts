import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isCached, loadModel } from './modelLoader';

function createFakeCaches() {
  const store = new Map<string, Response>();
  return {
    open: async () => ({
      match: async (key: string) => {
        const cached = store.get(key);
        return cached ? cached.clone() : undefined;
      },
      put: async (key: string, response: Response) => {
        store.set(key, response);
      },
    }),
  };
}

describe('modelLoader', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('isCached returns false when nothing is cached', async () => {
    vi.stubGlobal('caches', createFakeCaches());
    expect(await isCached('https://example.test/model.onnx')).toBe(false);
  });

  it('loadModel fetches and caches on a miss', async () => {
    vi.stubGlobal('caches', createFakeCaches());
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const fetchMock = vi.fn(async () => new Response(bytes, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadModel('https://example.test/model.onnx');

    expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await isCached('https://example.test/model.onnx')).toBe(true);
  });

  it('loadModel serves from cache without fetching again', async () => {
    vi.stubGlobal('caches', createFakeCaches());
    const bytes = new Uint8Array([9, 9]).buffer;
    const fetchMock = vi.fn(async () => new Response(bytes, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await loadModel('https://example.test/model.onnx');
    await loadModel('https://example.test/model.onnx');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loadModel throws when the fetch response is not ok', async () => {
    vi.stubGlobal('caches', createFakeCaches());
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404 })),
    );

    await expect(loadModel('https://example.test/missing.onnx')).rejects.toThrow('404');
  });
});
