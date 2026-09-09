import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { AppUpdateGateSurface } from '@/components/update/AppUpdateGateSurface';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockUseWideWorkspace = jest.fn(() => false);

jest.mock('@/constants/responsive-layout', () => ({
  shouldUseIPadTwoColumnLayout: (...args: unknown[]) =>
    mockUseWideWorkspace(...args),
}));

jest.mock('@/components/ui/modal/ModalCard', () => ({
  __esModule: true,
  default: ({
    children,
    surface,
    testID,
    visible,
  }: {
    children: React.ReactNode;
    surface: string;
    testID: string;
    visible: boolean;
  }) => {
    const { View } = require('react-native') as typeof import('react-native');
    return visible ? (
      <View testID={`${testID}-${surface}`}>{children}</View>
    ) : null;
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native') as typeof import('react-native');
  return { SafeAreaView: View };
});

const renderGate = (
  mode: 'optional' | 'required',
  overrides: Partial<React.ComponentProps<typeof AppUpdateGateSurface>> = {}
) => {
  const onDismiss = jest.fn();
  const onGetHelp = jest.fn();
  const onUpdate = jest.fn();
  const result = render(
    <ThemeProvider>
      <AppUpdateGateSurface
        busy={false}
        currentVersion="1.9.1"
        minimumVersion="1.9.2"
        mode={mode}
        onDismiss={onDismiss}
        onGetHelp={onGetHelp}
        onUpdate={onUpdate}
        visible
        {...overrides}
      />
    </ThemeProvider>
  );
  return { ...result, onDismiss, onGetHelp, onUpdate };
};

describe('AppUpdateGateSurface', () => {
  beforeEach(() => mockUseWideWorkspace.mockReturnValue(false));

  it('uses a dismissible bounded sheet during the optional phase', () => {
    const screen = renderGate('optional');
    expect(screen.getByTestId('app-update-optional-sheet')).toBeTruthy();
    expect(screen.getByText('Menta 1.9.2 is ready')).toBeTruthy();
    fireEvent.press(screen.getByTestId('app-update-not-now'));
    expect(screen.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('uses a non-phone full-screen workspace for required iPad enforcement', () => {
    mockUseWideWorkspace.mockReturnValue(true);
    const screen = renderGate('required');
    expect(screen.getByTestId('app-update-required-full_screen')).toBeTruthy();
    expect(screen.getByTestId('app-update-ipad-workspace')).toBeTruthy();
    expect(screen.queryByTestId('app-update-not-now')).toBeNull();
    fireEvent.press(screen.getByTestId('app-update-get-help'));
    expect(screen.onGetHelp).toHaveBeenCalledTimes(1);
  });
});
