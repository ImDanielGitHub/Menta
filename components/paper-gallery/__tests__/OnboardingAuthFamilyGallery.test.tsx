import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { OnboardingAuthFamilyGallery } from '../OnboardingAuthFamilyGallery';

describe('OnboardingAuthFamilyGallery', () => {
  it('shows the truthful web-unavailable state without a fake download action', () => {
    const screen = render(<OnboardingAuthFamilyGallery stateId="WEB-01" />);

    expect(screen.getByText('Menta needs the mobile app.')).toBeTruthy();
    expect(
      screen.getByText(
        'No action was taken. Your invite or local draft was not consumed.'
      )
    ).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps save-gate actions explicit and local to their callbacks', () => {
    const primary = jest.fn();
    const secondary = jest.fn();
    const screen = render(
      <OnboardingAuthFamilyGallery
        stateId="AUTH-01"
        onPrimaryAction={primary}
        onSecondaryAction={secondary}
      />
    );

    fireEvent.press(screen.getByText('Continue to save'));
    fireEvent.press(screen.getByText('Not now'));

    expect(primary).toHaveBeenCalledTimes(1);
    expect(secondary).toHaveBeenCalledTimes(1);
  });
});
