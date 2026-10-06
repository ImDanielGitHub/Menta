import {
  type MentaPalette,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { TodayCardIcon } from '@/components/today/today-card-icon';
import { TodayPressable } from '@/components/today/TodayPressable';
import {
  AppScaledText as Text,
  useAppTextScale,
} from '@/components/ui/AppScaledText';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  CameraIcon,
  ChevronRightIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
  RotateCcwIcon,
  UsersIcon,
  VideoIcon,
} from '@/components/ui/icons';

import {
  allowsLargeTypeWrap,
  useLargeTypeLineLimit,
} from '@/lib/accessibility';

export type TodayAlsoItemKind =
  | 'review'
  | 'group-risk'
  | 'proof-due'
  | 'proof-pending'
  | 'proof-approved'
  | 'proof-correction';

export type TodayAlsoItem = {
  key: string;
  kind: TodayAlsoItemKind;
  verificationType?: 'photo' | 'video' | 'text';
  title: string;
  detail: string;
  statusLabel?: string;
  accessibilityLabel: string;
  onPress: () => void;
};

const ICON_SIZE = 20;
const TILE_SIZE = 44;

function LeadingTile({ item }: { item: TodayAlsoItem }) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  switch (item.kind) {
    case 'review':
      return (
        <View style={[styles.tile, styles.tileAction]}>
          <EyeIcon color={mentaColors.action} size={ICON_SIZE} />
        </View>
      );
    case 'group-risk':
      return (
        <View style={[styles.tile, styles.tileWarning]}>
          <UsersIcon color={mentaColors.warning} size={ICON_SIZE} />
        </View>
      );
    case 'proof-approved':
      return (
        <View style={[styles.tile, styles.tileSuccess]}>
          <TodayCardIcon kind="approved" color={mentaColors.success} />
        </View>
      );
    case 'proof-pending':
      return (
        <View style={styles.tile}>
          <ClockIcon color={mentaColors.text.secondary} size={ICON_SIZE} />
        </View>
      );
    case 'proof-correction':
      return (
        <View style={[styles.tile, styles.tileWarning]}>
          <RotateCcwIcon color={mentaColors.warning} size={ICON_SIZE} />
        </View>
      );
    case 'proof-due':
      return (
        <View style={styles.tile}>
          {item.verificationType === 'video' ? (
            <VideoIcon color={mentaColors.text.primary} size={ICON_SIZE} />
          ) : item.verificationType === 'text' ? (
            <EditIcon color={mentaColors.text.primary} size={ICON_SIZE} />
          ) : (
            <CameraIcon color={mentaColors.text.primary} size={ICON_SIZE} />
          )}
        </View>
      );
  }
}

/** Proof history stays navigable without looking like another action card. */
function ProofActivityRow({ item }: { item: TodayAlsoItem }) {
  const palette = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);
  const { width, fontScale } = useWindowDimensions();
  const textScale = useAppTextScale() ?? fontScale;
  const stacked = width < 390 || allowsLargeTypeWrap(textScale);
  const approved = item.kind === 'proof-approved';
  const status = item.statusLabel ? (
    <Text
      style={[
        styles.proofStatus,
        { color: approved ? palette.success : palette.text.secondary },
      ]}
    >
      {item.statusLabel}
    </Text>
  ) : null;

  return (
    <TodayPressable
      accessibilityLabel={item.accessibilityLabel}
      onPress={item.onPress}
      pressedStyle={styles.proofPressed}
      style={styles.proofRow}
      testID={`today-also-${item.key}`}
    >
      <View accessible={false} style={styles.proofIcon}>
        {approved ? (
          <TodayCardIcon kind="approved" color={palette.success} />
        ) : (
          <ClockIcon color={palette.text.secondary} size={28} />
        )}
      </View>
      <View style={styles.proofCopy}>
        <View style={styles.proofHeading}>
          <Text style={styles.proofTitle}>{item.title}</Text>
          {!stacked ? status : null}
        </View>
        <Text style={styles.detail}>{item.detail}</Text>
        {stacked ? status : null}
      </View>
      <View accessible={false} style={styles.proofChevron}>
        <ChevronRightIcon color={palette.text.secondary} size={18} />
      </View>
    </TodayPressable>
  );
}

/**
 * Supporting actions and proof history after the hero action. Action cards
 * keep their emphasis; approved/pending proof uses quieter activity rows.
 */
export function TodayAlsoList({
  heading,
  items,
}: {
  heading: string;
  items: readonly TodayAlsoItem[];
}) {
  const mentaColors = useMentaPalette();
  const { STATUS_COLOR, styles } = useMentaStyles(createPaletteStyles);

  const titleLines = useLargeTypeLineLimit(2);
  const detailLines = useLargeTypeLineLimit(1);

  return (
    <View style={styles.list} testID="today-also-list">
      <Text accessibilityRole="header" style={styles.heading}>
        {heading}
      </Text>
      {items.map(item =>
        item.kind === 'proof-approved' || item.kind === 'proof-pending' ? (
          <ProofActivityRow item={item} key={item.key} />
        ) : (
          <TodayPressable
            accessibilityLabel={item.accessibilityLabel}
            key={item.key}
            onPress={item.onPress}
            pressedStyle={styles.rowPressed}
            style={styles.row}
            testID={`today-also-${item.key}`}
          >
            <LeadingTile item={item} />
            <View style={styles.copy}>
              <Text numberOfLines={titleLines} style={styles.title}>
                {item.title}
              </Text>
              <Text numberOfLines={detailLines} style={styles.detail}>
                {item.detail}
              </Text>
              {item.statusLabel ? (
                <Text
                  style={[
                    styles.status,
                    STATUS_COLOR[item.kind]
                      ? { color: STATUS_COLOR[item.kind] }
                      : null,
                  ]}
                >
                  {item.statusLabel}
                </Text>
              ) : null}
            </View>
            <ChevronRightIcon color={mentaColors.text.secondary} size={18} />
          </TodayPressable>
        )
      )}
    </View>
  );
}

/** Loading geometry for the list: the heading and three rows it will hold. */
export function TodayAlsoListSkeleton({
  loadingLabel,
}: {
  loadingLabel: string;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  return (
    <View
      accessible
      accessibilityLabel={loadingLabel}
      accessibilityRole="progressbar"
      style={styles.list}
      testID="today-ledger-loading"
    >
      <SkeletonLoader announce={false} height={20} width={112} />
      {[0, 1, 2].map(index => (
        <View key={index} style={[styles.row, styles.rowSkeleton]}>
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.medium}
            height={TILE_SIZE}
            width={TILE_SIZE}
          />
          <View style={styles.copy}>
            <SkeletonLoader
              announce={false}
              height={16}
              width={index % 2 === 0 ? '72%' : '58%'}
            />
            <SkeletonLoader
              announce={false}
              height={12}
              width={index % 2 === 0 ? '48%' : '62%'}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const STATUS_COLOR: Partial<Record<TodayAlsoItemKind, string>> = {
    'proof-approved': mentaColors.success,
    'proof-correction': mentaColors.warning,
    'group-risk': mentaColors.warning,
  };
  const styles = StyleSheet.create({
    list: {
      alignSelf: 'stretch',
      gap: mentaSpacing[3],
      width: '100%',
    },
    heading: {
      ...mentaTypography.title,
      color: mentaColors.text.primary,
      marginBottom: mentaSpacing[1],
    },
    row: {
      alignItems: 'center',
      backgroundColor: mentaColors.surface,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      flexDirection: 'row',
      gap: mentaSpacing[4],
      minHeight: 80,
      paddingHorizontal: mentaSpacing[4],
      paddingVertical: mentaSpacing[4],
    },
    proofRow: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 0,
      flexDirection: 'row',
      gap: mentaSpacing[4],
      minHeight: 100,
      paddingTop: mentaSpacing[5],
      marginBottom: mentaSpacing[5],
    },
    proofPressed: {
      backgroundColor: mentaColors.raised,
    },
    proofIcon: {
      alignSelf: 'flex-start',
      paddingTop: mentaSpacing[1],
      width: 28,
    },
    proofCopy: {
      borderBottomColor: mentaColors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flex: 1,
      gap: mentaSpacing[4],
      minWidth: 0,
      paddingBottom: mentaSpacing[6],
    },
    proofHeading: {
      alignItems: 'baseline',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: mentaSpacing[3],
    },
    proofTitle: {
      ...mentaTypography.bodySemibold,
      color: mentaColors.text.primary,
      flexBasis: '50%',
      flexGrow: 1,
      flexShrink: 1,
    },
    proofStatus: {
      ...mentaTypography.captionMedium,
      flexShrink: 1,
      maxWidth: '100%',
    },
    proofChevron: {
      flexShrink: 0,
      paddingBottom: mentaSpacing[6],
    },
    rowSkeleton: {
      gap: mentaSpacing[4],
    },
    rowPressed: {
      backgroundColor: mentaColors.raised,
      borderColor: mentaColors.actionBorder,
    },
    tile: {
      alignItems: 'center',
      backgroundColor: mentaColors.raised,
      borderRadius: mentaRadii.medium,
      height: TILE_SIZE,
      justifyContent: 'center',
      width: TILE_SIZE,
    },
    tileAction: {
      backgroundColor: mentaColors.actionSoft,
    },
    tileWarning: {
      backgroundColor: mentaColors.warningSoft,
    },
    tileSuccess: {
      backgroundColor: mentaColors.successSoft,
    },
    copy: {
      flex: 1,
      gap: mentaSpacing[1],
      minWidth: 0,
    },
    title: {
      ...mentaTypography.bodySemibold,
      color: mentaColors.text.primary,
    },
    detail: {
      ...mentaTypography.caption,
      color: mentaColors.text.secondary,
    },
    status: {
      ...mentaTypography.captionMedium,
      color: mentaColors.text.primary,
      marginTop: 2,
      maxWidth: mentaLayout.readingMeasure,
    },
  });
  return { STATUS_COLOR, styles };
};
