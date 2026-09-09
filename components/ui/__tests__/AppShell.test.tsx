import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { AppListRow, AppTopBar } from '@/components/ui/AppShell';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';

describe('AppTopBar', () => {
  it('exposes the title as a heading and keeps back at 44pt', () => {
    const onBack = jest.fn();
    const { getByRole, getByText } = render(
      <ThemeProvider>
        <AppTopBar title="Settings" onBack={onBack} />
      </ThemeProvider>
    );

    expect(getByText('Settings').props.accessibilityRole).toBe('header');
    const back = getByRole('button', { name: 'Back' });
    expect(StyleSheet.flatten(back.props.style)).toEqual(
      expect.objectContaining({
        width: mentaLayout.minimumTouchTarget,
        height: mentaLayout.minimumTouchTarget,
      })
    );

    fireEvent.press(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('lets an editorial heading own the rotor when asked', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AppTopBar title="Menta" titleIsHeading={false} />
      </ThemeProvider>
    );

    expect(getByText('Menta').props.accessibilityRole).toBeUndefined();
  });
});

describe('AppListRow', () => {
  it('names the row from visible copy and reports selected state', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <ThemeProvider>
        <AppListRow
          meta="Group"
          title="Morning walk"
          subtitle="Photo proof each day"
          value="5 waiting"
          selected
          onPress={onPress}
        />
      </ThemeProvider>
    );

    const row = getByRole('button', {
      name: 'Group. Morning walk. Photo proof each day. 5 waiting',
    });
    expect(row.props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
