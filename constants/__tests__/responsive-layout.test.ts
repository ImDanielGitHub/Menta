import {
  resolveAdaptiveLayout,
  resolveAdaptiveScreenMaxWidth,
  shouldUseBoundedIPadSheet,
  shouldUseIPadNavigationRail,
  shouldUseIPadTwoColumnLayout,
} from '@/constants/responsive-layout';
import { mentaLayout } from '@/constants/MentaDesignSystem';

describe('adaptive window layout', () => {
  it.each([
    { width: 390, isIPad: false, expected: 'phone', gutter: 24 },
    { width: 430, isIPad: false, expected: 'phone', gutter: 24 },
    { width: 599, isIPad: true, expected: 'compact', gutter: 24 },
    { width: 600, isIPad: true, expected: 'medium', gutter: 32 },
    { width: 820, isIPad: true, expected: 'medium', gutter: 32 },
    { width: 959, isIPad: true, expected: 'medium', gutter: 32 },
    { width: 960, isIPad: true, expected: 'wide', gutter: 40 },
    { width: 1024, isIPad: true, expected: 'wide', gutter: 40 },
    { width: 1366, isIPad: true, expected: 'wide', gutter: 40 },
  ])(
    'classifies a $width point window as $expected',
    ({ width, isIPad, expected, gutter }) => {
      const layout = resolveAdaptiveLayout({
        width,
        isIPad,
        lane: 'working',
      });

      expect(layout.windowClass).toBe(expected);
      expect(layout.gutter).toBe(gutter);
      expect(layout.navigationMode).toBe('bottom');
    }
  );

  it('preserves phone geometry in compact iPad Split View', () => {
    const layout = resolveAdaptiveLayout({
      width: 599,
      isIPad: true,
      lane: 'immersive',
    });

    expect(layout.laneWidth).toBe(512);
    expect(layout.usableWidth).toBe(551);
    expect(layout.workspaceEligible).toBe(false);
    expect(
      resolveAdaptiveScreenMaxWidth({
        lane: 'immersive',
        width: 599,
        isIPad: true,
        phoneMaxWidth: 560,
      })
    ).toBe(560);
  });

  it.each([
    { width: 320, gutter: 20, laneWidth: 280 },
    { width: 390, gutter: 24, laneWidth: 342 },
    { width: 430, gutter: 24, laneWidth: 382 },
  ])(
    'gives focused tasks a $laneWidth point lane at $width points',
    ({ width, gutter, laneWidth }) => {
      const layout = resolveAdaptiveLayout({
        width,
        isIPad: false,
        lane: 'focused',
      });

      expect(layout.gutter).toBe(gutter);
      expect(layout.laneWidth).toBe(laneWidth);
      expect(layout.laneWidth).toBe(layout.usableWidth);
    }
  );

  it('keeps the 430 point task lane wider than the prose measure', () => {
    const layout = resolveAdaptiveLayout({
      width: 430,
      isIPad: false,
      lane: 'focused',
    });

    expect(layout.laneWidth).toBe(mentaLayout.taskLane);
    expect(layout.laneWidth).toBeGreaterThan(mentaLayout.readingMeasure);
  });

  it('widens portrait and landscape task lanes without a navigation rail', () => {
    expect(shouldUseIPadNavigationRail()).toBe(false);

    const portrait = resolveAdaptiveLayout({
      width: 820,
      isIPad: true,
      lane: 'working',
    });
    const landscape = resolveAdaptiveLayout({
      width: 1180,
      isIPad: true,
      lane: 'working',
    });

    expect(portrait.laneWidth).toBe(756);
    expect(portrait.workspaceEligible).toBe(false);
    expect(landscape.laneWidth).toBe(1100);
    expect(landscape.workspaceEligible).toBe(true);
  });

  it('uses usable content width for workspace eligibility', () => {
    expect(shouldUseIPadTwoColumnLayout(900, true)).toBe(false);
    expect(shouldUseIPadTwoColumnLayout(960, true)).toBe(true);
    expect(shouldUseIPadTwoColumnLayout(1024, true)).toBe(true);
    expect(shouldUseIPadTwoColumnLayout(1366, true)).toBe(true);
  });

  it('keeps contextual sheets on the edge and bounds explicit dialogs', () => {
    expect(
      resolveAdaptiveLayout({
        width: 1180,
        isIPad: true,
        lane: 'focused',
        presentationRole: 'edge',
      }).presentationGeometry
    ).toBe('edge');
    expect(shouldUseBoundedIPadSheet(599, true)).toBe(false);
    expect(shouldUseBoundedIPadSheet(600, true)).toBe(true);
  });

  it('lets full media use the available safe width', () => {
    const layout = resolveAdaptiveLayout({
      width: 1024,
      safeAreaHorizontal: 24,
      isIPad: true,
      lane: 'full',
    });

    expect(layout.gutter).toBe(0);
    expect(layout.usableWidth).toBe(1000);
    expect(layout.laneWidth).toBeUndefined();
  });
});
