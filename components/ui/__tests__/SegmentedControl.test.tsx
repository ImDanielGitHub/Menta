import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';

describe('SegmentedControl', () => {
  it('keeps each segment a named 44pt control with selected state', () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <ThemeProvider>
        <SegmentedControl
          segments={[
            { value: 'overview', label: 'Overview' },
            { value: 'people', label: 'People' },
          ]}
          value="overview"
          onChange={onChange}
        />
      </ThemeProvider>
    );

    const overview = getByRole('button', { name: 'Overview' });
    const people = getByRole('button', { name: 'People' });

    expect(overview.props.accessibilityState).toMatchObject({ selected: true });
    expect(people.props.accessibilityState).toMatchObject({ selected: false });
    expect(StyleSheet.flatten(overview.props.style).minHeight).toBe(
      mentaLayout.minimumTouchTarget
    );

    fireEvent.press(people);
    expect(onChange).toHaveBeenCalledWith('people');
  });
});
