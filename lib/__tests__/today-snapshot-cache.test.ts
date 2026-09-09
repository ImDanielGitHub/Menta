import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearTodaySnapshotCache,
  readTodaySnapshotCache,
  TODAY_SNAPSHOT_CACHE_KEY,
  writeTodaySnapshotCache,
} from '@/lib/today-snapshot-cache';

describe('today snapshot cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await clearTodaySnapshotCache();
  });

  it('returns a same-day snapshot for the owning account', async () => {
    const savedAtIso = '2026-08-14T20:00:00.000Z';
    await writeTodaySnapshotCache({
      userId: 'user-1',
      localDay: '2026-08-14',
      timezone: 'Pacific/Auckland',
      savedAtIso,
      snapshot: { submissions: [{ id: 's1' }] },
    });

    const cached = await readTodaySnapshotCache(
      'user-1',
      '2026-08-14',
      Date.parse(savedAtIso) + 60_000
    );

    expect(cached?.snapshot).toEqual({ submissions: [{ id: 's1' }] });
    expect(await AsyncStorage.getItem(TODAY_SNAPSHOT_CACHE_KEY)).toContain(
      'user-1'
    );
  });

  it('ignores another account or another local day', async () => {
    await writeTodaySnapshotCache({
      userId: 'user-1',
      localDay: '2026-08-14',
      timezone: 'Pacific/Auckland',
      savedAtIso: '2026-08-14T20:00:00.000Z',
      snapshot: { submissions: [] },
    });

    await expect(
      readTodaySnapshotCache(
        'user-2',
        '2026-08-14',
        Date.parse('2026-08-14T20:01:00.000Z')
      )
    ).resolves.toBeNull();
    await expect(
      readTodaySnapshotCache(
        'user-1',
        '2026-08-15',
        Date.parse('2026-08-14T20:01:00.000Z')
      )
    ).resolves.toBeNull();
  });

  it('ignores snapshots older than one day', async () => {
    const savedAtIso = '2026-08-13T20:00:00.000Z';
    await writeTodaySnapshotCache({
      userId: 'user-1',
      localDay: '2026-08-14',
      timezone: 'Pacific/Auckland',
      savedAtIso,
      snapshot: { submissions: [] },
    });

    await expect(
      readTodaySnapshotCache(
        'user-1',
        '2026-08-14',
        Date.parse(savedAtIso) + 25 * 60 * 60 * 1000
      )
    ).resolves.toBeNull();
  });
});
