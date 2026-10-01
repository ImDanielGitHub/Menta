import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { SignedImage } from '@/components/ui/SignedImage';
import {
  CameraIcon,
  CheckCircleIcon,
  CheckIcon,
  TypeIcon,
  VideoIcon,
} from '@/components/ui/icons';
import type {
  PromiseProofDay,
  PromiseProofDayState,
} from '@/components/challenge/promise-runtime-states';

import { useTheme } from '@/constants/ThemeContext';
import { mentaFonts } from '@/lib/menta-fonts';
import { useTranslation } from '@/lib/localization';

export type PersonalPromiseTodayState = 'due' | 'waiting' | 'counted' | 'retry';

export type PersonalPromiseProofKind = 'photo' | 'video' | 'text';

/** One sent proof as it appears in the gallery: the photo itself when there is one. */
export type PersonalPromiseProofTile = {
  kind: PersonalPromiseProofKind;
  mediaUrl?: string | null;
};

export type PersonalPromiseTodayItem = {
  id: string;
  title: string;
  meta: string;
  state: PersonalPromiseTodayState;
  proofKind: PersonalPromiseProofKind;
  /** The latest proof sent for this promise, shown as the row's cover. */
  cover: PersonalPromiseProofTile | null;
};

export const PersonalPromiseSectionHeading = ({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) => {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeading}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.text.secondary }]}
      >
        {title}
      </Text>
      {detail ? (
        <Text style={[styles.sectionDetail, { color: colors.text.tertiary }]}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
};

/**
 * A sent proof at any size. Photos fill the tile; text proof reads as a
 * written note; video keeps an honest icon rather than a blank frame.
 */
const ProofTile = ({
  tile,
  radius,
}: {
  tile: PersonalPromiseProofTile;
  radius: number;
}) => {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();

  if (tile.kind === 'photo' && tile.mediaUrl) {
    return (
      <SignedImage
        uri={tile.mediaUrl}
        variant="thumb"
        contentFit="cover"
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        accessible={false}
      />
    );
  }

  if (tile.kind === 'text') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.note,
          { borderRadius: radius, backgroundColor: mentaColors.paper },
        ]}
      >
        <View style={styles.noteLine} />
        <View style={[styles.noteLine, { width: '78%' }]} />
        <View style={[styles.noteLine, { width: '52%' }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.centred,
        { borderRadius: radius, backgroundColor: colors.background.surface },
      ]}
    >
      {tile.kind === 'video' ? (
        <VideoIcon size={16} color={colors.text.secondary} />
      ) : (
        <CheckIcon size={15} color={mentaColors.success} />
      )}
    </View>
  );
};

type TodayListProps = {
  items: readonly PersonalPromiseTodayItem[];
  selectedId?: string | null;
  onOpen: (id: string) => void;
  onAction: (id: string) => void;
};

export const PersonalPromiseTodayList = ({
  items,
  selectedId,
  onOpen,
  onAction,
}: TodayListProps) => {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.todayList,
        {
          backgroundColor: colors.background.surface,
          borderColor: colors.border.secondary,
        },
      ]}
      testID="personal-promises-today"
    >
      {items.map((item, index) => (
        <PersonalPromiseTodayRow
          key={item.id}
          item={item}
          first={index === 0}
          selected={selectedId === item.id}
          onOpen={() => onOpen(item.id)}
          onAction={() => onAction(item.id)}
        />
      ))}
    </View>
  );
};

const PersonalPromiseTodayRow = ({
  item,
  first,
  selected,
  onOpen,
  onAction,
}: {
  item: PersonalPromiseTodayItem;
  first: boolean;
  selected: boolean;
  onOpen: () => void;
  onAction: () => void;
}) => {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('todayProof.solo.open_accessibility', {
        promise: item.title,
      })}
      accessibilityHint={t('todayProof.solo.open_hint')}
      accessibilityState={{ selected }}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.todayRow,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border.secondary,
        },
        selected && { backgroundColor: colors.accent.background },
        pressed && styles.pressed,
      ]}
      testID={`personal-promise-row-${item.id}`}
    >
      <View
        style={[styles.cover, { backgroundColor: colors.background.primary }]}
      >
        {item.cover ? (
          <ProofTile tile={item.cover} radius={mentaRadii.medium} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.centred]}>
            {item.proofKind === 'text' ? (
              <TypeIcon size={19} color={colors.text.tertiary} />
            ) : (
              <CameraIcon size={19} color={colors.text.tertiary} />
            )}
          </View>
        )}
      </View>
      <View style={styles.todayCopy}>
        <Text
          style={[styles.todayTitle, { color: colors.text.primary }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.todayMeta, { color: colors.text.secondary }]}
          numberOfLines={1}
        >
          {item.meta}
        </Text>
      </View>
      <View style={styles.todayAction}>
        <TodayAction item={item} onAction={onAction} />
      </View>
    </Pressable>
  );
};

const TodayAction = ({
  item,
  onAction,
}: {
  item: PersonalPromiseTodayItem;
  onAction: () => void;
}) => {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  const { t } = useTranslation();

  if (item.state === 'due') {
    const label =
      item.proofKind === 'text'
        ? t('todayProof.solo.log_short')
        : t('todayProof.solo.check_in_short');
    return (
      <AppButton
        title={label}
        onPress={onAction}
        variant="accent"
        size="small"
        accessibilityLabel={t('todayProof.solo.action_accessibility', {
          action: label,
          promise: item.title,
        })}
        icon={
          item.proofKind === 'text' ? (
            <TypeIcon size={17} color={colors.background.primary} />
          ) : (
            <CameraIcon size={17} color={colors.background.primary} />
          )
        }
        testID={`personal-promise-action-${item.id}`}
      />
    );
  }

  if (item.state === 'retry') {
    const label = t('todayProof.solo.try_again_short');
    return (
      <AppButton
        title={label}
        onPress={onAction}
        variant="secondary"
        size="small"
        accessibilityLabel={t('todayProof.solo.action_accessibility', {
          action: label,
          promise: item.title,
        })}
        testID={`personal-promise-action-${item.id}`}
      />
    );
  }

  const counted = item.state === 'counted';
  const tone = counted ? mentaColors.success : mentaColors.warning;
  return (
    <View style={styles.todayStatus}>
      {counted ? (
        <CheckCircleIcon size={17} color={tone} />
      ) : (
        <View style={[styles.waitingDot, { borderColor: tone }]} />
      )}
      <Text style={[styles.todayStatusLabel, { color: tone }]}>
        {counted
          ? t('todayProof.solo.counted_short')
          : t('todayProof.solo.waiting_short')}
      </Text>
    </View>
  );
};

export type PersonalPromiseWeekRow = {
  id: string;
  title: string;
  week: readonly PromiseProofDay[];
  /** The proof sent on each day of `week`, by the same index. */
  tiles: readonly (PersonalPromiseProofTile | null)[];
  proofKind: PersonalPromiseProofKind;
  kept: number;
  total: number;
};

export const PersonalPromiseWeekGrid = ({
  rows,
  todayIndex,
}: {
  rows: readonly PersonalPromiseWeekRow[];
  todayIndex: number;
}) => {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  const { t } = useTranslation();
  const labels = rows[0]?.week.map(day => day.label) ?? [];

  return (
    <View style={styles.weekGrid} testID="personal-promises-week">
      <View
        style={styles.weekCells}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {labels.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            style={[
              styles.weekLabel,
              {
                color:
                  index === todayIndex
                    ? colors.accent.primary
                    : colors.text.tertiary,
              },
              index === todayIndex && styles.weekLabelToday,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
      {rows.map(row => (
        <View
          key={row.id}
          accessible
          accessibilityLabel={t('todayProof.solo.week_row_accessibility', {
            promise: row.title,
            kept: row.kept,
            total: row.total,
          })}
          style={styles.weekRow}
          testID={`personal-promise-week-${row.id}`}
        >
          <View style={styles.weekRowHeading}>
            <Text
              style={[styles.weekRowTitle, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {row.title}
            </Text>
            {row.total > 0 ? (
              <Text
                style={[styles.weekRowCount, { color: colors.text.tertiary }]}
              >
                {t('todayProof.solo.row_kept', {
                  kept: row.kept,
                  total: row.total,
                })}
              </Text>
            ) : null}
          </View>
          <View style={styles.weekCells}>
            {row.week.map((day, index) => (
              <WeekCell
                key={`${row.id}-${index}`}
                state={day.state}
                tile={row.tiles[index] ?? null}
                proofKind={row.proofKind}
                isToday={index === todayIndex}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const WeekCell = ({
  state,
  tile,
  proofKind,
  isToday,
}: {
  state: PromiseProofDayState;
  tile: PersonalPromiseProofTile | null;
  proofKind: PersonalPromiseProofKind;
  isToday: boolean;
}) => {
  const mentaColors = useMentaPalette();
  const { sentRing, styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  const sent =
    state === 'approved' || state === 'waiting' || state === 'needs-retry';

  if (sent) {
    const ring = sentRing[state] ?? (isToday ? mentaColors.success : undefined);
    return (
      <View
        style={[styles.weekCell, { backgroundColor: mentaColors.successSoft }]}
      >
        <ProofTile
          tile={tile ?? { kind: proofKind === 'text' ? 'text' : 'photo' }}
          radius={weekCellRadius}
        />
        {ring ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.cellRing,
              { borderColor: ring },
            ]}
          />
        ) : null}
      </View>
    );
  }

  switch (state) {
    case 'protected':
      return (
        <View
          style={[
            styles.weekCell,
            { backgroundColor: 'rgba(143, 203, 255, 0.15)' },
          ]}
        />
      );
    case 'today':
      return (
        <View
          style={[
            styles.weekCell,
            styles.centred,
            { borderWidth: 2, borderColor: colors.accent.primary },
          ]}
        >
          {proofKind === 'text' ? (
            <TypeIcon size={15} color={colors.accent.primary} />
          ) : (
            <CameraIcon size={15} color={colors.accent.primary} />
          )}
        </View>
      );
    case 'missed':
    case 'past':
      return (
        <View
          style={[
            styles.weekCell,
            { backgroundColor: colors.background.surface },
          ]}
        />
      );
    case 'future':
      return (
        <View
          style={[
            styles.weekCell,
            {
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border.secondary,
            },
          ]}
        />
      );
    case 'inactive':
    default:
      return (
        <View
          style={[
            styles.weekCell,
            {
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.border.secondary,
            },
          ]}
        />
      );
  }
};

export type PersonalPromiseFinishedItem = {
  id: string;
  title: string;
  kept: number;
  total: number;
  /** Up to three proofs for the album cover, newest first. */
  covers: readonly PersonalPromiseProofTile[];
  /** Proofs beyond the cover. */
  more: number;
};

export const PersonalPromiseFinishedShelf = ({
  items,
  onOpen,
}: {
  items: readonly PersonalPromiseFinishedItem[];
  onOpen: (id: string) => void;
}) => {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.shelf}
      testID="personal-promises-finished"
    >
      {items.map(item => {
        const [lead, second, third] = item.covers;
        const kept = t('todayProof.solo.finished_kept', {
          kept: item.kept,
          total: item.total,
        });
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${t('todayProof.solo.open_accessibility', {
              promise: item.title,
            })}. ${kept}`}
            onPress={() => onOpen(item.id)}
            style={({ pressed }) => [styles.album, pressed && styles.pressed]}
            testID={`personal-promise-finished-${item.id}`}
          >
            <View
              style={[
                styles.albumCover,
                { backgroundColor: colors.background.surface },
              ]}
            >
              {lead ? (
                <>
                  <View style={styles.albumLead}>
                    <ProofTile tile={lead} radius={0} />
                  </View>
                  {second ? (
                    <View style={styles.albumSide}>
                      <View style={styles.albumSideTile}>
                        <ProofTile tile={second} radius={0} />
                      </View>
                      {third ? (
                        <View style={styles.albumSideTile}>
                          <ProofTile tile={third} radius={0} />
                          {item.more > 0 ? (
                            <View
                              style={[
                                StyleSheet.absoluteFill,
                                styles.centred,
                                styles.albumMore,
                              ]}
                            >
                              <Text style={styles.albumMoreLabel}>
                                +{item.more}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={[styles.albumLead, styles.centred]}>
                  <CheckCircleIcon size={28} color={colors.text.tertiary} />
                </View>
              )}
            </View>
            <View style={styles.albumCopy}>
              <Text
                style={[styles.albumTitle, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.todayMeta,
                  {
                    color:
                      item.total > 0 && item.kept >= item.total
                        ? mentaColors.success
                        : colors.text.secondary,
                  },
                ]}
              >
                {kept}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const weekCellRadius = 10;
const albumSize = 176;

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const sentRing: Partial<Record<PromiseProofDayState, string>> = {
    waiting: mentaColors.warning,
    'needs-retry': mentaColors.danger,
  };
  const styles = StyleSheet.create({
    pressed: { opacity: 0.72 },
    centred: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: mentaSpacing[3],
      marginBottom: mentaSpacing[3],
    },
    sectionTitle: {
      ...mentaTypography.bodySmall,
      fontFamily: mentaFonts.inter.semibold,
    },
    sectionDetail: {
      ...mentaTypography.caption,
    },
    note: {
      gap: 5,
      paddingHorizontal: '16%',
      justifyContent: 'center',
    },
    noteLine: {
      height: 2,
      borderRadius: 1,
      width: '100%',
      backgroundColor: mentaColors.text.secondary,
    },
    todayList: {
      borderRadius: mentaRadii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    todayRow: {
      minHeight: 84,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: mentaSpacing[4],
      paddingLeft: 14,
      paddingRight: mentaSpacing[4],
    },
    cover: {
      width: 52,
      height: 52,
      borderRadius: mentaRadii.medium,
      overflow: 'hidden',
      flexShrink: 0,
    },
    todayCopy: {
      flex: 1,
      minWidth: 0,
      gap: mentaSpacing[1],
    },
    todayTitle: {
      ...mentaTypography.bodySemibold,
    },
    todayMeta: {
      ...mentaTypography.caption,
    },
    todayAction: {
      flexShrink: 0,
      alignItems: 'flex-end',
    },
    todayStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    todayStatusLabel: {
      ...mentaTypography.bodySmall,
      fontFamily: mentaFonts.inter.semibold,
    },
    waitingDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      borderWidth: 2,
    },
    weekGrid: {
      gap: 18,
    },
    weekRow: {
      gap: mentaSpacing[2],
    },
    weekRowHeading: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: mentaSpacing[3],
    },
    weekRowTitle: {
      ...mentaTypography.bodySmallMedium,
      flex: 1,
      minWidth: 0,
    },
    weekRowCount: {
      ...mentaTypography.caption,
    },
    weekCells: {
      flexDirection: 'row',
      gap: 5,
    },
    weekLabel: {
      ...mentaTypography.micro,
      fontFamily: mentaFonts.inter.semibold,
      flex: 1,
      textAlign: 'center',
    },
    weekLabelToday: {
      fontFamily: mentaFonts.inter.bold,
    },
    weekCell: {
      flex: 1,
      height: 50,
      borderRadius: weekCellRadius,
      overflow: 'hidden',
    },
    cellRing: {
      borderRadius: weekCellRadius,
      borderWidth: 2,
    },
    shelf: {
      gap: 14,
      paddingRight: mentaSpacing[6],
    },
    album: {
      width: albumSize,
      gap: 10,
    },
    albumCover: {
      width: albumSize,
      height: albumSize,
      borderRadius: mentaRadii.large,
      overflow: 'hidden',
      flexDirection: 'row',
      gap: 3,
    },
    albumLead: {
      flex: 2,
    },
    albumSide: {
      flex: 1,
      gap: 3,
    },
    albumSideTile: {
      flex: 1,
    },
    albumMore: {
      backgroundColor: 'rgba(8, 9, 9, 0.45)',
    },
    albumMoreLabel: {
      ...mentaTypography.captionMedium,
      fontFamily: mentaFonts.inter.semibold,
      color: mentaColors.paper,
    },
    albumCopy: {
      gap: 2,
    },
    albumTitle: {
      ...mentaTypography.bodyMedium,
    },
  });
  return { sentRing, styles };
};
