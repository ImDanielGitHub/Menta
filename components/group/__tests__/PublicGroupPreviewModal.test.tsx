import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PublicGroupPreviewModal, {
  type PublicGroupPreview,
} from '@/components/group/PublicGroupPreviewModal';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getThemeAppearance } from '@/lib/shop/catalogSupport';

const publicGroup: PublicGroupPreview = {
  id: 'group-1',
  name: 'Morning crew',
  description: 'Walk before work with a visible proof loop.',
  privacy: 'public',
  member_count: 7,
  current_streak: 3,
  active_challenges_count: 2,
};

const renderModal = (
  props?: Partial<React.ComponentProps<typeof PublicGroupPreviewModal>>,
  equippedThemeSku?: string
) => {
  const handlers = {
    onClose: jest.fn(),
    onJoin: jest.fn(),
    onOpenDetails: jest.fn(),
  };

  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider equippedThemeSku={equippedThemeSku}>
        <PublicGroupPreviewModal
          visible
          group={publicGroup}
          {...handlers}
          {...props}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return handlers;
};

describe('PublicGroupPreviewModal', () => {
  it('frames the join decision and routes explicit actions', () => {
    const { onJoin, onOpenDetails, onClose } = renderModal();

    expect(screen.getByText('Morning crew')).toBeTruthy();
    expect(screen.getByText('Public group')).toBeTruthy();
    expect(
      screen.getByText('Walk before work with a visible proof loop.')
    ).toBeTruthy();
    expect(screen.getByText('Active promises')).toBeTruthy();
    expect(screen.queryByText('Current streak')).toBeNull();
    expect(screen.queryByLabelText('Morning crew group preview')).toBeNull();
    expect(screen.getByText('Morning crew')).toHaveProp(
      'accessibilityRole',
      'header'
    );
    expect(screen.getByTestId('public-group-preview-close')).toHaveProp(
      'accessibilityRole',
      'button'
    );
    expect(screen.getByTestId('public-group-preview-join')).toHaveProp(
      'accessibilityRole',
      'button'
    );
    expect(screen.getByTestId('public-group-preview-view-board')).toHaveProp(
      'accessibilityRole',
      'button'
    );

    fireEvent.press(screen.getByTestId('public-group-preview-view-board'));
    fireEvent.press(screen.getByTestId('public-group-preview-join'));
    fireEvent.press(screen.getByTestId('public-group-preview-close'));

    expect(onOpenDetails).toHaveBeenCalledWith('group-1');
    expect(onJoin).toHaveBeenCalledWith('group-1');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the Ember semantic card surface', () => {
    const ember = getThemeAppearance('profile_theme_ember');
    expect(ember).not.toBeNull();

    renderModal(undefined, 'profile_theme_ember');

    expect(
      screen.getByTestId('public-group-preview-modal-surface')
    ).toHaveStyle({
      backgroundColor: ember?.surfacePrimary,
    });
  });

  it('locks dismissal and duplicate actions while joining', () => {
    const { onJoin, onOpenDetails, onClose } = renderModal({
      joining: true,
    });

    expect(screen.getByText('Joining...')).toBeTruthy();
    expect(
      screen.getByTestId('public-group-preview-join').props.accessibilityState
    ).toMatchObject({
      busy: true,
      disabled: true,
    });
    expect(
      screen.getByTestId('public-group-preview-close').props.accessibilityState
    ).toMatchObject({
      disabled: true,
    });

    expect(
      screen.getByTestId('public-group-preview-view-board').props
        .accessibilityState
    ).toMatchObject({
      disabled: true,
    });

    expect(onOpenDetails).not.toHaveBeenCalled();
    expect(onJoin).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps recovery notice and fallback context visible', () => {
    renderModal({
      group: {
        ...publicGroup,
        description: null,
        active_challenges_count: null,
        challenge_count: null,
      },
      notice: {
        title: 'Join failed',
        message: 'Please try again.',
        tone: 'error',
      },
    });

    expect(screen.getByText('No description has been added.')).toBeTruthy();
    expect(screen.getByText('Join failed')).toBeTruthy();
    expect(screen.getByText('Please try again.')).toBeTruthy();
    expect(screen.getByText('Available after joining')).toBeTruthy();
  });
});
