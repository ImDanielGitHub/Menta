import React from 'react';
import { InteractionManager } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { StoreReviewRequestHost } from '@/components/home/StoreReviewRequestHost';

const mockRequestReview = jest.fn().mockResolvedValue({
  capability: 'system',
  outcome: 'requested',
  requested: true,
});
const mockVisibilityListeners = new Set<(visible: boolean) => void>();
const mockPaywallState = { visible: false };

jest.mock('@/lib/store-review', () => ({
  requestEligibleSystemStoreReview: (...args: unknown[]) =>
    mockRequestReview(...args),
}));

jest.mock('@/lib/paywall/manager', () => ({
  paywallManager: {
    get isVisible() {
      return mockPaywallState.visible;
    },
    subscribeVisibility: (listener: (visible: boolean) => void) => {
      mockVisibilityListeners.add(listener);
      listener(mockPaywallState.visible);
      return () => mockVisibilityListeners.delete(listener);
    },
  },
}));

jest.mock('expo-router', () => {
  const { useEffect } = require('react') as typeof import('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      useEffect(() => callback(), [callback]);
    },
  };
});

describe('StoreReviewRequestHost', () => {
  const runAfterInteractions = jest.spyOn(
    InteractionManager,
    'runAfterInteractions'
  );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockVisibilityListeners.clear();
    mockPaywallState.visible = false;
    runAfterInteractions.mockImplementation(task => {
      if (typeof task === 'function') task();
      return { cancel: jest.fn(), then: jest.fn() } as ReturnType<
        typeof InteractionManager.runAfterInteractions
      >;
    });
  });

  afterEach(() => jest.useRealTimers());
  afterAll(() => runAfterInteractions.mockRestore());

  const settle = async () => {
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
  };

  it('does nothing until Today is settled', async () => {
    const screen = render(<StoreReviewRequestHost ready={false} />);
    await settle();
    expect(mockRequestReview).not.toHaveBeenCalled();

    screen.rerender(<StoreReviewRequestHost ready />);
    await settle();
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('does not request while the paywall is visible', async () => {
    mockPaywallState.visible = true;
    render(<StoreReviewRequestHost ready />);
    await settle();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });
});
