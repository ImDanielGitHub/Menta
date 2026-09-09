import React from 'react';
import { Modal, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import ModalCard from '@/components/ui/modal/ModalCard';
import { ThemeProvider } from '@/constants/ThemeContext';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { shouldUseBoundedIPadSheet } from '@/constants/responsive-layout';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: jest.fn(() => ({ reduceMotion: false })),
}));

jest.mock('@/constants/responsive-layout', () => ({
  ...jest.requireActual('@/constants/responsive-layout'),
  shouldUseBoundedIPadSheet: jest.fn(() => false),
}));

const renderModalCard = (props = {}) => {
  const onClose = jest.fn();
  const result = render(
    <ThemeProvider>
      <ModalCard visible onClose={onClose} {...props}>
        <Text>Modal body</Text>
      </ModalCard>
    </ThemeProvider>
  );

  return { ...result, onClose };
};

describe('ModalCard', () => {
  beforeEach(() => {
    jest.mocked(useMotionPreferences).mockReturnValue({
      reduceMotion: false,
    } as ReturnType<typeof useMotionPreferences>);
    jest.mocked(shouldUseBoundedIPadSheet).mockReturnValue(false);
  });

  it('keeps native request-close locked when backdrop dismissal is disabled', () => {
    const { UNSAFE_getByType, onClose } = renderModalCard({
      dismissOnBackdrop: false,
    });

    UNSAFE_getByType(Modal).props.onRequestClose();

    expect(onClose).not.toHaveBeenCalled();
  });

  it('allows native request-close when backdrop dismissal is enabled', () => {
    const { UNSAFE_getByType, onClose } = renderModalCard({
      dismissOnBackdrop: true,
    });

    UNSAFE_getByType(Modal).props.onRequestClose();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps modal containers out of the descendant accessibility tree', () => {
    const { getByTestId, UNSAFE_getByType } = renderModalCard({
      accessibilityLabel: 'Example modal',
    });

    expect(UNSAFE_getByType(Modal).props.accessibilityLabel).toBe(
      'Example modal'
    );
    expect(UNSAFE_getByType(Modal).props.accessibilityViewIsModal).toBe(true);
    const backdrop = getByTestId('modal-card-backdrop');
    const surface = getByTestId('modal-card-surface');
    expect(backdrop.props.accessible).toBe(false);
    expect(backdrop.props.importantForAccessibility).toBe('no');
    expect(surface.props.accessible).toBe(false);
    expect(surface.props.accessibilityViewIsModal).toBe(true);
    expect(surface.props.importantForAccessibility).toBe('no');
  });

  it('disables modal animation when Reduce Motion is on', () => {
    jest.mocked(useMotionPreferences).mockReturnValue({
      reduceMotion: true,
    } as ReturnType<typeof useMotionPreferences>);

    const { UNSAFE_getByType } = renderModalCard();

    expect(UNSAFE_getByType(Modal).props.animationType).toBe('none');
  });

  it('bounds a regular-width iPad sheet without changing modal semantics', () => {
    jest.mocked(shouldUseBoundedIPadSheet).mockReturnValue(true);

    const { getByTestId } = renderModalCard({
      surface: 'sheet',
      presentationRole: 'bounded',
    });

    expect(getByTestId('modal-card-backdrop')).toHaveStyle({
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 24,
    });
    expect(getByTestId('modal-card-surface')).toHaveStyle({
      alignSelf: 'center',
      borderRadius: 16,
      borderWidth: 1,
      maxWidth: 600,
      width: '100%',
    });
  });

  it('keeps contextual iPad sheets on the full-width bottom edge by default', () => {
    jest.mocked(shouldUseBoundedIPadSheet).mockReturnValue(true);

    const { getByTestId } = renderModalCard({ surface: 'sheet' });

    expect(getByTestId('modal-card-backdrop')).toHaveStyle({
      alignItems: 'stretch',
      justifyContent: 'flex-end',
      paddingHorizontal: 0,
      paddingVertical: 0,
    });
    expect(getByTestId('modal-card-surface')).toHaveStyle({
      alignSelf: 'stretch',
      borderBottomWidth: 0,
      maxWidth: undefined,
      width: '100%',
    });
  });
});
