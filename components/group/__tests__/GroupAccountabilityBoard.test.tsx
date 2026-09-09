import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { GroupAccountabilityBoard } from '../GroupAccountabilityBoard';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getThemeAppearance } from '@/lib/shop/catalogSupport';

jest.mock('@/components/ui/Avatar', () => ({
  Avatar: ({ name }: { name?: string }) => {
    const { Text } = require('react-native') as typeof import('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('@/components/ui/AppButton', () => ({
  AppButton: ({
    title,
    onPress,
    disabled,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
  }) => {
    const { Pressable, Text } =
      require('react-native') as typeof import('react-native');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={onPress}
      >
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/components/proof/ProofConnectionMosaic', () => ({
  ProofConnectionMosaic: ({
    items,
    onOpenProof,
    onToggleEncouragement,
    title,
  }: {
    items: Array<{
      id: string;
      contributorName: string;
      encouragedByCurrentUser?: boolean;
    }>;
    onOpenProof: (item: { id: string }) => void;
    onToggleEncouragement?: (
      item: { id: string; encouragedByCurrentUser?: boolean },
      encouraged: boolean
    ) => void;
    title: string;
  }) => {
    const { Pressable, Text, View } =
      require('react-native') as typeof import('react-native');
    return (
      <View testID="proof-connection-mosaic">
        <Text>{title}</Text>
        {items.map(item => (
          <View key={item.id}>
            <Pressable
              accessibilityLabel={`Open ${item.contributorName}'s proof`}
              onPress={() => onOpenProof(item)}
            >
              <Text>{item.contributorName}</Text>
            </Pressable>
            {onToggleEncouragement ? (
              <Pressable
                accessibilityLabel={`Encourage ${item.contributorName}`}
                onPress={() =>
                  onToggleEncouragement(item, !item.encouragedByCurrentUser)
                }
              >
                <Text>Encourage</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    );
  },
}));

jest.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: ({ accessibilityLabel }: { accessibilityLabel?: string }) => {
    const { View } = require('react-native') as typeof import('react-native');
    return <View accessibilityLabel={accessibilityLabel} />;
  },
}));

jest.mock('@/components/ui/MentaMascot', () => ({
  MentaMascot: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native') as typeof import('react-native');
    return <View testID={testID} />;
  },
}));

jest.mock('@/components/ui/AppShell', () => ({
  AppSectionHeader: ({ title }: { title: string }) => {
    const { Text } = require('react-native') as typeof import('react-native');
    return <Text>{title}</Text>;
  },
  AppListRow: ({
    title,
    subtitle,
    value,
    onPress,
  }: {
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
  }) => {
    const { Pressable, Text, View } =
      require('react-native') as typeof import('react-native');
    const content = (
      <>
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
        {value ? <Text>{value}</Text> : null}
      </>
    );
    return onPress ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
      >
        {content}
      </Pressable>
    ) : (
      <View>{content}</View>
    );
  },
}));

jest.mock('@/components/ui/AppFeedback', () => ({
  AppInlineNotice: ({
    title,
    description,
    actionLabel,
    onAction,
  }: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => {
    const { Pressable, Text, View } =
      require('react-native') as typeof import('react-native');
    return (
      <View>
        <Text>{title}</Text>
        <Text>{description}</Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
          >
            <Text>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  },
}));

jest.mock('@/components/ui/icons', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Text } = require('react-native') as typeof import('react-native');
  const Icon = () => ReactModule.createElement(Text, null, 'icon');
  return {
    AlertTriangleIcon: Icon,
    CheckIcon: Icon,
    LockIcon: Icon,
    RefreshCwIcon: Icon,
    SettingsIcon: Icon,
    Share2Icon: Icon,
    TargetIcon: Icon,
    UsersIcon: Icon,
    ChevronRightIcon: Icon,
  };
});

const snapshot = {
  proofReadState: 'available' as const,
  recentProof: [
    {
      id: 'maya-proof',
      challengeId: 'walk-before-work',
      contributorId: 'maya',
      contributorName: 'Maya',
      mediaType: 'photo' as const,
      mediaUrl: 'proofs/maya-walk.jpg',
      thumbnailUrl: null,
      status: 'approved' as const,
      submittedAt: '2026-09-01T08:00:00.000Z',
      encouragementUserIds: [] as string[],
    },
  ],
  completedCount: 1,
  pendingCount: 1,
  dueCount: 1,
  retryCount: 0,
  remainingCount: 2,
  totalCount: 3,
  approvedRate: 33,
  members: [
    {
      userId: 'maya',
      name: 'Maya',
      avatarUrl: null,
      isCurrentUser: false,
      status: 'done' as const,
      statusLabel: 'Approved',
      detail: 'Photo proof',
      submissionId: 'maya-proof',
    },
    {
      userId: 'ari',
      name: 'Ari',
      avatarUrl: null,
      isCurrentUser: false,
      status: 'pending' as const,
      statusLabel: 'Waiting for review',
      detail: 'Text check-in',
      submissionId: 'ari-proof',
    },
    {
      userId: 'you',
      name: 'Daniel',
      avatarUrl: null,
      isCurrentUser: true,
      status: 'due' as const,
      statusLabel: 'Proof due',
      detail: 'No proof submitted yet',
    },
  ],
};

describe('GroupAccountabilityBoard', () => {
  it('centres the active member board on people, media proof, and one action', () => {
    const onSubmitProof = jest.fn();
    const { getByText, getAllByText, getByLabelText, queryByText } = render(
      <GroupAccountabilityBoard
        state="active-member"
        groupName="Morning Crew"
        snapshot={snapshot}
        promiseTitle="Walk before work"
        currentUserId="you"
        proofType="photo"
        onSubmitProof={onSubmitProof}
      />
    );

    expect(getByText('Walk before work')).toBeTruthy();
    expect(getByText('2 of 3 added proof')).toBeTruthy();
    expect(getByText('Proof together')).toBeTruthy();
    expect(getAllByText('Maya').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Waiting for review')).toBeTruthy();
    expect(getByText('Proof due')).toHaveStyle({
      color: mentaColors.warning,
    });
    expect(getByText('Approved')).toBeTruthy();
    expect(queryByText('Nudges unavailable')).toBeNull();
    expect(queryByText('33%')).toBeNull();
    fireEvent.press(getByLabelText('Add my photo'));
    expect(onSubmitProof).toHaveBeenCalledTimes(1);
  });

  it('opens and encourages the exact authorised proof object', () => {
    const onOpenProof = jest.fn();
    const onToggleEncouragement = jest.fn();
    const { getByLabelText } = render(
      <GroupAccountabilityBoard
        state="active-member"
        groupName="Morning Crew"
        snapshot={snapshot}
        currentUserId="you"
        onOpenProof={onOpenProof}
        onToggleEncouragement={onToggleEncouragement}
      />
    );

    fireEvent.press(getByLabelText("Open Maya's proof"));
    fireEvent.press(getByLabelText('Encourage Maya'));

    expect(onOpenProof).toHaveBeenCalledWith(snapshot.recentProof[0]);
    expect(onToggleEncouragement).toHaveBeenCalledWith(
      snapshot.recentProof[0],
      true
    );
  });

  it('makes inviting the next action while the promise still has one person', () => {
    const onInvite = jest.fn();
    const soloSnapshot = {
      ...snapshot,
      totalCount: 1,
      completedCount: 0,
      pendingCount: 0,
      dueCount: 1,
      remainingCount: 1,
      approvedRate: 0,
      recentProof: [],
      members: [snapshot.members[2]],
    };
    const { getByLabelText } = render(
      <GroupAccountabilityBoard
        state="owner"
        groupName="Morning Crew"
        snapshot={soloSnapshot}
        onInvite={onInvite}
        onSubmitProof={jest.fn()}
      />
    );

    fireEvent.press(getByLabelText('Invite people'));
    expect(onInvite).toHaveBeenCalledTimes(1);
  });

  it('uses the immersive lane without changing minimum interaction sizes', () => {
    const { getByTestId } = render(
      <GroupAccountabilityBoard
        state="active-member"
        contentWidth={560}
        groupName="Morning Crew"
        snapshot={snapshot}
      />
    );

    expect(getByTestId('group-board-member')).toHaveStyle({ maxWidth: 560 });
    expect(getByTestId('group-board-people-progress')).toBeTruthy();
  });

  it('routes an owner review from the owner action hierarchy', () => {
    const onOpenReview = jest.fn();
    const { getByLabelText } = render(
      <GroupAccountabilityBoard
        state="owner"
        groupName="Morning Crew"
        snapshot={snapshot}
        pendingReviewCount={1}
        onOpenReview={onOpenReview}
      />
    );

    fireEvent.press(getByLabelText('Review proof'));
    expect(onOpenReview).toHaveBeenCalledWith();
  });

  it('does not infer review authority from a pending proof row', () => {
    const onOpenReview = jest.fn();
    const onSubmitProof = jest.fn();
    const { getByLabelText, queryByLabelText } = render(
      <GroupAccountabilityBoard
        state="owner"
        groupName="Morning Crew"
        snapshot={snapshot}
        onOpenReview={onOpenReview}
        onSubmitProof={onSubmitProof}
      />
    );

    expect(queryByLabelText('Review proof')).toBeNull();
    fireEvent.press(getByLabelText('Add my photo'));
    expect(onOpenReview).not.toHaveBeenCalled();
    expect(onSubmitProof).toHaveBeenCalledTimes(1);
  });

  it('uses plural review copy without changing the supplied count', () => {
    const onOpenReview = jest.fn();
    const { getByLabelText } = render(
      <GroupAccountabilityBoard
        state="owner"
        groupName="Morning Crew"
        snapshot={snapshot}
        pendingReviewCount={2}
        onOpenReview={onOpenReview}
      />
    );

    fireEvent.press(getByLabelText('Review proofs'));
    expect(onOpenReview).toHaveBeenCalledTimes(1);
  });

  it('respects an authoritative zero instead of falling back to pending rows', () => {
    const onOpenReview = jest.fn();
    const onSubmitProof = jest.fn();
    const { getByLabelText, queryByLabelText } = render(
      <GroupAccountabilityBoard
        state="owner"
        groupName="Morning Crew"
        snapshot={snapshot}
        pendingReviewCount={0}
        onOpenReview={onOpenReview}
        onSubmitProof={onSubmitProof}
      />
    );

    expect(queryByLabelText('Review proof')).toBeNull();
    expect(queryByLabelText('Review proofs')).toBeNull();
    expect(getByLabelText('Add my photo')).toBeTruthy();
  });

  it('renders an accessible Paper loading skeleton', () => {
    const { getByLabelText, getByTestId } = render(
      <GroupAccountabilityBoard state="loading" />
    );
    expect(getByTestId('group-board-loading')).toBeTruthy();
    expect(getByLabelText('Loading group board')).toBeTruthy();
  });

  it('keeps a successful no-promise result distinct from failure', () => {
    const onAddPromise = jest.fn();
    const { getByText, getByLabelText, getByTestId, queryByTestId } = render(
      <GroupAccountabilityBoard
        state="empty"
        groupName="Morning Crew"
        onAddPromise={onAddPromise}
      />
    );

    expect(getByText('No shared promises yet')).toBeTruthy();
    expect(
      getByText(
        'Add the first promise so everyone knows what to do and what proof counts.'
      )
    ).toBeTruthy();
    expect(getByTestId('group-shared-promises-empty-mascot')).toBeTruthy();
    expect(queryByTestId('group-board-empty-mark')).toBeNull();
    fireEvent.press(getByLabelText('Add first promise'));
    expect(onAddPromise).toHaveBeenCalledTimes(1);
  });

  it('hands public-group join to the supplied authoritative action', () => {
    const onJoin = jest.fn();
    const { getByText, getByLabelText, queryByText } = render(
      <GroupAccountabilityBoard
        state="public-preview"
        groupName="Morning Crew"
        promiseTitle="Walk before work"
        memberCount={8}
        reviewRuleLabel="Members post proof. Another eligible member reviews it."
        onJoin={onJoin}
      />
    );

    expect(getByText('Shared promise')).toBeTruthy();
    expect(getByText('8 members')).toBeTruthy();
    expect(
      getByText('Members post proof. Another eligible member reviews it.')
    ).toBeTruthy();
    expect(queryByText('Included with Pro')).toBeNull();
    fireEvent.press(getByLabelText('Join group'));
    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  it('themes public promise previews while keeping the active proof board on canvas', () => {
    const ember = getThemeAppearance('profile_theme_ember');
    expect(ember).not.toBeNull();

    const view = render(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <GroupAccountabilityBoard
          state="public-preview"
          groupName="Morning Crew"
          promiseTitle="Walk before work"
          memberCount={8}
        />
      </ThemeProvider>
    );

    expect(view.getByTestId('group-board-public-avatar')).toHaveStyle({
      backgroundColor: ember?.surfacePrimary,
    });
    expect(view.getByTestId('group-board-public-promise')).toHaveStyle({
      backgroundColor: mentaColors.paper,
    });

    view.rerender(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <GroupAccountabilityBoard
          state="active-member"
          groupName="Morning Crew"
          snapshot={snapshot}
          promiseTitle="Walk before work"
        />
      </ThemeProvider>
    );

    expect(view.getByTestId('group-board-paper-promise')).not.toHaveStyle({
      backgroundColor: mentaColors.paper,
    });
  });

  it('renders a read-only final record without proof or create controls', () => {
    const { getByText, queryByLabelText } = render(
      <GroupAccountabilityBoard
        state="read-only"
        groupName="Morning Crew"
        promiseTitle="Walk before work"
        readOnlyStatus="expired"
        endedDate="2026-07-28"
        onSubmitProof={jest.fn()}
        onAddPromise={jest.fn()}
      />
    );

    expect(getByText('Read-only')).toBeTruthy();
    expect(
      getByText(
        'This group ended on 28 July. You can view its promises, members, and proof history.'
      )
    ).toBeTruthy();
    expect(getByText('Final promise')).toBeTruthy();
    expect(queryByLabelText('Add proof')).toBeNull();
    expect(queryByLabelText('Add first promise')).toBeNull();
  });

  it('keeps cached data visible with stale recovery', () => {
    const onRetry = jest.fn();
    const { getByText, getByLabelText } = render(
      <GroupAccountabilityBoard
        state="stale"
        groupName="Morning Crew"
        snapshot={snapshot}
        promiseTitle="Walk before work"
        lastUpdatedAt={Date.UTC(2026, 7, 5, 7, 30)}
        onRetry={onRetry}
      />
    );

    expect(getByText('Showing the saved group board')).toBeTruthy();
    expect(
      getByText('1 of 3 proofs were approved in the saved board.')
    ).toBeTruthy();
    fireEvent.press(getByLabelText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders permission-aware unavailable recovery without guessing data', () => {
    const onBackToGroups = jest.fn();
    const { getByText, getByLabelText } = render(
      <GroupAccountabilityBoard
        state="unavailable"
        unavailableReason="permission"
        onBackToGroups={onBackToGroups}
      />
    );

    expect(getByText('You don’t have access to this group')).toBeTruthy();
    expect(
      getByText(
        'Your account is not allowed to read this group. Ask an owner for a current invite.'
      )
    ).toBeTruthy();
    fireEvent.press(getByLabelText('Go to Groups'));
    expect(onBackToGroups).toHaveBeenCalledTimes(1);
  });

  it('hides optional actions when no live callback exists', () => {
    const { queryByLabelText } = render(
      <GroupAccountabilityBoard state="empty" groupName="Morning Crew" />
    );

    expect(queryByLabelText('Add first promise')).toBeNull();
    expect(queryByLabelText('Invite people')).toBeNull();
  });
});
