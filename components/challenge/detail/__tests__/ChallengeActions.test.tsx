import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ChallengeActions } from '../ChallengeActions';
import { ThemeProvider } from '@/constants/ThemeContext';

describe('ChallengeActions', () => {
  it('shows a flat success receipt without the outlined alert treatment', () => {
    render(
      <ThemeProvider>
        <ChallengeActions
          actionMessage={{
            type: 'success',
            text: '12 hours were added to the selected promise.',
          }}
          refreshErrorBanner={null}
        />
      </ThemeProvider>
    );

    const receipt = screen.getByTestId('challenge-action-notice');
    expect(receipt).not.toHaveStyle({ borderWidth: 1 });
    expect(
      screen.getByText('12 hours were added to the selected promise.')
    ).toBeTruthy();
  });
});
