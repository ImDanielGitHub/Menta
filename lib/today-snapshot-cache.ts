import AsyncStorage from '@react-native-async-storage/async-storage';

export const TODAY_SNAPSHOT_CACHE_KEY = 'menta.today-snapshot.v1';

export type CachedTodaySnapshot<TSnapshot> = {
  userId: string;
  localDay: string;
  timezone: string;
  savedAtIso: string;
  snapshot: TSnapshot;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

let memoryCache: CachedTodaySnapshot<unknown> | null = null;

const parseCachedSnapshot = (
  value: unknown
): CachedTodaySnapshot<unknown> | null => {
  if (!isRecord(value)) return null;
  if (typeof value.userId !== 'string' || !value.userId.trim()) return null;
  if (typeof value.localDay !== 'string' || !value.localDay.trim()) {
    return null;
  }
  if (typeof value.timezone !== 'string' || !value.timezone.trim()) {
    return null;
  }
  if (typeof value.savedAtIso !== 'string' || !value.savedAtIso.trim()) {
    return null;
  }
  if (!Number.isFinite(Date.parse(value.savedAtIso))) return null;
  if (!('snapshot' in value)) return null;

  return {
    userId: value.userId,
    localDay: value.localDay,
    timezone: value.timezone,
    savedAtIso: value.savedAtIso,
    snapshot: value.snapshot,
  };
};

const isFreshForDay = (
  cached: CachedTodaySnapshot<unknown>,
  userId: string,
  localDay: string,
  nowMs: number
): boolean => {
  if (cached.userId !== userId || cached.localDay !== localDay) return false;
  const savedAt = Date.parse(cached.savedAtIso);
  if (!Number.isFinite(savedAt)) return false;
  return nowMs - savedAt <= MAX_CACHE_AGE_MS;
};

export const readTodaySnapshotCache = async <TSnapshot>(
  userId: string,
  localDay: string,
  nowMs: number = Date.now()
): Promise<CachedTodaySnapshot<TSnapshot> | null> => {
  if (memoryCache && isFreshForDay(memoryCache, userId, localDay, nowMs)) {
    return memoryCache as CachedTodaySnapshot<TSnapshot>;
  }

  const raw = await AsyncStorage.getItem(TODAY_SNAPSHOT_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = parseCachedSnapshot(JSON.parse(raw) as unknown);
    if (!parsed || !isFreshForDay(parsed, userId, localDay, nowMs)) {
      return null;
    }
    memoryCache = parsed;
    return parsed as CachedTodaySnapshot<TSnapshot>;
  } catch {
    return null;
  }
};

export const writeTodaySnapshotCache = async <TSnapshot>(
  entry: CachedTodaySnapshot<TSnapshot>
): Promise<void> => {
  const parsed = parseCachedSnapshot(entry);
  if (!parsed) return;
  memoryCache = parsed;
  await AsyncStorage.setItem(TODAY_SNAPSHOT_CACHE_KEY, JSON.stringify(parsed));
};

export const clearTodaySnapshotCache = async (): Promise<void> => {
  memoryCache = null;
  await AsyncStorage.removeItem(TODAY_SNAPSHOT_CACHE_KEY);
};
