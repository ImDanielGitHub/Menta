import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { GroupMetricStrip } from '@/components/group/GroupAdminPrimitives';

let mockCompactWidth = false;
let mockFontScale = 1;

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => ({
    fontScale: mockFontScale,
    isCompactWidth: mockCompactWidth,
  }),
}));

describe('GroupMetricStrip', () => {
  beforeEach(() => {
    mockCompactWidth = false;
    mockFontScale = 1;
  });

  it('keeps the group summary on the canvas instead of presenting another card', () => {
    const { getByTestId, getByText } = render(
      <GroupMetricStrip
        metrics={[
          { label: 'People', value: '4' },
          { label: 'Your role', value: 'Owner' },
          { label: 'Access', value: 'Manage' },
        ]}
        testID="group-summary"
      />
    );

    const style = StyleSheet.flatten(getByTestId('group-summary').props.style);
    expect(style.backgroundColor).toBeUndefined();
    expect(style.borderRadius).toBeUndefined();
    expect(style.borderTopWidth).toBe(StyleSheet.hairlineWidth);
    expect(style.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
    expect(getByText('Owner')).toBeTruthy();
    expect(getByText('Manage')).toBeTruthy();
  });

  it('turns equal-width metrics into readable rows on a compact phone', () => {
    mockCompactWidth = true;

    const { getByTestId } = render(
      <GroupMetricStrip
        metrics={[
          { label: 'People', value: '4' },
          { label: 'Your role', value: 'Owner' },
          { label: 'Access', value: 'Manage' },
        ]}
        testID="group-summary"
      />
    );

    expect(
      StyleSheet.flatten(getByTestId('group-summary').props.style).flexDirection
    ).toBe('column');
  });
});
