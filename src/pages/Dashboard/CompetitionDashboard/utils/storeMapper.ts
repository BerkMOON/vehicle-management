import { STORE_FILE_ALIASES } from '../constants';
import { CompetitionStore } from '../types';

function normalizeStoreName(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

function scoreStoreMatch(normalized: string, candidate: string): number {
  const key = normalizeStoreName(candidate);
  if (!key) return 0;
  if (normalized === key) return 1000 + key.length;
  if (normalized.includes(key)) return 100 + key.length;
  if (key.includes(normalized)) return 50 + normalized.length;
  return 0;
}

/** 将后台 store_name 映射到竞赛门店配置（优先最长/最精确匹配） */
export function resolveStoreByName(
  storeName: string | undefined,
  stores: CompetitionStore[],
): CompetitionStore | null {
  if (!storeName) return null;
  const normalized = normalizeStoreName(storeName);

  let bestStore: CompetitionStore | null = null;
  let bestScore = 0;

  for (const store of stores) {
    const candidates = [
      store.name,
      ...(store.aliases || []),
      ...(STORE_FILE_ALIASES[store.name] || []),
    ];

    for (const candidate of candidates) {
      const score = scoreStoreMatch(normalized, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestStore = store;
      }
    }
  }

  return bestStore;
}
