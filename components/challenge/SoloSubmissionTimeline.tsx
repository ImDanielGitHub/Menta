import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@/components/ui/icons';
import { SignedImage } from '@/components/ui/SignedImage';
import { useTranslation } from '@/lib/localization';

export type SoloEntry = {
  date: string; // YYYY-MM-DD
  status: 'submitted' | 'missed' | 'inactive';
  label?: string;
};

const INACTIVE_STATUS: SoloEntry['status'] = 'inactive';
const SUBMITTED_STATUS: SoloEntry['status'] = 'submitted';
const MISSED_STATUS: SoloEntry['status'] = 'missed';

type Props = {
  startDate?: string | null;
  durationDays?: number | null;
  userJoinedAt?: string | null;
  submissionDates: string[]; // YYYY-MM-DD set for days with submission
  lookbackDays?: number; // default 14
  submissionMediaByDate?: Record<string, string>;
};

export const SoloSubmissionTimeline: React.FC<Props> = ({
  startDate,
  durationDays,
  userJoinedAt,
  submissionDates,
  lookbackDays = 14,
  submissionMediaByDate,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const entries: SoloEntry[] = useMemo(() => {
    // Normalize to UTC date boundaries to match stored submissionDates format
    const today = new Date();
    const todayUtc = new Date(today.toISOString().split('T')[0]);

    // Build a fast lookup set for submission date strings (YYYY-MM-DD)
    const subSet = new Set(submissionDates);

    // Compute challenge active window [activeStart, activeEnd]
    const challengeStart = startDate
      ? new Date(new Date(startDate).toISOString().split('T')[0])
      : null;
    const challengeEnd =
      challengeStart && durationDays
        ? new Date(
            new Date(challengeStart).setUTCDate(
              challengeStart.getUTCDate() + Math.max(0, durationDays - 1)
            )
          )
        : null;

    // User join date (if provided) — user shouldn't be penalized before this date
    const joinedDate = userJoinedAt
      ? new Date(new Date(userJoinedAt).toISOString().split('T')[0])
      : null;

    // Active start is max(challengeStart, joinedDate) when both exist
    let activeStart: Date | null = null;
    if (challengeStart && joinedDate) {
      activeStart = challengeStart > joinedDate ? challengeStart : joinedDate;
    } else {
      activeStart = challengeStart || joinedDate || null;
    }

    // Active end is min(challengeEnd, today) if both exist
    let activeEnd: Date | null = null;
    if (challengeEnd) {
      activeEnd = challengeEnd < todayUtc ? challengeEnd : todayUtc;
    } else {
      activeEnd = todayUtc;
    }

    const out: SoloEntry[] = [];
    for (let i = 0; i < lookbackDays; i++) {
      const d = new Date(todayUtc);
      d.setUTCDate(d.getUTCDate() - i);
      const yyyyMmDd = d.toISOString().split('T')[0];

      const isWithinActiveWindow =
        (!activeStart || d >= activeStart) && (!activeEnd || d <= activeEnd);

      const isSubmitted = subSet.has(yyyyMmDd);

      if (!isWithinActiveWindow) {
        out.push({
          date: yyyyMmDd,
          status: INACTIVE_STATUS,
          label: '—',
        });
        continue;
      }

      // Do not mark "today" as missed if not submitted yet; show as inactive placeholder instead
      if (d.getTime() === todayUtc.getTime() && !isSubmitted) {
        out.push({
          date: yyyyMmDd,
          status: INACTIVE_STATUS,
          label: t('todayProof.residual.open'),
        });
      } else {
        out.push({
          date: yyyyMmDd,
          status: isSubmitted ? SUBMITTED_STATUS : MISSED_STATUS,
          label: isSubmitted
            ? t('todayProof.residual.on_time')
            : t('todayProof.residual.missed_2'),
        });
      }
    }
    return out;
  }, [durationDays, lookbackDays, startDate, submissionDates, t, userJoinedAt]);

  const summary = useMemo(
    () =>
      entries.reduce(
        (acc, entry) => {
          if (entry.status === 'submitted') acc.submitted += 1;
          if (entry.status === 'missed') acc.missed += 1;
          return acc;
        },
        { submitted: 0, missed: 0 }
      ),
    [entries]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('todayProof.residual.recent_check_ins')}
        </Text>
        <Text style={styles.summaryText}>
          {summary.submitted} {t('todayProof.residual.logged')}
        </Text>
      </View>

      <Text style={styles.helperText}>
        {t('todayProof.residual.today_stays_open_until_you_check_in')}
      </Text>

      <View style={styles.rows}>
        {entries.map(e => {
          const isSubmitted = e.status === 'submitted';
          const isMissed = e.status === 'missed';
          const mediaUrl = submissionMediaByDate?.[e.date];
          const stateLabel = isSubmitted
            ? 'On time'
            : isMissed
              ? 'Missed'
              : e.label === 'Open'
                ? 'Open for check-in'
                : 'Not active';
          const displayDate = new Date(e.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          return (
            <View
              key={e.date}
              accessible
              accessibilityLabel={`${displayDate}, ${stateLabel}`}
              style={styles.row}
            >
              <View style={styles.left}>
                {isSubmitted ? (
                  <CheckCircleIcon size={16} color={colors.status.success} />
                ) : isMissed ? (
                  <XCircleIcon size={16} color={colors.status.error} />
                ) : (
                  <ClockIcon size={16} color={colors.text.tertiary} />
                )}
                <Text style={styles.dateText}>{displayDate}</Text>
              </View>
              {mediaUrl ? (
                <View style={styles.thumbnail}>
                  <SignedImage
                    uri={mediaUrl}
                    variant="thumb"
                    style={styles.thumbnailImage}
                  />
                </View>
              ) : (
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isSubmitted
                        ? colors.status.success
                        : isMissed
                          ? colors.status.error
                          : colors.text.tertiary,
                    },
                  ]}
                >
                  {e.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {summary.missed > 0 ? (
        <Text style={styles.footerNote}>
          {t('todayProof.residual.missed_day_summary', {
            count: summary.missed,
          })}
        </Text>
      ) : null}
    </View>
  );
};

const createStyles = (theme: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    title: {
      ...theme.typography.h4,
      color: theme.colors.text.primary,
    },
    summaryText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    helperText: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 19,
    },
    rows: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.primary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 58,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.primary,
      gap: theme.spacing.md,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    dateText: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    thumbnail: {
      width: 42,
      height: 42,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border.primary,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    statusText: {
      ...theme.typography.caption,
      fontWeight: '600',
    },
    footerNote: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 19,
    },
  });

export default SoloSubmissionTimeline;
