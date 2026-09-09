import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import {
  SupportActionRow,
  SupportPrimaryAction,
} from '@/components/support/SupportSurface';

describe('SupportActionRow', () => {
  it('keeps the action and its explanation together in a readable touch row', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(
      <SupportActionRow
        icon={<Text>?</Text>}
        onPress={onPress}
        subtitle="Describe a problem and choose what to include"
        title="Report an issue"
      />
    );

    const row = getByRole('button', {
      name: 'Report an issue. Describe a problem and choose what to include',
    });
    expect(StyleSheet.flatten(row.props.style)).toEqual(
      expect.objectContaining({ minHeight: 72, paddingVertical: 12 })
    );
    expect(
      StyleSheet.flatten(
        getByText('Describe a problem and choose what to include').props.style
      )
    ).toEqual(expect.objectContaining({ fontSize: 15, lineHeight: 21 }));

    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SupportPrimaryAction', () => {
  it('gives the reporting task stronger hierarchy without hiding its privacy boundary', () => {
    const onPress = jest.fn();
    const { getByRole, getByText, getByTestId } = render(
      <SupportPrimaryAction
        detail="Your draft stays on this phone until you send it."
        icon={<Text>?</Text>}
        onPress={onPress}
        subtitle="Describe what happened and review exactly what will be included."
        testID="support-primary-report"
        title="Report an issue"
      />
    );

    const action = getByRole('button', {
      name: 'Report an issue. Describe what happened and review exactly what will be included. Your draft stays on this phone until you send it.',
    });
    const surfaceStyle = StyleSheet.flatten(
      getByTestId('support-primary-report').props.style
    );

    expect(surfaceStyle).toEqual(
      expect.objectContaining({ minHeight: 116, borderWidth: 1 })
    );
    expect(
      StyleSheet.flatten(getByText('Report an issue').props.style)
    ).toEqual(expect.objectContaining({ fontSize: 24, lineHeight: 31 }));

    fireEvent.press(action);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
