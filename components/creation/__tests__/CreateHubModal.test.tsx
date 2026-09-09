import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/constants/ThemeContext';
import CreateHubModal from '@/components/creation/CreateHubModal';

jest.mock('@/components/ui/modal/ModalCard', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: ({ visible, children, accessibilityLabel }: any) =>
      visible ? (
        <View accessibilityLabel={accessibilityLabel}>{children}</View>
      ) : null,
  };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  onCreateGroup: jest.fn(),
  onCreateGroupChallenge: jest.fn(),
  onCreateSoloChallenge: jest.fn(),
  onInviteToPromise: jest.fn(),
  onJoinExistingGroup: jest.fn(),
  onBrowseEvents: jest.fn(),
};

describe('CreateHubModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows every create route as one direct grouped list', () => {
    render(<CreateHubModal {...baseProps} />, { wrapper: Wrapper });

    expect(screen.getByText('Create a promise or join others.')).toBeTruthy();
    expect(screen.getByText('Make a solo promise')).toBeTruthy();
    expect(screen.getByText('Create a group')).toBeTruthy();
    expect(screen.getByText('Join with invite')).toBeTruthy();
    expect(screen.getByText('Browse events')).toBeTruthy();
    expect(screen.queryByText('CREATE HUB')).toBeNull();
    expect(screen.queryByText('RECOMMENDED START')).toBeNull();

    fireEvent.press(screen.getByText('Browse events'));
    expect(baseProps.onBrowseEvents).toHaveBeenCalledTimes(1);
  });

  it('promotes solo creation when opened with the solo intent', () => {
    render(
      <CreateHubModal {...baseProps} preferredIntent="create_solo_challenge" />,
      { wrapper: Wrapper }
    );

    fireEvent.press(screen.getByText('Make a solo promise'));

    expect(baseProps.onCreateSoloChallenge).toHaveBeenCalledTimes(1);
  });

  it('puts promise accountability in the create hub after a promise exists', () => {
    render(<CreateHubModal {...baseProps} hasPromise />, { wrapper: Wrapper });

    expect(screen.getByText('Invite someone into a promise')).toBeTruthy();
    expect(
      screen.getByText('Choose who joins, reviews proof, or supports you.')
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Invite someone into a promise'));
    expect(baseProps.onInviteToPromise).toHaveBeenCalledTimes(1);
  });

  it('reflects a saved invite in the join option', () => {
    render(
      <CreateHubModal
        {...baseProps}
        preferredIntent="create_group"
        pendingInvite={{
          type: 'group',
          code: 'ABC123',
          timestamp: Date.now(),
        }}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Open saved invite')).toBeTruthy();
    expect(
      screen.getByText('Code ABC123 is saved on this phone.')
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Open saved invite'));

    expect(baseProps.onJoinExistingGroup).toHaveBeenCalledTimes(1);
  });

  it('adds the group-promise route when an active group exists', () => {
    render(<CreateHubModal {...baseProps} hasActiveGroup />, {
      wrapper: Wrapper,
    });

    expect(screen.getByTestId('create-hub-scroll')).toBeTruthy();
    expect(screen.getByText('Add a promise to your group')).toBeTruthy();

    fireEvent.press(screen.getByText('Add a promise to your group'));
    expect(baseProps.onCreateGroupChallenge).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Create a group')).toBeTruthy();
    expect(screen.getByText('Join with invite')).toBeTruthy();
  });

  it('keeps a forced group surface and its primary action consistent', () => {
    const defaultSoloPress = jest.fn();
    render(
      <CreateHubModal
        {...baseProps}
        preferredIntent="create_group"
        recommendedAction={{
          choiceId: 'solo',
          title: 'Create solo promise',
          description: 'Default account recommendation',
          ctaLabel: 'Create solo promise',
          onPress: defaultSoloPress,
        }}
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(screen.getByText('Create a group'));

    expect(baseProps.onCreateGroup).toHaveBeenCalledTimes(1);
    expect(defaultSoloPress).not.toHaveBeenCalled();
  });

  it('does not duplicate the recommended create action', () => {
    const recommendedPress = jest.fn();
    render(
      <CreateHubModal
        {...baseProps}
        recommendedAction={{
          choiceId: 'solo',
          title: 'Create solo promise',
          description: 'One promise. One proof window. No group pressure yet.',
          ctaLabel: 'Create solo promise',
          onPress: recommendedPress,
        }}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getAllByText('Make a solo promise')).toHaveLength(1);

    fireEvent.press(screen.getByText('Make a solo promise'));

    expect(recommendedPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('RECOMMENDED START')).toBeNull();
  });

  it('uses the equipped theme for create-choice interaction feedback', () => {
    const EmberWrapper: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) => (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <ThemeProvider equippedThemeSku="profile_theme_ember">
          {children}
        </ThemeProvider>
      </SafeAreaProvider>
    );

    render(<CreateHubModal {...baseProps} hasActiveGroup />, {
      wrapper: EmberWrapper,
    });

    expect(
      screen.getByTestId('create-hub-choice-icon-group-challenge')
    ).toHaveStyle({ color: '#E7A86D' });
  });
});
