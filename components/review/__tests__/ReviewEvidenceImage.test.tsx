import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { EvidenceUnavailablePanel } from '../ReviewEvidenceImage';
import { ThemeProvider } from '@/constants/ThemeContext';

describe('EvidenceUnavailablePanel', () => {
  it('explains that no review decision was saved and keeps recovery explicit', () => {
    const onRetry = jest.fn();
    const onBack = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <EvidenceUnavailablePanel onRetry={onRetry} onBack={onBack} />
      </ThemeProvider>
    );

    expect(getByText('We couldn’t open this proof')).toBeTruthy();
    expect(
      getByText('Try opening it again. No review decision has been saved.')
    ).toBeTruthy();

    fireEvent.press(getByText('Try again'));
    fireEvent.press(getByText('Back to reviews'));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
