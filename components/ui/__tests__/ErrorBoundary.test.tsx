import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

const mockCaptureError = jest.fn();

jest.mock('@/lib/sentry', () => ({
  captureError: (...args: unknown[]) => mockCaptureError(...args),
}));

const mockRouter = jest.requireMock('expo-router').router as {
  replace: jest.Mock;
  push: jest.Mock;
};

const BrokenChild = () => {
  throw new Error('Render broke');
};

const renderBoundary = (level: 'screen' | 'component' | 'critical') =>
  render(
    <ThemeProvider>
      <ErrorBoundary level={level}>
        <BrokenChild />
      </ErrorBoundary>
    </ThemeProvider>
  );

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRouter.replace.mockClear();
    mockRouter.push.mockClear();
    mockCaptureError.mockClear();
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('keeps screen crashes inside the Menta recovery surface', () => {
    renderBoundary('screen');

    expect(screen.getByText('This screen stopped loading.')).toBeTruthy();
    expect(screen.queryByText('Screen recovery')).toBeNull();

    fireEvent.press(screen.getByText('Back to Today'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');

    fireEvent.press(screen.getByText('Report issue'));
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/report-issue',
        params: expect.objectContaining({
          source: 'component_error_boundary',
          description: 'Render broke',
        }),
      })
    );
  });

  it('renders component crashes as compact retry/report recovery', () => {
    renderBoundary('component');

    expect(screen.getByText('This section could not load.')).toBeTruthy();
    expect(screen.queryByText('Section recovery')).toBeNull();
    expect(mockCaptureError).toHaveBeenCalledTimes(1);
    expect(mockCaptureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Render broke' }),
      expect.objectContaining({ errorBoundaryLevel: 'component' })
    );
    fireEvent.press(screen.getByText('Report issue'));
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/report-issue',
      })
    );
  });
});
