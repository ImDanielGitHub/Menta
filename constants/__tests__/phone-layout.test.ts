import {
  phoneLayoutAnchors,
  resolvePhoneLayout,
  scaleTypeMetrics,
  screenInsetPadding,
  withReadableLeading,
} from '@/constants/phone-layout';
import { mentaLayout, mentaTypography } from '@/constants/MentaDesignSystem';

describe('resolvePhoneLayout', () => {
  it('returns concrete rounded metrics for a resolved text envelope', () => {
    expect(scaleTypeMetrics({ fontSize: 32, lineHeight: 38 }, 1.4)).toEqual({
      fontSize: 44.8,
      lineHeight: 53.2,
    });
  });

  it.each([
    { width: 320, height: 568, inset: 20, hero: 152 },
    { width: 390, height: 844, inset: 24, hero: 184 },
    { width: 430, height: 932, inset: 24, hero: 224 },
  ])('resolves the $width-point onboarding frame', frame => {
    const layout = resolvePhoneLayout({ ...frame, fontScale: 1 });
    expect(layout.screenInset).toBe(frame.inset);
    expect(layout.heroVisualHeight).toBe(frame.hero);
    expect(layout.contentWidth).toBe(
      Math.min(frame.width, mentaLayout.phoneFrameMax) - frame.inset * 2
    );
  });

  it('adds readable leading without shrinking Dynamic Type', () => {
    const layout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 1.3,
    });
    const body = withReadableLeading(mentaTypography.body, layout);
    expect(body.fontSize).toBe(mentaTypography.body.fontSize);
    expect(body.lineHeight).toBe(mentaTypography.body.lineHeight + 2);
  });

  it.each([
    { width: 320, height: 568, maximum: 1.2 },
    { width: 390, height: 844, maximum: 1.3 },
    { width: 430, height: 932, maximum: 1.4 },
  ])(
    'bounds text to the $width-point device envelope',
    ({ width, height, maximum }) => {
      const layout = resolvePhoneLayout({
        width,
        height,
        fontScale: 2.35,
      });
      expect(layout.maximumTextScale).toBe(maximum);
      expect(layout.textScale).toBe(maximum);
    }
  );

  it('preserves requested text sizes inside the device envelope', () => {
    const layout = resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 1.25,
    });
    expect(layout.textScale).toBe(1.25);
  });

  it('preserves the full canonical 430-point metrics', () => {
    const layout = resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 1,
    });
    expect(layout).toEqual(
      expect.objectContaining({
        isCompactWidth: false,
        isBelowLargeFrame: false,
        isCompactHeight: false,
        screenInset: mentaLayout.screenInset,
        contentWidth: mentaLayout.taskLane,
        emptyStateMinHeight: 220,
        todayEmptyMinHeight: 612,
        listRowValueMaxWidth: 116,
        sheetMaxHeightRatio: 0.88,
      })
    );
  });

  it('keeps Paper gutters and wrapping at 390×844', () => {
    const layout = resolvePhoneLayout({
      width: phoneLayoutAnchors.paperWidth,
      height: 844,
      fontScale: 1,
    });
    expect(layout.screenInset).toBe(mentaLayout.screenInset);
    expect(layout.contentWidth).toBe(mentaLayout.focusedLane);
    expect(layout.isBelowLargeFrame).toBe(true);
    expect(layout.listRowValueMaxWidth).toBeUndefined();
    expect(layout.sheetMaxHeightRatio).toBe(0.88);
  });

  it.each([
    { width: 375, height: 667, short: true, ratio: 0.86 },
    { width: 375, height: 812, short: false, ratio: 0.88 },
    { width: 360, height: 780, short: false, ratio: 0.88 },
  ])('keeps compact-width type readable at $width×$height', frame => {
    const layout = resolvePhoneLayout({ ...frame, fontScale: 1 });
    expect(layout.isCompactWidth).toBe(true);
    expect(layout.isShortHeight).toBe(frame.short);
    expect(layout.screenInset).toBe(20);
    expect(layout.sheetMaxHeightRatio).toBe(frame.ratio);
    expect(withReadableLeading(mentaTypography.body, layout).fontSize).toBe(
      mentaTypography.body.fontSize
    );
  });

  it('keeps 414×896 height-compact with Paper gutters', () => {
    const layout = resolvePhoneLayout({
      width: 414,
      height: 896,
      fontScale: 1,
    });
    expect(layout.isCompactWidth).toBe(false);
    expect(layout.isCompactHeight).toBe(true);
    expect(layout.screenInset).toBe(mentaLayout.screenInset);
    expect(layout.heroVisualHeight).toBe(184);
    expect(layout.listRowValueMaxWidth).toBeUndefined();
  });

  it('keeps Paper gutters on a 393-point Pro-class viewport', () => {
    const layout = resolvePhoneLayout({
      width: 393,
      height: 852,
      fontScale: 1,
    });
    expect(layout.isCompactWidth).toBe(false);
    expect(layout.screenInset).toBe(mentaLayout.screenInset);
  });

  it('exposes canonical horizontal inset overlays', () => {
    expect(
      screenInsetPadding(resolvePhoneLayout({ width: 375, height: 667 }))
    ).toEqual({ paddingHorizontal: 20 });
    expect(
      screenInsetPadding(resolvePhoneLayout({ width: 390, height: 844 }))
    ).toEqual({ paddingHorizontal: mentaLayout.screenInset });
  });
});
