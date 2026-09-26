import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { readTodayAccountability } from '@/lib/loop/accountability';
import { translate } from '@/lib/localization/translate';
import { supabase } from '@/lib/supabase';
import {
  isWidgetPromiseId,
  makeStreakWidgetCountdownEntries,
  makeStreakWidgetSnapshot,
  makeWidgetFallback,
  readWidgetPromise,
  type StreakWidgetSnapshot,
  type WidgetHistoryDay,
  type WidgetPromise,
} from '@/lib/widgets/widget-model';
import {
  homeWidgetsAvailable,
  publishWidgetTimeline,
  readWidgetTimeline,
} from '@/lib/widgets/widget-native';

type WidgetPreferences = {
  promiseId: string | null;
  showText: boolean;
  dismissed: boolean;
};
type HomeWidgetStore = {
  ownerId: string | null;
  available: boolean;
  ready: boolean;
  loading: boolean;
  saving: boolean;
  error: 'read' | 'save' | null;
  preferences: WidgetPreferences;
  promises: WidgetPromise[];
  snapshot: StreakWidgetSnapshot;
};

const defaultPreferences = (): WidgetPreferences => ({
  promiseId: null,
  showText: false,
  dismissed: false,
});
export const useHomeWidgetStore = create<HomeWidgetStore>(() => ({
  ownerId: null,
  available: false,
  ready: false,
  loading: false,
  saving: false,
  error: null,
  preferences: defaultPreferences(),
  promises: [],
  snapshot: makeWidgetFallback('signed-out', 'en-NZ'),
}));

let sessionEpoch = 0;
let readEpoch = 0;
let widgetLocale = 'en-NZ';
const preferenceKey = (owner: string) => `@menta/home-widget/v1/${owner}`;

const withTimeout = async <T>(work: PromiseLike<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Widget read timed out')),
          12000
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const publish = (
  snapshot: StreakWidgetSnapshot,
  current: () => boolean,
  countdown: { date: Date; props: StreakWidgetSnapshot }[] = []
) => {
  const ownerId = useHomeWidgetStore.getState().ownerId ?? undefined;
  const entries = [
    { date: new Date(), props: { ...snapshot, ownerId } },
    ...countdown.map(entry => ({
      date: entry.date,
      props: { ...entry.props, ownerId },
    })),
  ];
  if (snapshot.expiresAt > Date.now()) {
    entries.push({
      date: new Date(snapshot.expiresAt),
      props: { ...makeWidgetFallback('stale', widgetLocale), ownerId },
    });
  }
  void publishWidgetTimeline(entries, current).catch(() => {
    if (current()) useHomeWidgetStore.setState({ error: 'read' });
  });
};

export const beginHomeWidgetSession = (
  ownerId: string | null,
  locale: string
) => {
  const previousOwnerId = useHomeWidgetStore.getState().ownerId;
  const epoch = ++sessionEpoch;
  ++readEpoch;
  widgetLocale = locale;
  const current = () => sessionEpoch === epoch;
  const available = homeWidgetsAvailable();
  const snapshot = makeWidgetFallback(
    ownerId ? 'choose' : 'signed-out',
    locale
  );
  useHomeWidgetStore.setState({
    ownerId,
    available,
    ready: !ownerId || !available,
    loading: Boolean(ownerId && available),
    saving: false,
    preferences: defaultPreferences(),
    promises: [],
    snapshot,
    error: null,
  });
  // A confirmed sign-out or account switch clears the old native data immediately.
  if (
    available &&
    (!ownerId || (previousOwnerId && previousOwnerId !== ownerId))
  )
    publish(snapshot, current);
  if (!ownerId || !available) return;
  void (async () => {
    try {
      // A cache read failure must not prevent loading the saved selection.
      const timeline = await withTimeout(readWidgetTimeline()).catch(() => []);
      if (!current()) return;
      const now = Date.now();
      const cached = timeline
        .filter(entry => entry.date.getTime() <= now)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.props;
      // Only the native timeline itself can prove which account owns its contents.
      // Leave a fresh same-account timeline in place while preferences/API data load.
      if (cached?.ownerId === ownerId && cached.expiresAt > now) {
        useHomeWidgetStore.setState({ snapshot: cached });
      } else {
        publish(snapshot, current);
      }
      const raw = await withTimeout(
        AsyncStorage.getItem(preferenceKey(ownerId))
      );
      if (!current()) return;
      let value: unknown = null;
      if (raw) {
        try {
          value = JSON.parse(raw);
        } catch {
          // Corrupt saved data can be replaced through setup; do not retry it forever.
        }
      }
      const saved =
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)
          : {};
      const preferences = {
        promiseId: isWidgetPromiseId(saved.promiseId) ? saved.promiseId : null,
        showText: saved.showText === true,
        dismissed: saved.dismissed === true,
      };
      useHomeWidgetStore.setState({ preferences, ready: true, loading: false });
      if (preferences.promiseId) await refreshHomeWidget();
      else publish(snapshot, current);
    } catch {
      if (current()) {
        const existing = useHomeWidgetStore.getState().snapshot;
        const canKeep =
          existing.ownerId === ownerId && existing.expiresAt > Date.now();
        const fallback = canKeep
          ? existing
          : makeWidgetFallback('stale', locale);
        useHomeWidgetStore.setState({
          ready: false,
          error: 'read',
          loading: false,
          snapshot: fallback,
        });
        if (!canKeep) publish(fallback, current);
      }
    }
  })();
};

export const endHomeWidgetSession = () => {
  ++sessionEpoch;
  ++readEpoch;
};

const readHistory = async (
  ownerId: string,
  promise: WidgetPromise
): Promise<WidgetHistoryDay[]> => {
  const { data, error } = await withTimeout(
    supabase
      .from('challenge_submissions')
      .select('local_day,status')
      .eq('user_id', ownerId)
      .eq('challenge_id', promise.id)
      .order('local_day', { ascending: false })
      .limit(21)
  );
  if (error) return [];
  const rows = new Map<string, string>();
  const rank: Record<string, number> = { approved: 3, pending: 2, rejected: 1 };
  for (const row of data ?? []) {
    if (!row.local_day || !rank[row.status ?? '']) continue;
    if ((rank[row.status!] ?? 0) > (rank[rows.get(row.local_day) ?? ''] ?? 0))
      rows.set(row.local_day, row.status!);
  }
  return [...rows]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .reverse()
    .map(([day, status]) => ({
      label: new Intl.DateTimeFormat(widgetLocale, {
        weekday: 'short',
        timeZone: 'UTC',
      }).format(new Date(`${day}T12:00:00Z`)),
      mark: status === 'approved' ? '✓' : status === 'pending' ? '…' : '↻',
      description: `${day}: ${translate(
        widgetLocale,
        status === 'approved'
          ? 'widgets.history.approved'
          : status === 'pending'
            ? 'widgets.history.pending'
            : 'widgets.history.rejected'
      )}`,
    }));
};

export const refreshHomeWidget = async (loadChoices = false): Promise<void> => {
  const state = useHomeWidgetStore.getState();
  if (!state.available || !state.ownerId || state.saving) return;
  if (!state.ready) {
    if (!state.loading) beginHomeWidgetSession(state.ownerId, widgetLocale);
    return;
  }
  if (!state.preferences.promiseId && !loadChoices) return;
  const epoch = sessionEpoch;
  const request = ++readEpoch;
  const ownerId = state.ownerId;
  const current = () => epoch === sessionEpoch && request === readEpoch;
  useHomeWidgetStore.setState({ loading: true, error: null });
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const read = await withTimeout(readTodayAccountability(timezone));
    if (!current()) return;
    if (read.source !== 'v2')
      throw new Error('Authoritative streak data unavailable');
    const promises = read.rows
      .map(readWidgetPromise)
      .filter((value): value is WidgetPromise => value !== null);
    if (promises.length !== read.rows.length)
      throw new Error('Incomplete widget promise data');
    const preferences = useHomeWidgetStore.getState().preferences;
    const selected = promises.find(
      promise => promise.id === preferences.promiseId
    );
    const history = selected
      ? await readHistory(ownerId, selected).catch(() => [])
      : [];
    if (!current()) return;
    // A removed selection never silently turns into a different promise's streak.
    const snapshot = selected
      ? makeStreakWidgetSnapshot({
          promise: selected,
          showText: preferences.showText,
          locale: widgetLocale,
          history,
        })
      : makeWidgetFallback(promises.length ? 'choose' : 'empty', widgetLocale);
    useHomeWidgetStore.setState({ promises, snapshot, loading: false });
    publish(
      snapshot,
      current,
      selected
        ? makeStreakWidgetCountdownEntries({
            promise: selected,
            showText: preferences.showText,
            locale: widgetLocale,
            history,
          })
        : []
    );
  } catch {
    if (!current()) return;
    const snapshot = makeWidgetFallback('stale', widgetLocale);
    useHomeWidgetStore.setState({ error: 'read', loading: false, snapshot });
    publish(snapshot, current);
  }
};

export const saveHomeWidgetPreferences = async (
  changes: Partial<WidgetPreferences>
): Promise<boolean> => {
  const state = useHomeWidgetStore.getState();
  if (!state.ownerId || !state.ready || state.saving) return false;
  if (
    changes.promiseId &&
    !state.promises.some(promise => promise.id === changes.promiseId)
  )
    return false;
  const epoch = sessionEpoch;
  const request = ++readEpoch;
  const current = () => epoch === sessionEpoch && request === readEpoch;
  const preferences = { ...state.preferences, ...changes };
  useHomeWidgetStore.setState({ saving: true, loading: false, error: null });
  if (changes.showText === false) {
    // Redact immediately even if disk I/O is slow or subsequently fails.
    const promise = state.promises.find(
      item => item.id === preferences.promiseId
    );
    const snapshot = promise
      ? makeStreakWidgetSnapshot({
          promise,
          showText: false,
          locale: widgetLocale,
        })
      : makeWidgetFallback('choose', widgetLocale);
    useHomeWidgetStore.setState({ preferences, snapshot });
    publish(snapshot, current);
  }
  try {
    await withTimeout(
      AsyncStorage.setItem(
        preferenceKey(state.ownerId),
        JSON.stringify(preferences)
      )
    );
    if (!current()) return false;
    useHomeWidgetStore.setState({ preferences, saving: false });
    await refreshHomeWidget(true);
    return true;
  } catch {
    if (current())
      useHomeWidgetStore.setState({ saving: false, error: 'save' });
    return false;
  }
};
