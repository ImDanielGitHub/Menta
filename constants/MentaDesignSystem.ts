import { mentaFonts } from '@/lib/menta-fonts';

/**
 * Canonical Menta roles derived from the live Paper specification.
 *
 * Keep route code on semantic roles. Purple is for deliberate action,
 * mint is for server-confirmed success, and round radii are for pills/circles.
 */
export const mentaColors = {
  canvas: '#080909',
  surface: '#101111',
  raised: '#181919',
  border: '#2B2C2C',
  warningBorder: '#3A3321',
  borderPaper: '#D8D5CB',
  skeleton: '#1D1E1E',
  skeletonHighlight: '#292A2A',
  scrim: 'rgba(8, 9, 9, 0.82)',
  paper: '#F8F7F1',
  paperPressed: '#EDEBE3',
  text: {
    primary: '#F8F7F1',
    secondary: '#B7B6AF',
    muted: '#85847F',
    onPaper: '#080909',
    mutedOnPaper: '#5F5F5A',
  },
  action: '#B88CFF',
  actionPressed: '#A78BFA',
  actionOnPaper: '#6742A8',
  actionSoft: 'rgba(184, 140, 255, 0.07)',
  actionBorder: 'rgba(184, 140, 255, 0.4)',
  success: '#8DE7B7',
  successSoft: 'rgba(141, 231, 183, 0.15)',
  warning: '#F0C15C',
  warningSoft: 'rgba(240, 193, 92, 0.15)',
  danger: '#FF6B7A',
  dangerSoft: 'rgba(255, 107, 122, 0.15)',
  info: '#8FCBFF',
} as const;

export const mentaSpacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const mentaRadii = {
  none: 0,
  small: 8,
  medium: 12,
  large: 16,
  round: 999,
} as const;

export const mentaLayout = {
  /**
   * Reading measure for long explanatory prose. This is the width a 390pt Paper
   * artboard produces, so it is the right cap for paragraphs and nothing else.
   * Controls, rows, fields, receipts and task surfaces use the task lane.
   */
  /** Inner width for focused reading and authentication screens on a 390pt phone. */
  focusedLane: 342,
  /** Outer frame including the canonical 24pt gutters. */
  focusedFrameMax: 390,
  readingMeasure: 342,
  /**
   * Widest supported phone frame. Screens cap here rather than at the reading
   * measure, so a 430pt device keeps 24pt gutters and a 382pt task lane instead
   * of shrinking to a 342pt column with 44pt gutters.
   *
   * Widths below the 390 Paper frame resolve a tighter gutter overlay through
   * `resolvePhoneLayout`. These frozen tokens stay at 24 / 382.
   */
  phoneFrameMax: 430,
  workingFrameMax: 430,
  /** A wider composition for media, evidence, calendars and dense visual state. */
  immersiveFrameMax: 560,
  /** Usable task width on the widest supported phone. */
  taskLane: 382,
  minimumTouchTarget: 44,
  /** Comfortable height for a primary control or a selectable option row. */
  primaryControlHeight: 56,
  screenInset: 24,
  iconLane: 24,
  trailingActionLane: 44,
} as const;

export const mentaBreakpoints = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
} as const;

export const mentaTypeScale = {
  eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  bodySmall: { fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 23, letterSpacing: 0 },
  bodyLarge: { fontSize: 17, lineHeight: 25, letterSpacing: 0 },
  control: { fontSize: 17, lineHeight: 24, letterSpacing: 0 },
  title: { fontSize: 24, lineHeight: 31, letterSpacing: -0.48 },
  heading: { fontSize: 32, lineHeight: 38, letterSpacing: -0.64 },
  display: { fontSize: 40, lineHeight: 46, letterSpacing: -0.8 },
} as const;

/**
 * Typography roles use the same font names that the root layout loads before
 * the first native frame. They mirror the live Paper contract: Inter handles
 * utility/UI text, while Newsreader is reserved for promises and milestones.
 *
 * Keep route styles on these loaded family names rather than string literals.
 * `technical` remains deliberately separate in `mentaFonts` for admin and
 * error/debug diagnostics only.
 */
export const mentaTypography = {
  /**
   * Small caps. Reserved for genuine receipt facts and repeated list metadata.
   * 12pt with restrained tracking so the few places that keep it stay legible
   * instead of reading as ornament.
   */
  label: {
    fontFamily: mentaFonts.inter.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  labelBold: {
    fontFamily: mentaFonts.inter.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  micro: {
    fontFamily: mentaFonts.inter.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  /** True metadata only: timestamps, counts, row detail. Never guidance. */
  caption: {
    fontFamily: mentaFonts.inter.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  captionMedium: {
    fontFamily: mentaFonts.inter.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: mentaFonts.inter.regular,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  bodySmallMedium: {
    fontFamily: mentaFonts.inter.medium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  body: {
    fontFamily: mentaFonts.inter.regular,
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: mentaFonts.inter.medium,
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0,
  },
  bodySemibold: {
    fontFamily: mentaFonts.inter.semibold,
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0,
  },
  /**
   * The one paragraph directly under a screen heading. Gives a real step between
   * the heading and ordinary body copy without another serif size.
   */
  lead: {
    fontFamily: mentaFonts.inter.regular,
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: 0,
  },
  control: {
    fontFamily: mentaFonts.inter.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
  },
  title: {
    fontFamily: mentaFonts.newsreader.medium,
    fontSize: 24,
    lineHeight: 31,
    letterSpacing: -0.48,
  },
  journeyTitle: {
    fontFamily: mentaFonts.newsreader.medium,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  heading: {
    fontFamily: mentaFonts.newsreader.medium,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
  },
  paywallHero: {
    fontFamily: mentaFonts.newsreader.medium,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.72,
  },
  display: {
    fontFamily: mentaFonts.newsreader.semibold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
} as const;
