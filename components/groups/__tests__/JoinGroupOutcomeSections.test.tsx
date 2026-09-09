import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import {
  JoinGroupActionNoticeSection,
  JoinGroupDetailsSection,
  JoinGroupFundingOptionsSection,
  JoinGroupReceiptSection,
  type JoinGroupNotice,
} from '@/components/groups/JoinGroupOutcomeSections';
import { ThemeProvider } from '@/constants/ThemeContext';

const renderWithTheme = (node: React.ReactElement) =>
  render(<ThemeProvider>{node}</ThemeProvider>);

describe('JoinGroupOutcomeSections', () => {
  it('keeps the successful join receipt actionable', () => {
    const onOpenGroup = jest.fn();
    const onJoinAnother = jest.fn();
    const notice: JoinGroupNotice = {
      tone: 'success',
      title: 'Joined group',
      description: 'You are in Morning crew.',
      action: 'open_group',
      receipt: 'joined',
      groupId: 'group-1',
      groupName: 'Morning crew',
    };

    renderWithTheme(
      <JoinGroupReceiptSection
        notice={notice}
        joinCost={25}
        onOpenGroup={onOpenGroup}
        onJoinAnother={onJoinAnother}
      />
    );

    expect(screen.getByText('Group joined')).toBeTruthy();
    expect(screen.getByText("You're in Morning crew.")).toBeTruthy();
    expect(screen.getByText('Momenta spent')).toBeTruthy();
    expect(screen.getByText('25 Momenta')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('View group'));
    fireEvent.press(screen.getByText('Join another group'));

    expect(onOpenGroup).toHaveBeenCalledWith('group-1');
    expect(onJoinAnother).toHaveBeenCalledTimes(1);
  });

  it('keeps already-member receipts clear about no spend', () => {
    const onOpenGroup = jest.fn();
    const notice: JoinGroupNotice = {
      tone: 'info',
      title: 'Already a member',
      description: 'No Momenta spent.',
      action: 'open_group',
      receipt: 'already_member',
      groupName: 'Morning crew',
    };

    renderWithTheme(
      <JoinGroupReceiptSection
        notice={notice}
        joinCost={25}
        onOpenGroup={onOpenGroup}
        onJoinAnother={jest.fn()}
      />
    );

    expect(screen.getByText("You're already in this group.")).toBeTruthy();
    expect(
      screen.getByText(
        'No Momenta spent. Open the group board to keep checking in.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Already a member')).toBeTruthy();

    fireEvent.press(screen.getByText('View groups'));

    expect(onOpenGroup).toHaveBeenCalledWith(undefined);
  });

  it('routes action notices to funding, group open, and retry paths', () => {
    const onOpenGroup = jest.fn();
    const onShowFunding = jest.fn();
    const onTryAnotherCode = jest.fn();

    const { rerender } = renderWithTheme(
      <JoinGroupActionNoticeSection
        notice={{
          tone: 'warning',
          title: 'Momenta needed',
          description: 'Earn a quick reward.',
          action: 'funding',
        }}
        onOpenGroup={onOpenGroup}
        onShowFunding={onShowFunding}
        onTryAnotherCode={onTryAnotherCode}
        onSignIn={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('Show Momenta options'));
    fireEvent.press(screen.getByText('Try another code'));

    expect(onShowFunding).toHaveBeenCalledTimes(1);
    expect(onTryAnotherCode).toHaveBeenCalledTimes(1);

    rerender(
      <ThemeProvider>
        <JoinGroupActionNoticeSection
          notice={{
            tone: 'info',
            title: 'Already a member',
            description: 'Open the board.',
            action: 'open_group',
            groupId: 'group-2',
          }}
          onOpenGroup={onOpenGroup}
          onShowFunding={onShowFunding}
          onTryAnotherCode={onTryAnotherCode}
          onSignIn={jest.fn()}
        />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByText('Open group'));

    expect(onOpenGroup).toHaveBeenCalledWith('group-2');
  });

  it('keeps funding options hidden until requested', () => {
    const onWatchAd = jest.fn();
    const onShowPro = jest.fn();
    const { rerender } = renderWithTheme(
      <JoinGroupFundingOptionsSection
        visible={false}
        joinCost={25}
        onWatchAd={onWatchAd}
        onShowPro={onShowPro}
      />
    );

    expect(screen.queryByText('Momenta needed')).toBeNull();

    rerender(
      <ThemeProvider>
        <JoinGroupFundingOptionsSection
          visible
          joinCost={25}
          onWatchAd={onWatchAd}
          onShowPro={onShowPro}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Momenta needed')).toBeTruthy();
    expect(
      screen.getByText(
        'Joining costs 25 Momenta. Add enough Momenta, then return to this invite.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Watch ad for Momenta'));
    fireEvent.press(screen.getByText('See Pro options'));

    expect(onWatchAd).toHaveBeenCalledTimes(1);
    expect(onShowPro).toHaveBeenCalledTimes(1);
  });

  it('keeps join details progressive instead of always expanded', () => {
    const onToggle = jest.fn();
    const { rerender } = renderWithTheme(
      <JoinGroupDetailsSection expanded={false} onToggle={onToggle} />
    );

    expect(screen.getByText('What happens when I join?')).toBeTruthy();
    expect(
      screen.queryByText(/Proof, streaks and reviews stay tied to the group\./)
    ).toBeNull();

    fireEvent.press(screen.getByText('What happens when I join?'));

    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(
      <ThemeProvider>
        <JoinGroupDetailsSection expanded onToggle={onToggle} />
      </ThemeProvider>
    );

    expect(
      screen.getByText(/Proof, streaks and reviews stay tied to the group\./)
    ).toBeTruthy();
    expect(screen.getByTestId('join-group-details-disclosure')).toHaveStyle({
      borderTopWidth: StyleSheet.hairlineWidth,
    });
  });
});
