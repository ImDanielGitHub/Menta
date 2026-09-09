import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { MentaMascot } from '@/components/ui/MentaMascot';
import {
  MASCOT_SHEET_COLUMNS,
  MentaMascotSheet,
} from '@/components/ui/menta-mascot-sheet';

describe('MentaMascot static rendering', () => {
  it('keeps its fixed slot and uses a still image', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <MentaMascot state="celebration" size="lg" testID="static-mascot" />
    );

    expect(
      getByTestId('static-mascot', { includeHiddenElements: true })
    ).toHaveStyle({
      width: 132,
      height: 132,
    });
    expect(UNSAFE_getByType(Image)).toBeTruthy();
  });

  it('uses the state PNG for automatic sheet selection', () => {
    const { getByTestId, queryByTestId } = render(
      <MentaMascot state="promise-guide" testID="still-mascot" />
    );

    expect(
      getByTestId('still-mascot', { includeHiddenElements: true })
    ).toBeTruthy();
    expect(queryByTestId('menta-mascot-sheet-guide')).toBeNull();
  });

  it('renders only the first frame of an explicitly selected sheet', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <MentaMascotSheet row="gift" />
    );

    fireEvent(getByTestId('menta-mascot-sheet-gift'), 'layout', {
      nativeEvent: { layout: { width: 96 } },
    });

    expect(UNSAFE_getByType(Image).props.style).toEqual({
      width: 96 * MASCOT_SHEET_COLUMNS,
      height: 96,
    });
  });
});
