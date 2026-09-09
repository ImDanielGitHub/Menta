import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { TodayStateCard } from '@/components/loop/TodayStateCard';
import { AppTextScaleProvider } from '@/components/ui/AppScaledText';
import type { TodayPresentation } from '@/components/loop/today-copy';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import type { DailyLoopState } from '@/lib/loop';
import type { MotionPreferences } from '@/lib/motion/use-motion-preferences';
import { resolvePhoneLayout } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';

jest.mock('@/components/ui/MentaMascot', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    MentaMascot: ({
      state,
      style,
      testID,
    }: {
      state: string;
      style?: unknown;
      testID?: string;
    }) =>
      React.createElement(View, {
        style,
        testID: testID ?? `mascot-${state}`,
      }),
  };
});

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: jest.fn(),
}));

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: jest.fn(() =>
    jest.requireActual('@/constants/phone-layout').resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 1,
    })
  ),
}));

const mockedUsePhoneLayout = usePhoneLayout as jest.MockedFunction<
  typeof usePhoneLayout
>;

const reducedMotion: MotionPreferences = {
  reduceMotion: true,
  screenReaderEnabled: false,
  allowsTransform: false,
  allowsLoops: false,
  duration: () => 0,
  distance: () => 0,
  scale: () => 1,
  resolveTransform: transform => transform,
  shouldLoop: () => false,
};

const createPresentation = (state: DailyLoopState): TodayPresentation => ({
  state,
  layout: ['loading', 'offline-stale', 'load-failed', 'group-at-risk'].includes(
    state
  )
    ? 'system'
    : state === 'streak-broken' || state === 'returning'
      ? 'accountability'
      : state === 'no-promises'
        ? 'empty'
        : 'hero',
  dateLabel: 'MONDAY, 3 AUGUST',
  accent: state === 'accepted-today' ? 'success' : 'action',
  title: `State: ${state}`,
  detail: `A truthful ${state} state.`,
  primaryLabel: `Primary ${state}`,
  secondaryLabel: state === 'loading' ? null : `Secondary ${state}`,
  primaryAction:
    state === 'loading'
      ? 'wait'
      : state === 'proof-uploading'
        ? 'wait-upload'
        : 'submit-proof',
  mascot: state === 'loading' || state === 'all-clear' ? null : 'proof-proud',
  animateMascot: state === 'accepted-today',
});

describe('TodayStateCard', () => {
  beforeEach(() => {
    jest.mocked(useMotionPreferences).mockReturnValue(reducedMotion);
    mockedUsePhoneLayout.mockReturnValue(
      resolvePhoneLayout({
        width: 430,
        height: 932,
        fontScale: 1,
      })
    );
  });

  it('preserves native scaling when no viewport envelope exists', () => {
    const presentation = createPresentation('group-at-risk');
    const { getByText } = render(
      <TodayStateCard onPrimaryPress={jest.fn()} presentation={presentation} />
    );

    expect(getByText(presentation.title).props.allowFontScaling).toBe(
      undefined
    );
  });

  it('inherits an outer viewport envelope', () => {
    const presentation = createPresentation('group-at-risk');
    const { getByText } = render(
      <AppTextScaleProvider scale={1.3}>
        <TodayStateCard
          onPrimaryPress={jest.fn()}
          presentation={presentation}
        />
      </AppTextScaleProvider>
    );

    expect(getByText(presentation.title)).toHaveStyle({
      fontSize: 31.2,
      lineHeight: 40.3,
    });
  });

  it('lets an explicit local envelope override its parent', () => {
    const presentation = createPresentation('group-at-risk');
    const { getByText } = render(
      <AppTextScaleProvider scale={1.4}>
        <TodayStateCard
          onPrimaryPress={jest.fn()}
          presentation={presentation}
          textScale={1.2}
        />
      </AppTextScaleProvider>
    );

    expect(getByText(presentation.title)).toHaveStyle({
      fontSize: 28.8,
      lineHeight: 37.2,
    });
  });

  it('uses the large-phone task lane', () => {
    const presentation = createPresentation('proof-due');
    const { getByTestId } = render(
      <TodayStateCard onPrimaryPress={jest.fn()} presentation={presentation} />
    );

    expect(getByTestId('today-state-proof-due')).toHaveStyle({
      maxWidth: mentaLayout.taskLane,
      width: '100%',
    });
  });

  it('lets hero detail use the full measure on compact-width phones', () => {
    mockedUsePhoneLayout.mockReturnValue(
      resolvePhoneLayout({
        width: 375,
        height: 667,
        fontScale: 1,
      })
    );
    const presentation = createPresentation('proof-due');
    const { getByText } = render(
      <TodayStateCard onPrimaryPress={jest.fn()} presentation={presentation} />
    );

    expect(getByText(presentation.detail)).toHaveStyle({
      maxWidth: '100%',
      textAlign: 'center',
    });
  });

  it('keeps current streak and promise progress in the first useful viewport', () => {
    const presentation = createPresentation('proof-due');
    const { getByLabelText, getByText } = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        presentation={presentation}
        progress={{ streakCount: 6, dayNumber: 4, totalDays: 14 }}
      />
    );

    expect(getByText('6 days')).toBeTruthy();
    expect(getByText('Day 4 of 14')).toBeTruthy();
    expect(
      getByLabelText('Current streak 6 days. Promise progress Day 4 of 14.')
    ).toBeTruthy();
  });

  it('renders the loading skeleton rather than an empty or clear result', () => {
    const { getByTestId, queryByText } = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        presentation={createPresentation('loading')}
      />
    );

    expect(getByTestId('today-state-loading')).toBeTruthy();
    expect(getByTestId('today-loading-skeleton')).toBeTruthy();
    expect(queryByText('Primary loading')).toBeNull();
  });

  it.each<DailyLoopState>([
    'offline-stale',
    'load-failed',
    'streak-broken',
    'returning',
    'no-promises',
    'proof-due',
    'proof-saved-local',
    'proof-pending-review',
    'correction-requested',
    'review-required',
    'group-at-risk',
    'accepted-today',
    'all-clear',
  ])('renders the %s variant with its explicit title and actions', state => {
    const onPrimaryPress = jest.fn();
    const onSecondaryPress = jest.fn();
    const presentation = createPresentation(state);
    const { getByLabelText, getByTestId, getByText } = render(
      <TodayStateCard
        onPrimaryPress={onPrimaryPress}
        onSecondaryPress={onSecondaryPress}
        presentation={presentation}
      />
    );

    expect(getByTestId(`today-state-${state}`)).toBeTruthy();
    expect(getByText(presentation.title)).toBeTruthy();
    if (presentation.mascot && presentation.layout !== 'accountability') {
      expect(getByTestId('mascot-proof-proud')).toBeTruthy();
    }

    fireEvent.press(getByLabelText(presentation.primaryLabel));
    fireEvent.press(getByLabelText(presentation.secondaryLabel!));

    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
    expect(onSecondaryPress).toHaveBeenCalledTimes(1);
  });

  it('keeps system-state display copy bounded so actions remain reachable at accessibility sizes', () => {
    const presentation = createPresentation('group-at-risk');
    const { getByText } = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        onSecondaryPress={jest.fn()}
        presentation={presentation}
        textScale={1.3}
      />
    );

    expect(getByText(presentation.title)).toHaveProp('allowFontScaling', false);
    expect(getByText(presentation.title)).toHaveStyle({
      fontSize: 31.2,
      lineHeight: 40.3,
    });
    expect(getByText(presentation.detail)).toHaveStyle({
      fontSize: 20.8,
      lineHeight: 29.9,
    });
  });

  it('shows proof upload as progress without a fake waiting action', () => {
    const onPrimaryPress = jest.fn();
    const onSecondaryPress = jest.fn();
    const presentation = createPresentation('proof-uploading');
    const { getByLabelText, queryByLabelText } = render(
      <TodayStateCard
        onPrimaryPress={onPrimaryPress}
        onSecondaryPress={onSecondaryPress}
        presentation={presentation}
      />
    );

    expect(queryByLabelText(presentation.primaryLabel)).toBeNull();
    fireEvent.press(getByLabelText(presentation.secondaryLabel!));

    expect(onPrimaryPress).not.toHaveBeenCalled();
    expect(onSecondaryPress).toHaveBeenCalledTimes(1);
  });

  it('renders proof-object states without an empty mascot panel', () => {
    const presentation = {
      ...createPresentation('proof-pending-review'),
      mascot: null,
    };
    const { queryByTestId } = render(
      <TodayStateCard onPrimaryPress={jest.fn()} presentation={presentation} />
    );

    expect(queryByTestId('today-hero-visual')).toBeNull();
    expect(queryByTestId('mascot-proof-proud')).toBeNull();
  });

  it('shows the all-clear count without a mascot or generated hero panel', () => {
    const presentation = {
      ...createPresentation('all-clear'),
      mascot: null,
      title: 'Nothing needs you right now.',
      detail: 'Come back when a promise is due or someone sends proof.',
      reviewStatus: 'No proof is waiting for your review.',
    };
    const { getByLabelText, getByTestId, queryByTestId } = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        presentation={presentation}
        textScale={1.3}
      />
    );

    expect(getByTestId('today-all-clear-summary')).toBeTruthy();
    expect(
      getByLabelText('0 due now. No proof is waiting for your review.')
    ).toBeTruthy();
    expect(queryByTestId('today-hero-visual')).toBeNull();
    expect(queryByTestId('mascot-proof-proud')).toBeNull();
    expect(getByTestId('today-all-clear-summary')).toHaveStyle({
      flexWrap: 'wrap',
    });
  });

  it('does not announce a clear review queue when that optional read is unavailable', () => {
    const presentation = {
      ...createPresentation('all-clear'),
      mascot: null,
      reviewStatus: null,
    };
    const { getByLabelText, queryByText } = render(
      <TodayStateCard onPrimaryPress={jest.fn()} presentation={presentation} />
    );

    expect(getByLabelText('0 due now.')).toBeTruthy();
    expect(queryByText('No proof is waiting for your review.')).toBeNull();
  });

  it('keeps the accepted mascot visible without clipping', () => {
    const presentation = createPresentation('accepted-today');
    const { getByTestId } = render(
      <TodayStateCard onPrimaryPress={jest.fn()} presentation={presentation} />
    );

    expect(getByTestId('today-hero-visual')).toHaveStyle({
      overflow: 'visible',
    });
    expect(getByTestId('mascot-proof-proud')).toBeTruthy();
  });

  it('gives the missed-day mascot enough unclipped contain space', () => {
    mockedUsePhoneLayout.mockReturnValue(
      resolvePhoneLayout({
        width: 390,
        height: 844,
        fontScale: 1,
      })
    );
    const presentation = {
      ...createPresentation('streak-broken'),
      mascot: 'calm-warning' as const,
      supportingNote: 'A smaller next step.',
    };
    const { getByTestId } = render(
      <TodayStateCard onPrimaryPress={jest.fn()} presentation={presentation} />
    );

    expect(getByTestId('today-accountability-mascot-calm-warning')).toHaveStyle(
      { flexShrink: 0 }
    );
    expect(getByTestId('today-accountability-visual')).toHaveStyle({
      minHeight: 148,
      overflow: 'visible',
      width: '100%',
    });
    expect(getByTestId('today-accountability-state')).toHaveStyle({
      minHeight: 448,
    });
  });

  it('uses the viewport height for returning, empty, and all-clear states', () => {
    mockedUsePhoneLayout.mockReturnValue(
      resolvePhoneLayout({
        width: 320,
        height: 667,
        fontScale: 1,
      })
    );

    const returning = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        presentation={createPresentation('returning')}
      />
    );
    expect(returning.getByTestId('today-accountability-state')).toHaveStyle({
      minHeight: 340,
    });
    returning.unmount();

    const empty = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        presentation={createPresentation('no-promises')}
      />
    );
    expect(empty.getByTestId('today-empty-state')).toHaveStyle({
      minHeight: 360,
    });
    expect(empty.getByTestId('today-empty-visual')).toHaveStyle({
      minHeight: 152,
    });
    empty.unmount();

    const allClear = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        presentation={createPresentation('all-clear')}
      />
    );
    expect(allClear.getByTestId('today-all-clear-state')).toHaveStyle({
      minHeight: 340,
    });
  });

  it('shows a protected receipt without replacing the proof action', () => {
    const onPrimaryPress = jest.fn();
    const presentation: TodayPresentation = {
      ...createPresentation('proof-due'),
      primaryLabel: 'Log today’s proof',
      accountabilityReceipt: {
        title: 'Streak protected',
        detail:
          'A Streak Freeze covered Tuesday’s missed day. The day stays in your history.',
      },
    };
    const { getByLabelText, getByTestId } = render(
      <TodayStateCard
        onPrimaryPress={onPrimaryPress}
        presentation={presentation}
      />
    );

    expect(getByTestId('today-accountability-receipt')).toBeTruthy();
    expect(
      getByLabelText(
        'Streak protected. A Streak Freeze covered Tuesday’s missed day. The day stays in your history.'
      )
    ).toBeTruthy();
    fireEvent.press(getByLabelText('Log today’s proof'));
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
  });

  it('uses the canonical at-risk mascot and removes an invalid four-hour snooze', () => {
    const presentation: TodayPresentation = {
      ...createPresentation('proof-due'),
      layout: 'accountability',
      title: 'Make my bed every morning',
      detail: 'Add a photo by 8:00 PM to keep your 1-day streak.',
      primaryLabel: 'Add proof photo',
      secondaryLabel: 'View promise',
      mascot: 'today-at-risk',
      countdown: {
        localDay: '2099-08-19',
        timeZone: 'Pacific/Auckland',
        preferredReminderTime: '20:00:00',
        promiseLabel: 'Make my bed every morning',
      },
    };
    const { getByLabelText, getByTestId, queryByLabelText } = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        onSecondaryPress={jest.fn()}
        onRemindLater={jest.fn()}
        presentation={presentation}
      />
    );

    expect(
      getByTestId('today-accountability-mascot-today-at-risk')
    ).toBeTruthy();
    expect(getByLabelText('Add proof photo')).toBeTruthy();
    expect(getByLabelText('View promise')).toBeTruthy();
    expect(queryByLabelText('Remind me in 4 hours')).toBeNull();
  });

  it('renders the Paper-derived empty Today as one calm orientation state', () => {
    const onPrimaryPress = jest.fn();
    const onSecondaryPress = jest.fn();
    const presentation = {
      ...createPresentation('no-promises'),
      title: 'No active promises',
      detail:
        'Make one promise and Menta will show you what needs attention each day.',
      primaryLabel: 'Make a promise',
      secondaryLabel: 'Join a group',
      mascot: 'promise-guide' as const,
    };
    const { getByLabelText, getByTestId, getByText } = render(
      <TodayStateCard
        onPrimaryPress={onPrimaryPress}
        onSecondaryPress={onSecondaryPress}
        presentation={presentation}
      />
    );

    expect(getByTestId('today-empty-state')).toBeTruthy();
    expect(getByTestId('today-empty-visual')).toHaveStyle({
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 224,
      width: '100%',
    });
    expect(getByTestId('mascot-promise-guide')).toBeTruthy();
    expect(
      getByText(
        'Make one promise and Menta will show you what needs attention each day.'
      )
    ).toBeTruthy();

    fireEvent.press(getByLabelText('Make a promise'));
    fireEvent.press(getByLabelText('Join a group'));

    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
    expect(onSecondaryPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    { width: 320, height: 667, visualHeight: 152 },
    { width: 390, height: 844, visualHeight: 184 },
    { width: 430, height: 932, visualHeight: 224 },
  ])(
    'gives the mascot a purposeful visual slot at $width points',
    ({ width, height, visualHeight }) => {
      mockedUsePhoneLayout.mockReturnValue(
        resolvePhoneLayout({ width, height, fontScale: 1 })
      );

      const screen = render(
        <TodayStateCard
          onPrimaryPress={jest.fn()}
          onSecondaryPress={jest.fn()}
          presentation={createPresentation('no-promises')}
        />
      );

      expect(screen.getByTestId('today-empty-visual')).toHaveStyle({
        minHeight: visualHeight,
      });
      expect(screen.getByLabelText('Primary no-promises')).toBeTruthy();
      expect(screen.getByLabelText('Secondary no-promises')).toBeTruthy();
    }
  );

  it('lets the person pause coach reminders from an at-risk day', async () => {
    const onRemindLater = jest.fn().mockResolvedValue(undefined);
    const presentation = createPresentation('streak-broken');
    const { getByLabelText, findByTestId } = render(
      <TodayStateCard
        onPrimaryPress={jest.fn()}
        onRemindLater={onRemindLater}
        presentation={presentation}
      />
    );

    fireEvent.press(getByLabelText('Remind me in 4 hours'));
    expect(onRemindLater).toHaveBeenCalledTimes(1);
    expect(await findByTestId('coach-snooze-receipt')).toBeTruthy();
  });
});
