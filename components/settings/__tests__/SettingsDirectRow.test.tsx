import React from 'react';
import * as ReactNative from 'react-native';
import { render } from '@testing-library/react-native';

import { SettingsDirectRow } from '@/components/settings/SettingsDirectRow';

describe('SettingsDirectRow', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('speaks the subtitle as context and the current value separately', () => {
    const { getByRole } = render(
      <SettingsDirectRow
        title="Daily reminder"
        subtitle="Choose when Menta should remind you."
        value="8:00 pm"
        onPress={jest.fn()}
      />
    );

    const row = getByRole('button', {
      name: 'Daily reminder. Choose when Menta should remind you.',
    });

    expect(row.props.accessibilityValue).toEqual({ text: '8:00 pm' });
  });

  it('removes visual line caps at accessibility font sizes', () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1.5,
    });

    const { getByText } = render(
      <SettingsDirectRow
        title="A longer setting title"
        subtitle="A longer explanation that must remain available at large text sizes."
        value="A longer value"
      />
    );

    expect(getByText('A longer setting title').props.numberOfLines).toBe(
      undefined
    );
    expect(
      getByText(
        'A longer explanation that must remain available at large text sizes.'
      ).props.numberOfLines
    ).toBe(undefined);
    expect(getByText('A longer value').props.numberOfLines).toBe(undefined);
  });
});
