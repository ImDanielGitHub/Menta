import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  TodayStatusRow,
  type TodayStreakTone,
} from '@/components/today/TodayStatusRow';
import {
  TodayStreakPanel,
  type TodayStreakPanelItem,
} from '@/components/today/TodayStreakPanel';
import { TodayWeekRow } from '@/components/today/TodayWeekRow';
import { useTodayWeek } from '@/components/today/use-today-week';
import { mentaSpacing } from '@/constants/MentaDesignSystem';
import type { ServerObligationFact } from '@/lib/loop';
import { useTranslation } from '@/lib/localization';
import { useMomentaStore } from '@/store/momenta-store';

type TodayStatusSectionProps = {
  userId: string | null;
  localDay: string;
  /** False until the first server or cached snapshot is available. */
  ready: boolean;
  /** Refreshes optional history once per completed Today refresh. */
  refreshToken: string | null;
  obligations: readonly ServerObligationFact[];
  showWeek: boolean;
  onOpenPromiseHistory: (challengeId: string) => void;
  onOpenWallet: () => void;
};

/**
 * The streak tone summarises today across running promises, strongest risk
 * first. A kept streak needs every promise approved today.
 */
export const resolveTodayStreakTone = (
  obligations: readonly ServerObligationFact[]
): TodayStreakTone => {
  if (obligations.length === 0) return 'none';
  if (obligations.some(item => item.proofStatus === 'none' && item.atRisk)) {
    return 'risk';
  }
  if (obligations.some(item => item.proofStatus === 'none')) return 'due';
  if (obligations.some(item => item.proofStatus === 'rejected')) return 'due';
  if (obligations.some(item => item.proofStatus === 'pending')) {
    return 'waiting';
  }
  return 'kept';
};

export function TodayStatusSection({
  localDay,
  obligations,
  onOpenPromiseHistory,
  onOpenWallet,
  ready,
  refreshToken,
  showWeek,
  userId,
}: TodayStatusSectionProps) {
  const { locale } = useTranslation();
  const [streakExpanded, setStreakExpanded] = useState(false);
  const activeAccountId = useMomentaStore(state => state.activeAccountId);
  const balance = useMomentaStore(state => state.balance);
  const fetchBalance = useMomentaStore(state => state.fetchBalance);

  // The balance refreshes with Today: on focus and on pull-to-refresh.
  useEffect(() => {
    if (userId && refreshToken) void fetchBalance(userId);
  }, [fetchBalance, refreshToken, userId]);

  const momentaBalance = userId && activeAccountId === userId ? balance : null;

  const streakItems = useMemo<TodayStreakPanelItem[]>(
    () =>
      obligations.map(item => ({
        key: item.obligationKey,
        challengeId: item.challengeId,
        title: item.title,
        streak: item.streakCount ?? null,
        longest: item.longestStreak ?? null,
        proofStatus: item.proofStatus,
      })),
    [obligations]
  );
  const bestStreak = useMemo(() => {
    const known = streakItems
      .map(item => item.streak)
      .filter((value): value is number => value !== null);
    return known.length > 0 ? Math.max(...known) : null;
  }, [streakItems]);
  const todayStatuses = useMemo(
    () => obligations.map(item => item.proofStatus),
    [obligations]
  );
  const week = useTodayWeek({
    userId,
    localDay,
    locale,
    refreshToken,
    todayStatuses,
  });

  return (
    <View style={styles.section} testID="today-status-section">
      <TodayStatusRow
        loading={!ready}
        momentaBalance={momentaBalance}
        onMomentaPress={onOpenWallet}
        onStreakPress={() => setStreakExpanded(expanded => !expanded)}
        streak={bestStreak}
        streakExpanded={streakExpanded}
        streakTone={resolveTodayStreakTone(obligations)}
      />
      {!ready || (showWeek && week.phase !== 'unavailable') ? (
        <TodayWeekRow days={ready ? week.days : null} />
      ) : null}
      {ready && streakExpanded ? (
        <TodayStreakPanel
          items={streakItems}
          onOpenPromise={onOpenPromiseHistory}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    gap: mentaSpacing[4],
    width: '100%',
  },
});
