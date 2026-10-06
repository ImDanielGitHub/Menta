import React from 'react';
import { StyleSheet, View } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { mentaColors, mentaLightColors } from '@/constants/MentaDesignSystem';
import { MomentaTopUp } from '@/components/momenta/momenta-top-up';
import {
  InvitePassCard,
  InviteChecklist,
} from '@/components/referral/InviteStory';
import { PromiseLengthStep } from '@/components/challenge/create/PromiseFlow';
import { HoldToSendButton } from '@/components/proof/HoldToSendButton';

let mockAppearance: 'light' | 'dark' = 'light';
let mockBeginHold: (() => void) | undefined;
jest.mock('@/store/appearance-store', () => ({
  useAppearanceStore: (select: (s: unknown) => unknown) =>
    select({ preference: mockAppearance }),
}));
jest.mock('@/lib/shop/catalogSupport', () => ({
  getThemeAppearance: () => null,
}));
jest.mock('@/lib/localization', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'en-NZ' }),
}));
jest.mock('@/lib/localization/use-translation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'en-NZ' }),
}));
jest.mock('@/lib/localization/en-NZ', () => ({ enNZ: {} }));
jest.mock('@/lib/localization/translate', () => ({
  translate: (_locale: string, key: string) => key,
}));
jest.mock('@/lib/ad-availability', () => ({ formatAdCountdown: () => '0:30' }));
jest.mock('@/components/ui/MentaMascot', () => ({ MentaMascot: () => null }));
jest.mock('@/components/onboarding/MentaNarrator', () => ({
  MentaNarrator: () => null,
}));
jest.mock('@/lib/menta-fonts', () => ({
  mentaFonts: {
    inter: {
      regular: 'Inter',
      medium: 'Inter',
      semibold: 'Inter',
      bold: 'Inter',
    },
    newsreader: {
      regular: 'Newsreader',
      medium: 'Newsreader',
      semibold: 'Newsreader',
    },
    technical: 'monospace',
  },
}));
jest.mock('@/lib/motion/haptics', () => ({ emitHaptic: jest.fn() }));
jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    reduceMotion: false,
    screenReaderEnabled: false,
    duration: (n: number) => n,
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/components/ui/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const icon = ({ color }: { color: string }) => (
    <View testID="contrast-icon" style={{ color }} />
  );
  return {
    CheckIcon: icon,
    XIcon: icon,
    PlayIcon: icon,
    CrownIcon: icon,
    SendIcon: icon,
    CameraIcon: icon,
    ChevronLeftIcon: icon,
    FileTextIcon: icon,
    LockIcon: icon,
    UserPlusIcon: icon,
    VideoIcon: icon,
  };
});
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  cancelAnimation: jest.fn(),
  Easing: {
    linear: (n: number) => n,
    cubic: (n: number) => n,
    out: (f: unknown) => f,
  },
  runOnJS: (f: unknown) => f,
  useAnimatedReaction: jest.fn(),
  useAnimatedStyle: (f: () => unknown) => f(),
  useSharedValue: (value: number) => ({ value }),
  withTiming: (value: number) => value,
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  Gesture: {
    LongPress: () => {
      const gesture = {
        minDuration: () => gesture,
        maxDistance: () => gesture,
        enabled: () => gesture,
        onBegin: (f: () => void) => {
          mockBeginHold = f;
          return gesture;
        },
        onStart: () => gesture,
        onFinalize: () => gesture,
      };
      return gesture;
    },
  },
}));

function rgb(color: string): number[] {
  const hex = color.replace('#', '');
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
}
function over(color: string, background: string, opacity = 1): string {
  if (color === 'transparent') return background;
  const rgba = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  const channels = rgba ? rgba.slice(1, 4).map(Number) : rgb(color);
  const alpha = opacity * (rgba ? Number(rgba[4]) : 1);
  return (
    '#' +
    channels
      .map((v, i) =>
        Math.round(v * alpha + rgb(background)[i] * (1 - alpha))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}
function contrast(a: string, b: string): number {
  const luminance = (c: string) =>
    rgb(c)
      .map(v => v / 255)
      .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (light + 0.05) / (dark + 0.05);
}
function nearestBackground(node: { parent?: any }, fallback: string): string {
  let current = node.parent;
  while (current) {
    const bg = StyleSheet.flatten(current.props.style)?.backgroundColor;
    if (typeof bg === 'string' && bg !== 'transparent')
      return over(bg, fallback);
    current = current.parent;
  }
  return fallback;
}
const wrap = (children: React.ReactNode) => (
  <ThemeProvider>{children}</ThemeProvider>
);

for (const appearance of ['light', 'dark'] as const) {
  describe(`${appearance} foreground/background regressions`, () => {
    const palette = appearance === 'light' ? mentaLightColors : mentaColors;
    beforeEach(() => {
      mockAppearance = appearance;
      mockBeginHold = undefined;
    });
    it('keeps the Momenta top-up heading and explanation readable on their actual sheet', () => {
      const view = render(
        wrap(
          <MomentaTopUp
            subject="promise"
            shortfall={20}
            balance={10}
            required={30}
            adReward={10}
            adLoading={false}
            adRest={null}
            credited={0}
            onGoPro={jest.fn()}
            onClose={jest.fn()}
          />
        )
      );
      for (const text of [
        view.getByTestId('momenta-top-up-title'),
        view.getByText('commerce.topUp.waits.promise'),
      ]) {
        const fg = StyleSheet.flatten(text.props.style).color as string;
        expect(
          contrast(fg, nearestBackground(text, palette.canvas))
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
    it('keeps invitation card, sender line and checklist readable including the decorative wash', () => {
      const view = render(
        wrap(
          <>
            <InvitePassCard
              title="Join Alex"
              fromLine="From Alex"
              initial="A"
            />
            <InviteChecklist items={[{ text: 'Send proof together' }]} />
          </>
        )
      );
      const card = view.getByTestId('invite-pass-card');
      const bg = StyleSheet.flatten(card.props.style).backgroundColor as string;
      const wash = view
        .UNSAFE_getAllByType(View)
        .map(n => StyleSheet.flatten(n.props.style))
        .find(
          s => s?.opacity && s?.position === 'absolute' && s?.backgroundColor
        );
      const washed = over(wash!.backgroundColor as string, bg, wash!.opacity);
      for (const label of ['Join Alex', 'From Alex']) {
        const fg = StyleSheet.flatten(view.getByText(label).props.style)
          .color as string;
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fg, washed)).toBeGreaterThanOrEqual(4.5);
      }
      const checklist = view.getByText('Send proof together');
      expect(
        contrast(
          StyleSheet.flatten(checklist.props.style).color as string,
          palette.canvas
        )
      ).toBeGreaterThanOrEqual(4.5);
    });
    it.each(['every', 'weekdays', 'custom'] as const)(
      'keeps the selected %s schedule label readable',
      kind => {
        const view = render(
          wrap(
            <PromiseLengthStep
              promiseTitle="Read daily"
              summary="Photo proof"
              durations={[7]}
              duration={7}
              plan={kind === 'custom' ? { kind, days: [1, 3, 5] } : { kind }}
              onChangeDuration={jest.fn()}
              onChangePlan={jest.fn()}
            />
          )
        );
        const key = {
          every: 'everyDay',
          weekdays: 'weekdays',
          custom: 'pickDays',
        }[kind];
        const fg = StyleSheet.flatten(
          view.getByText(`todayProof.createFlow.${key}`).props.style
        ).color as string;
        const bg = StyleSheet.flatten(
          view.getByTestId(`create-promise-days-${kind}`).props.style
        ).backgroundColor as string;
        expect(contrast(fg, over(bg, palette.canvas))).toBeGreaterThanOrEqual(
          4.5
        );
      }
    );
    it('keeps the send icon and active holding copy readable on the expanding paper fill', () => {
      jest.useFakeTimers();
      const view = render(
        wrap(
          <HoldToSendButton
            onComplete={jest.fn()}
            label="Hold to send"
            holdingLabel="Keep holding"
          />
        )
      );
      const fill = StyleSheet.flatten(
        view.getByTestId('hold-to-send-button-progress').props.style
      ).backgroundColor as string;
      const iconRatio = contrast(
        StyleSheet.flatten(
          view.getByTestId('contrast-icon', { includeHiddenElements: true })
            .props.style
        ).color as string,
        fill
      );
      act(() => mockBeginHold?.());
      act(() => jest.advanceTimersByTime(900));
      const textRatios = [
        'Keep holding',
        'todayProof.proof.release_cancel',
      ].map(label => {
        const style = StyleSheet.flatten(view.getByText(label).props.style);
        return contrast(
          over(style.color as string, fill, style.opacity ?? 1),
          fill
        );
      });
      view.unmount();
      jest.useRealTimers();
      expect(iconRatio).toBeGreaterThanOrEqual(3);
      textRatios.forEach(ratio => expect(ratio).toBeGreaterThanOrEqual(4.5));
    });
  });
}
