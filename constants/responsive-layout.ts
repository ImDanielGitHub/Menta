import { mentaLayout, mentaSpacing } from '@/constants/MentaDesignSystem';

/** Window-aware layout contract for the 1.9.2 candidate. */
export const IPAD_COMPACT_WINDOW_MAX = 599;
export const IPAD_REGULAR_WINDOW_MIN = 960;
export const IPAD_TWO_COLUMN_CONTENT_MIN = 880;
export const IPAD_NAVIGATION_RAIL_WIDTH = 216;
export const IPAD_BOUNDED_SHEET_MIN_WIDTH = 600;
export const IPAD_BOUNDED_SHEET_MAX_WIDTH = 600;

// Compatibility exports for older callers. New layout code must use resolved
// gutters and type roles instead of multiplying iPad values.
export const IPAD_SPACING_MULTIPLIER = 1.5;
export const IPAD_FONT_SCALE_MULTIPLIER = 1.15;
export const IPAD_MAX_CONTENT_WIDTH = 720;
export const IPAD_BOTTOM_PADDING_MULTIPLIER = 2;

export type AdaptiveScreenLane = 'focused' | 'working' | 'immersive' | 'full';
export type AdaptiveWindowClass = 'phone' | 'compact' | 'medium' | 'wide';
export type AdaptiveNavigationMode = 'bottom';
export type AdaptivePresentationRole =
  | 'edge'
  | 'bounded'
  | 'popover'
  | 'full_screen';
export type AdaptivePresentationGeometry = AdaptivePresentationRole;

export type AdaptiveLayout = {
  windowClass: AdaptiveWindowClass;
  navigationMode: AdaptiveNavigationMode;
  usableWidth: number;
  gutter: number;
  laneWidth: number | undefined;
  workspaceEligible: boolean;
  presentationGeometry: AdaptivePresentationGeometry;
};

const MEDIUM_LANE_WIDTHS: Record<AdaptiveScreenLane, number | undefined> = {
  focused: 780,
  working: 820,
  immersive: 900,
  full: undefined,
};

const WIDE_LANE_WIDTHS: Record<AdaptiveScreenLane, number | undefined> = {
  focused: 1040,
  working: 1180,
  immersive: 1280,
  full: undefined,
};

const PHONE_LANE_WIDTHS: Record<AdaptiveScreenLane, number | undefined> = {
  // Focused routes still contain task objects, controls, facts and receipts.
  // Give them the same large-phone frame as working routes; long prose opts
  // into mentaLayout.readingMeasure at the text block instead of narrowing the
  // entire screen family.
  focused: mentaLayout.workingFrameMax,
  working: mentaLayout.workingFrameMax,
  immersive: mentaLayout.immersiveFrameMax,
  full: undefined,
};

const resolveWindowClass = (
  width: number,
  isIPad: boolean
): AdaptiveWindowClass => {
  if (!isIPad) return 'phone';
  if (width <= IPAD_COMPACT_WINDOW_MAX) return 'compact';
  if (width < IPAD_REGULAR_WINDOW_MIN) return 'medium';
  return 'wide';
};

const resolveGutter = (
  width: number,
  windowClass: AdaptiveWindowClass
): number => {
  if (windowClass === 'medium') return mentaSpacing[8];
  if (windowClass === 'wide') return mentaSpacing[10];
  return width < mentaLayout.focusedFrameMax
    ? mentaSpacing[5]
    : mentaLayout.screenInset;
};

const resolvePresentationGeometry = ({
  presentationRole,
  windowClass,
}: {
  presentationRole: AdaptivePresentationRole;
  windowClass: AdaptiveWindowClass;
}): AdaptivePresentationGeometry => {
  if (presentationRole !== 'bounded') return presentationRole;
  return windowClass === 'phone' || windowClass === 'compact'
    ? 'edge'
    : 'bounded';
};

export const resolveAdaptiveLayout = ({
  width,
  safeAreaHorizontal = 0,
  isIPad,
  lane,
  presentationRole = 'edge',
}: {
  width: number;
  safeAreaHorizontal?: number;
  isIPad: boolean;
  lane: AdaptiveScreenLane;
  presentationRole?: AdaptivePresentationRole;
}): AdaptiveLayout => {
  const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  const safeArea = Number.isFinite(safeAreaHorizontal)
    ? Math.max(0, safeAreaHorizontal)
    : 0;
  const windowClass = resolveWindowClass(safeWidth, isIPad);
  const gutter = lane === 'full' ? 0 : resolveGutter(safeWidth, windowClass);
  const usableWidth = Math.max(0, safeWidth - safeArea - gutter * 2);
  const laneWidths =
    windowClass === 'wide'
      ? WIDE_LANE_WIDTHS
      : windowClass === 'medium'
        ? MEDIUM_LANE_WIDTHS
        : PHONE_LANE_WIDTHS;
  const requestedFrameWidth = laneWidths[lane];
  const availableFrameWidth = Math.max(0, safeWidth - safeArea);
  const laneWidth =
    lane === 'full'
      ? undefined
      : Math.max(
          0,
          Math.min(
            requestedFrameWidth ?? availableFrameWidth,
            availableFrameWidth
          ) -
            gutter * 2
        );

  return {
    windowClass,
    // Daniel explicitly rejected the persistent iPad rail for 1.9.2.
    navigationMode: 'bottom',
    usableWidth,
    gutter,
    laneWidth,
    workspaceEligible:
      isIPad &&
      windowClass !== 'compact' &&
      usableWidth >= IPAD_TWO_COLUMN_CONTENT_MIN,
    presentationGeometry: resolvePresentationGeometry({
      presentationRole,
      windowClass,
    }),
  };
};

export const shouldUseIPadNavigationRail = (
  _width?: number,
  _isIPad?: boolean
): boolean => false;

export const shouldUseIPadTwoColumnLayout = (
  width: number,
  isIPad: boolean,
  safeAreaHorizontal = 0
): boolean =>
  resolveAdaptiveLayout({
    width,
    safeAreaHorizontal,
    isIPad,
    lane: 'working',
  }).workspaceEligible;

export const shouldUseBoundedIPadSheet = (
  width: number,
  isIPad: boolean
): boolean =>
  resolveAdaptiveLayout({
    width,
    isIPad,
    lane: 'focused',
    presentationRole: 'bounded',
  }).presentationGeometry === 'bounded';

export const resolveAdaptiveScreenMaxWidth = ({
  lane,
  width,
  isIPad,
  phoneMaxWidth,
}: {
  lane: AdaptiveScreenLane;
  width: number;
  isIPad: boolean;
  phoneMaxWidth?: number;
}): number | undefined => {
  if (!isIPad || width <= IPAD_COMPACT_WINDOW_MAX) return phoneMaxWidth;
  const layout = resolveAdaptiveLayout({ width, isIPad, lane });
  return layout.laneWidth == null
    ? undefined
    : layout.laneWidth + layout.gutter * 2;
};
