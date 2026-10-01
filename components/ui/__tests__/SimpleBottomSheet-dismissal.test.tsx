import React from 'react';
import {
  act,
  cleanupAsync,
  render,
  screen,
} from '@testing-library/react-native/pure';
import { Modal, Platform, Text } from 'react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { SimpleBottomSheet } from '../SimpleBottomSheet';

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
}));

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    reduceMotion: true,
    duration: (value: number) => value,
    distance: (value: number) => value,
  }),
}));
const originalOS = Platform.OS;
beforeEach(() => jest.useFakeTimers());
afterEach(async () => {
  Platform.OS = originalOS;
  jest.useRealTimers();
  await cleanupAsync();
});
const sheet = (visible: boolean, onDismiss: () => void) => (
  <ThemeProvider>
    <SimpleBottomSheet
      visible={visible}
      onClose={() => {}}
      onDismiss={onDismiss}
    >
      <Text>Confirmation</Text>
    </SimpleBottomSheet>
  </ThemeProvider>
);
it('waits for native iOS dismissal instead of interpreting visible=false as completion', () => {
  Platform.OS = 'ios';
  const dismissed = jest.fn();
  const view = render(sheet(true, dismissed));
  const nativeDismiss = screen.UNSAFE_getByType(Modal).props.onDismiss;
  view.rerender(sheet(false, dismissed));
  act(() => jest.advanceTimersByTime(50));
  expect(dismissed).not.toHaveBeenCalled();
  act(() => nativeDismiss());
  expect(dismissed).toHaveBeenCalledTimes(1);
});
it('waits for the committed Android hide before firing its dismissal callback', () => {
  Platform.OS = 'android';
  const dismissed = jest.fn();
  const view = render(sheet(true, dismissed));
  expect(dismissed).not.toHaveBeenCalled();
  view.rerender(sheet(false, dismissed));
  expect(dismissed).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(50));
  expect(dismissed).toHaveBeenCalledTimes(1);
});
it('cancels Android handoff when the sheet unmounts before its close frame', () => {
  Platform.OS = 'android';
  const dismissed = jest.fn();
  const view = render(sheet(true, dismissed));
  view.rerender(sheet(false, dismissed));
  view.unmount();
  act(() => jest.advanceTimersByTime(50));
  expect(dismissed).not.toHaveBeenCalled();
});

it('keeps the closing Android handoff despite parent rerenders before its frame', () => {
  Platform.OS = 'android';
  const oldDismiss = jest.fn();
  const newDismiss = jest.fn();
  const view = render(sheet(true, oldDismiss));
  view.rerender(sheet(false, oldDismiss));
  view.rerender(sheet(false, newDismiss));
  act(() => jest.advanceTimersByTime(50));
  expect(oldDismiss).toHaveBeenCalledTimes(1);
  expect(newDismiss).not.toHaveBeenCalled();
});
