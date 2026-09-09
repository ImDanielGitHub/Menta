import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import {
  PROMISE_FAMILY_PAPER_STATES,
  PromiseFamilyGalleryState,
} from '@/components/paper-gallery/PromiseFamilyGallery';
import {
  CreateTabBridgeState,
  GroupModeNoGroupState,
  NotificationEducationState,
  ReferralBridgeState,
} from '@/components/challenge/promise-runtime-states';

jest.mock('@expo/ui/swift-ui', () => {
  const React = require('react');
  const { Pressable, TextInput, View } = require('react-native');

  const createFieldRef = () => ({
    focus: jest.fn(),
    blur: jest.fn(),
    setText: jest.fn(),
  });

  const useNativeState = (initialValue: string) => {
    const state = React.useRef({
      value: initialValue,
      get: () => state.current.value,
      set: (nextValue: string) => {
        state.current.value = nextValue;
      },
      onChange: null,
    });
    return state.current;
  };

  return {
    Host: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    TextField: React.forwardRef((props: object, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, createFieldRef);
      return <TextInput {...props} />;
    }),
    SecureField: React.forwardRef((props: object, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, createFieldRef);
      return <TextInput {...props} secureTextEntry />;
    }),
    Toggle: ({
      isOn,
      onIsOnChange,
    }: {
      isOn: boolean;
      onIsOnChange: (next: boolean) => void;
    }) => (
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: isOn }}
        onPress={() => onIsOnChange(!isOn)}
      >
        <View />
      </Pressable>
    ),
    DatePicker: () => <View />,
    useNativeState,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

const renderFamily = (node: React.ReactElement) =>
  render(<ThemeProvider>{node}</ThemeProvider>);

describe('Promise family gallery', () => {
  afterEach(cleanup);

  it('registers the complete 23-state Paper source pack', () => {
    expect(PROMISE_FAMILY_PAPER_STATES).toEqual([
      { id: 'CHL-00', paperRoot: 'C83-0', title: 'Solo Challenges Loading' },
      { id: 'CHL-01', paperRoot: 'C84-0', title: 'Solo Challenges Empty' },
      { id: 'CHL-02', paperRoot: 'FBF-0', title: 'Solo Challenge Active' },
      { id: 'CHL-03', paperRoot: 'FBG-0', title: 'Solo Challenge History' },
      {
        id: 'CHL-04',
        paperRoot: 'FBH-0',
        title: 'Solo Challenge Submissions',
      },
      { id: 'CRT-00', paperRoot: 'C7Z-0', title: 'Create Tab Bridge' },
      {
        id: 'CRT-03',
        paperRoot: 'C82-0',
        title: 'Group Mode No Group Selected',
      },
      { id: 'DTL-00', paperRoot: '2HD-0', title: 'Promise Skeleton' },
      { id: 'DTL-02', paperRoot: '2HF-0', title: 'Waiting For Review' },
      { id: 'DTL-05', paperRoot: '2HI-0', title: 'Proof History' },
      {
        id: 'DTL-06',
        paperRoot: '2HJ-0',
        title: 'Rules Schedule and People',
      },
      { id: 'DTL-07', paperRoot: '2HK-0', title: 'Promise Complete' },
      { id: 'DTL-08', paperRoot: '2HL-0', title: 'Promise Unavailable' },
      { id: 'GRP-08', paperRoot: 'FBI-0', title: 'Group Template Picker' },
      { id: 'GRP-09', paperRoot: 'FBJ-0', title: 'First Group Created' },
      { id: 'GRP-10', paperRoot: 'FBK-0', title: 'Group Promise Ready' },
      { id: 'JOIN-00', paperRoot: 'FL1-0', title: 'Join Funding' },
      { id: 'JOIN-01', paperRoot: 'FL2-0', title: 'Insufficient Momenta' },
      { id: 'JOIN-02', paperRoot: 'GTW-0', title: 'Join Confirmed' },
      { id: 'JOIN-03', paperRoot: 'GTX-0', title: 'Join Result Unknown' },
      {
        id: 'NTF-00',
        paperRoot: 'FL0-0',
        title: 'Notification Education',
      },
      { id: 'REF-00', paperRoot: 'FL3-0', title: 'Referral Bridge' },
      { id: 'QR-00', paperRoot: 'FL4-0', title: 'Group Invite QR Sheet' },
    ]);
  });

  it.each(PROMISE_FAMILY_PAPER_STATES)(
    'renders the deterministic $id gallery state',
    ({ id }) => {
      renderFamily(<PromiseFamilyGalleryState stateId={id} />);
      const testID = id.startsWith('JOIN-')
        ? `join-funding-${id}`
        : `promise-family-${id}`;
      expect(screen.getByTestId(testID)).toBeTruthy();
    }
  );

  it('uses direct creation copy and a semantic runtime hook', () => {
    const onCreatePromise = jest.fn();

    renderFamily(
      <CreateTabBridgeState
        onCreatePromise={onCreatePromise}
        onJoinSoloChallenge={jest.fn()}
        onStartWithGroup={jest.fn()}
        onLearn={jest.fn()}
      />
    );

    expect(screen.getByTestId('create-tab-bridge')).toBeTruthy();
    expect(screen.getByText('What do you want to create?')).toBeTruthy();
    expect(screen.getByTestId('create-bridge-promise')).toBeTruthy();
    fireEvent.press(screen.getByTestId('create-bridge-promise'));
    expect(onCreatePromise).toHaveBeenCalledTimes(1);
  });

  it('offers only actions that work when no group has been chosen', () => {
    const onSelectGroup = jest.fn();
    const onCreateGroup = jest.fn();
    const onContinueWithoutGroup = jest.fn();

    renderFamily(
      <GroupModeNoGroupState
        onSelectGroup={onSelectGroup}
        onCreateGroup={onCreateGroup}
        onContinueWithoutGroup={onContinueWithoutGroup}
      />
    );

    expect(screen.getByTestId('group-mode-no-group')).toBeTruthy();
    expect(screen.queryByText('Continue with group')).toBeNull();

    fireEvent.press(screen.getByText('Keep this personal'));
    expect(onContinueWithoutGroup).toHaveBeenCalledTimes(1);
  });

  it('keeps notification permission as a separate, explicit next step', () => {
    const onChangeEnabled = jest.fn();
    const onContinueToPermission = jest.fn();
    const { rerender } = renderFamily(
      <NotificationEducationState
        enabled
        onChangeEnabled={onChangeEnabled}
        onContinueToPermission={onContinueToPermission}
        onNotNow={jest.fn()}
      />
    );

    fireEvent.press(screen.getByRole('switch'));
    expect(onChangeEnabled).toHaveBeenCalledWith(false);

    rerender(
      <ThemeProvider>
        <NotificationEducationState
          enabled={false}
          onChangeEnabled={onChangeEnabled}
          onContinueToPermission={onContinueToPermission}
          onNotNow={jest.fn()}
        />
      </ThemeProvider>
    );
    fireEvent.press(screen.getByText('Set up reminders'));
    expect(onContinueToPermission).not.toHaveBeenCalled();
  });

  it('reports referral outcomes without claiming an invite was sent', () => {
    const onShareInvite = jest.fn();
    const onCopyInviteLink = jest.fn();

    const { rerender } = renderFamily(
      <ReferralBridgeState
        promiseTitle="Walk after work"
        groupSummary="After-work walkers · invite only"
        onShareInvite={onShareInvite}
        onCopyInviteLink={onCopyInviteLink}
        onSkip={jest.fn()}
        shareOutcome="sheet-closed"
      />
    );

    expect(screen.getByText('Invite not confirmed')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta cannot confirm that the invite was sent. The invite is still available here if you want to copy it or return later.'
      )
    ).toBeTruthy();
    fireEvent.press(screen.getByText('Share invite'));
    expect(onShareInvite).toHaveBeenCalledTimes(1);

    rerender(
      <ThemeProvider>
        <ReferralBridgeState
          promiseTitle="Walk after work"
          groupSummary="After-work walkers · invite only"
          onShareInvite={onShareInvite}
          onCopyInviteLink={onCopyInviteLink}
          onSkip={jest.fn()}
          shareOutcome="copied"
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Invite link copied')).toBeTruthy();
    fireEvent.press(screen.getByText('Copy invite link'));
    expect(onCopyInviteLink).toHaveBeenCalledTimes(1);
  });
});
