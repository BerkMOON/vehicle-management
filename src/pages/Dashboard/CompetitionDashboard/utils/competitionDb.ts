const DB_NAME = 'competition_dashboard';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前浏览器不支持 IndexedDB'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () =>
      reject(request.error ?? new Error('打开 IndexedDB 失败'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = runner(store);

        request.onerror = () =>
          reject(request.error ?? new Error('IndexedDB 操作失败'));
        request.onsuccess = () => resolve(request.result as T);
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 事务失败'));
      }),
  );
}

export const competitionDb = {
  get<T>(key: string): Promise<T | undefined> {
    return runTransaction('readonly', (store) => store.get(key)).then(
      (value) => value as T | undefined,
    );
  },

  set<T>(key: string, value: T): Promise<void> {
    return runTransaction('readwrite', (store) => store.put(value, key)).then(
      () => undefined,
    );
  },

  delete(key: string): Promise<void> {
    return runTransaction('readwrite', (store) => store.delete(key)).then(
      () => undefined,
    );
  },

  clear(): Promise<void> {
    return runTransaction('readwrite', (store) => store.clear()).then(
      () => undefined,
    );
  },
};
