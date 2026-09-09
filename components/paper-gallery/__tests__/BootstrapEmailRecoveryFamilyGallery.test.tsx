import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BootstrapEmailRecoveryFamilyGallery } from '@/components/paper-gallery/BootstrapEmailRecoveryFamilyGallery';
import { ThemeProvider } from '@/constants/ThemeContext';
import { BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES } from '@/lib/paper-state-registry/bootstrap-email-recovery';

jest.mock('@/components/ui/SimpleBottomSheet', () => ({
  SimpleBottomSheet: ({
    children,
    visible,
  }: {
    children: React.ReactNode;
    visible: boolean;
  }) => (visible ? <>{children}</> : null),
}));

const renderGallery = (
  stateId: React.ComponentProps<
    typeof BootstrapEmailRecoveryFamilyGallery
  >['stateId']
) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider>
        <BootstrapEmailRecoveryFamilyGallery stateId={stateId} />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('Bootstrap/email recovery family gallery boundary', () => {
  it('renders every mapped development state', () => {
    expect(BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES).toHaveLength(16);

    for (const state of BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES) {
      const view = renderGallery(state.id);

      expect(
        view.getByTestId(`bootstrap-email-family-${state.id}`)
      ).toBeTruthy();
      view.unmount();
    }
  });

  it('keeps unavailable deep-link completion actions disabled', () => {
    const newPassword = renderGallery('AUTH-06A');

    expect(
      screen.getByText(
        'A verified recovery session is required before this request can be sent.'
      )
    ).toBeTruthy();
    expect(
      screen.getByTestId('bootstrap-email-action-Update password')
    ).toBeDisabled();
    newPassword.unmount();

    renderGallery('AUTH-06C');

    expect(
      screen.getByText(
        'A verified server receipt is required before this completion can continue.'
      )
    ).toBeTruthy();
    expect(
      screen.getByTestId('bootstrap-email-action-Continue')
    ).toBeDisabled();
  });
});
