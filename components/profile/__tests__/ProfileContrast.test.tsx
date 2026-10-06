import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { mentaColors, mentaLightColors } from '@/constants/MentaDesignSystem';
import { calculateContrastRatio } from '@/lib/accessibility';
import { SUPPORTED_APPEARANCE_ITEMS } from '@/lib/shop/catalogSupport';
import type { ProfileMonth, ProfileMonthDayState } from '@/lib/profile/month';
import { useAppearanceStore } from '@/store/appearance-store';
import { ProfileInviteCard } from '../ProfileInviteCard';
import { ProfileMonthGrid } from '../ProfileMonthGrid';

jest.mock('@/components/ui/MentaMascot', () => ({ MentaMascot: () => null }));
jest.mock('@/lib/localization', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'en-NZ' }),
}));
const mockProgramme = jest.fn().mockResolvedValue({ programmeEnabled: false });
jest.mock('@/store/referral-store', () => ({
  useReferralStore: (selector: (state: unknown) => unknown) =>
    selector({ getReferralProgramStatus: mockProgramme }),
}));

const states: ProfileMonthDayState[] = [
  'kept',
  'frozen',
  'missed',
  'today',
  'open',
  'future',
];
const month: ProfileMonth = {
  monthLabel: 'October',
  daysKept: 1,
  counts: { kept: 1, frozen: 1, missed: 1 },
  days: states.map((state, index) => ({
    localDay: `2026-10-0${index + 1}`,
    dayOfMonth: index + 1,
    weekdayIndex: index,
    state,
  })),
};

// Render translucent state fills over the actual canvas before measuring contrast.
function over(foreground: string, background: string): string {
  if (foreground === 'transparent') return background;
  const rgba = foreground.match(
    /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/
  );
  if (!rgba) return foreground;
  const alpha = Number(rgba[4]);
  return (
    '#' +
    [1, 2, 3]
      .map(index =>
        Math.round(
          Number(rgba[index]) * alpha +
            parseInt(background.slice(index * 2 - 1, index * 2 + 1), 16) *
              (1 - alpha)
        )
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

function composite(
  foreground: string,
  background: string,
  alpha: number
): string {
  const rgb = [1, 3, 5].map(index =>
    parseInt(foreground.slice(index, index + 2), 16)
  );
  return over(`rgba(${rgb.join(', ')}, ${alpha})`, background);
}

const themes = [
  null,
  ...Object.values(SUPPORTED_APPEARANCE_ITEMS)
    .filter(item => item.theme)
    .map(item => item.sku),
];

describe.each(['light', 'dark'] as const)(
  'Profile contrast in %s mode',
  preference => {
    afterEach(() => useAppearanceStore.setState({ preference: 'dark' }));

    it.each(themes)(
      'keeps invitation and every calendar state readable with theme %s',
      async equippedThemeSku => {
        useAppearanceStore.setState({ preference });
        const palette = preference === 'light' ? mentaLightColors : mentaColors;
        const onInvite = jest.fn();
        const screen = render(
          <ThemeProvider equippedThemeSku={equippedThemeSku}>
            <ProfileInviteCard onInvite={onInvite} />
            <ProfileMonthGrid month={month} />
          </ThemeProvider>
        );
        await act(async () => {});
        const card = screen.getByTestId('profile-invite-card');
        const pressEvent = {
          persist: jest.fn(),
          currentTarget: 1,
          nativeEvent: { pageX: 1, pageY: 1, locationX: 1, locationY: 1 },
        };
        const restingAction = StyleSheet.flatten(
          screen.getByTestId('profile-invite-action').props.style
        ).backgroundColor;
        for (const pressed of [false, true]) {
          if (pressed) fireEvent(card, 'responderGrant', pressEvent);
          const cardStyle = StyleSheet.flatten(card.props.style);
          const opacity = cardStyle.opacity ?? 1;
          const washStyle = StyleSheet.flatten(
            screen.getByTestId('profile-invite-wash').props.style
          );
          const washedBackground = composite(
            washStyle.backgroundColor,
            cardStyle.backgroundColor,
            washStyle.opacity
          );
          for (const key of ['invite_title', 'invite_body']) {
            const foreground = StyleSheet.flatten(
              screen.getByText(`fullAuth.tabs_profile.${key}`).props.style
            ).color;
            for (const background of [
              cardStyle.backgroundColor,
              washedBackground,
            ]) {
              expect(
                calculateContrastRatio(
                  composite(foreground, palette.canvas, opacity),
                  composite(background, palette.canvas, opacity)
                )
              ).toBeGreaterThanOrEqual(4.5);
            }
          }
          const actionBackground = StyleSheet.flatten(
            screen.getByTestId('profile-invite-action').props.style
          ).backgroundColor;
          const actionForeground = StyleSheet.flatten(
            screen.getByText('fullAuth.tabs_profile.invite_action').props.style
          ).color;
          expect(
            calculateContrastRatio(
              composite(actionForeground, palette.canvas, opacity),
              composite(actionBackground, palette.canvas, opacity)
            )
          ).toBeGreaterThanOrEqual(4.5);
          if (pressed) {
            expect(opacity).toBe(preference === 'light' ? 1 : 0.9);
            if (preference === 'light')
              expect(actionBackground).not.toBe(restingAction);
          }
        }
        fireEvent(card, 'responderRelease', pressEvent);
        expect(onInvite).toHaveBeenCalledTimes(1);

        for (const day of month.days) {
          const cell = screen.getByTestId(
            `profile-month-${day.localDay}-${day.state}`
          );
          const background = over(
            StyleSheet.flatten(cell.props.style).backgroundColor,
            palette.canvas
          );
          const foreground = StyleSheet.flatten(
            screen.getByText(String(day.dayOfMonth)).props.style
          ).color;
          expect(
            calculateContrastRatio(foreground, background)
          ).toBeGreaterThanOrEqual(4.5);
          expect(cell.props.accessibilityLabel).toBeTruthy();
        }
      }
    );
  }
);
