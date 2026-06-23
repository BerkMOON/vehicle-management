import { STORE_FILE_ALIASES } from '../constants';
import { Brand, CompetitionStore } from '../types';

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
  let bestKeyLen = 0;

  for (const store of stores) {
    const candidates = [
      store.name,
      ...(store.aliases || []),
      ...(STORE_FILE_ALIASES[store.name] || []),
    ];

    for (const candidate of candidates) {
      const score = scoreStoreMatch(normalized, candidate);
      const keyLen = normalizeStoreName(candidate).length;
      if (
        score > bestScore ||
        (score === bestScore && score > 0 && keyLen > bestKeyLen)
      ) {
        bestScore = score;
        bestKeyLen = keyLen;
        bestStore = store;
      }
    }
  }

  return bestStore;
}

/** 从文件名推断品牌，用于避免「北京奥吉通林肯1店」误匹配奥迪店 */
export function detectBrandFromFileName(fileName: string): Brand | null {
  const text = normalizeStoreName(fileName);
  if (/林肯|路虎/.test(text)) return 'lincoln';
  if (/奥迪/.test(text)) return 'audi';
  if (/红旗|丰田/.test(text)) return 'hongqi';
  return null;
}
