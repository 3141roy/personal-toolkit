const DB_NAME = 'bundle-handoff';
const STORE = 'files';
const KEY = 'pending';
const TTL_MS = 30_000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = op(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export async function stash(file: File): Promise<void> {
  await run('readwrite', (s) => s.put({ file, at: Date.now() }, KEY));
}

export async function take(): Promise<File | null> {
  try {
    const entry = await run<{ file: File; at: number } | undefined>('readwrite', (s) => s.get(KEY));
    if (!entry) return null;
    await run('readwrite', (s) => s.delete(KEY));
    return Date.now() - entry.at < TTL_MS ? entry.file : null;
  } catch {
    return null;
  }
}
