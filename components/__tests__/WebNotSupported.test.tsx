import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WebNotSupported } from '../WebNotSupported';

describe('WebNotSupported', () => {
  it('preserves the user state boundary instead of offering a placeholder store link', () => {
    const screen = render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <WebNotSupported />
      </SafeAreaProvider>
    );

    expect(screen.getByText('iPhone app required')).toBeTruthy();
    expect(screen.getByText('Nothing changed')).toBeTruthy();
    expect(
      screen.getByText('Your invite or draft is still waiting.')
    ).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
