import { mentaLayout, mentaSpacing } from '@/constants/MentaDesignSystem';

/**
 * Pure viewport metrics. Subscribe with `usePhoneLayout` from
 * `constants/use-phone-layout.ts`. Do not re-export that hook from this
 * module: high-frequency primitives such as AppButton must stay free of
 * `useWindowDimensions`.
 */

/**
 * Phone layout anchors. These are viewport sizes, not device names.
 *
 * Paper's live lock is 390×844 with 24pt gutters. Widths below that focused
 * frame take a tighter 20pt inset. Widths below the 430 working frame unwrap
 * trailing list values so rows can wrap. Height below 926 tightens vertical
 * rhythm without raising sheet occupancy above the established 0.88 ratio.
 *
 * Apple's compact-width layout margins are 16pt. Menta does not follow that
 * globally: the 24pt Paper gutter stays at 390pt and above so the 430 working
 * frame is unchanged, and only sub-390 widths overlay `mentaSpacing[5]` (20).
 * Type size is never scaled down; `withReadableLeading` only increases lineHeight.
 */
export const phoneLayoutAnchors = {
  compactWidth: 375,
  paperWidth: mentaLayout.focusedFrameMax,
  mediumWidth: 414,
  largeWidth: mentaLayout.phoneFrameMax,
  compactHeight: 667,
  mediumHeight: 896,
  largeHeight: 932,
} as const;

const COMPACT_SCREEN_INSET = mentaSpacing[5];
const LARGE_SCREEN_INSET = mentaLayout.screenInset;
const SHORT_HEIGHT_MAX = 740;
const COMPACT_HEIGHT_MAX = 926;
const DEFAULT_SHEET_MAX_RATIO = 0.88;
const SHORT_SHEET_MAX_RATIO = 0.86;

export type PhoneLayoutMetrics = {
  width: number;
  height: number;
  fontScale: number;
  textScale: number;
  maximumTextScale: number;
  isCompactWidth: boolean;
  isBelowLargeFrame: boolean;
  isCompactHeight: boolean;
  isShortHeight: boolean;
  screenInset: number;
  contentWidth: number;
  headingToBodyGap: number;
  paragraphGap: number;
  stackGap: number;
  emptyStateMinHeight: number;
  emptyStatePaddingVertical: number;
  heroVisualHeight: number;
  todayEmptyMinHeight: number;
  todayAccountabilityMinHeight: number;
  groupsEmptyMinHeight: number;
  groupsBlockingMinHeight: number;
  sheetMaxHeightRatio: number;
  dialogGutter: number;
  headingLineHeightBoost: number;
  bodyLineHeightBoost: number;
  listRowValueMaxWidth: number | undefined;
  keyboardBottomPadding: number;
};

const roundSpacing = (value: number): number => Math.round(value);
const roundTypeMetric = (value: number): number => Math.round(value * 10) / 10;

export const scaleTypeMetrics = (
  role: { fontSize?: number; lineHeight?: number },
  scale: number
): { fontSize?: number; lineHeight?: number } => {
  const safeScale = Number.isFinite(scale) ? Math.max(scale, 0) : 1;
  return {
    ...(typeof role.fontSize === 'number'
      ? { fontSize: roundTypeMetric(role.fontSize * safeScale) }
      : {}),
    ...(typeof role.lineHeight === 'number'
      ? { lineHeight: roundTypeMetric(role.lineHeight * safeScale) }
      : {}),
  };
};

export const resolvePhoneLayout = ({
  width,
  height,
  fontScale = 1,
}: {
  width: number;
  height: number;
  fontScale?: number;
}): PhoneLayoutMetrics => {
  const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 0;
  const safeFontScale = Number.isFinite(fontScale)
    ? Math.max(0.5, fontScale)
    : 1;
  const isCompactWidth = safeWidth < phoneLayoutAnchors.paperWidth;
  const isBelowLargeFrame = safeWidth < phoneLayoutAnchors.largeWidth;
  const isCompactHeight = safeHeight < COMPACT_HEIGHT_MAX;
  const isShortHeight = safeHeight < SHORT_HEIGHT_MAX;
  const maximumTextScale =
    safeWidth < phoneLayoutAnchors.compactWidth || isShortHeight
      ? 1.2
      : safeWidth < phoneLayoutAnchors.mediumWidth || isCompactHeight
        ? 1.3
        : 1.4;
  const textScale = Math.min(Math.max(safeFontScale, 1), maximumTextScale);
  const screenInset = isCompactWidth
    ? COMPACT_SCREEN_INSET
    : LARGE_SCREEN_INSET;
  const frameWidth = Math.min(safeWidth, mentaLayout.phoneFrameMax);
  const contentWidth = Math.max(0, frameWidth - screenInset * 2);
  const headingLineHeightBoost = isCompactWidth ? 2 : 0;
  const bodyLineHeightBoost = safeFontScale >= 1.2 ? 2 : isCompactWidth ? 1 : 0;

  return {
    width: safeWidth,
    height: safeHeight,
    fontScale: safeFontScale,
    textScale,
    maximumTextScale,
    isCompactWidth,
    isBelowLargeFrame,
    isCompactHeight,
    isShortHeight,
    screenInset,
    contentWidth,
    headingToBodyGap: isCompactHeight ? mentaSpacing[2] : mentaSpacing[3],
    paragraphGap: isCompactHeight ? mentaSpacing[2] : mentaSpacing[3],
    stackGap: isCompactHeight ? mentaSpacing[4] : mentaSpacing[5],
    emptyStateMinHeight: isShortHeight ? 152 : isCompactHeight ? 176 : 220,
    emptyStatePaddingVertical: isCompactHeight
      ? mentaSpacing[8]
      : mentaSpacing[10],
    heroVisualHeight: isShortHeight ? 152 : isCompactHeight ? 184 : 224,
    todayEmptyMinHeight: isShortHeight ? 360 : isCompactHeight ? 468 : 612,
    todayAccountabilityMinHeight: isShortHeight
      ? 340
      : isCompactHeight
        ? 448
        : 588,
    groupsEmptyMinHeight: isShortHeight ? 280 : isCompactHeight ? 340 : 420,
    groupsBlockingMinHeight: isShortHeight ? 300 : isCompactHeight ? 360 : 468,
    sheetMaxHeightRatio: isShortHeight
      ? SHORT_SHEET_MAX_RATIO
      : DEFAULT_SHEET_MAX_RATIO,
    dialogGutter: screenInset,
    headingLineHeightBoost,
    bodyLineHeightBoost,
    listRowValueMaxWidth: isBelowLargeFrame ? undefined : 116,
    keyboardBottomPadding: roundSpacing(
      (isCompactHeight ? mentaSpacing[4] : mentaSpacing[5]) +
        Math.max(0, (safeFontScale - 1) * 12)
    ),
  };
};

export const withReadableLeading = <
  T extends { fontSize?: number; lineHeight?: number },
>(
  role: T,
  layout: PhoneLayoutMetrics
): T => {
  const fontSize = role.fontSize;
  const lineHeight = role.lineHeight;
  if (fontSize == null || lineHeight == null) {
    return role;
  }
  const boost =
    fontSize >= 24 ? layout.headingLineHeightBoost : layout.bodyLineHeightBoost;
  if (boost === 0) {
    return role;
  }
  return {
    ...role,
    lineHeight: lineHeight + boost,
  };
};

export const screenInsetPadding = (
  layout: Pick<PhoneLayoutMetrics, 'screenInset'>
): { paddingHorizontal: number } => ({
  paddingHorizontal: layout.screenInset,
});
