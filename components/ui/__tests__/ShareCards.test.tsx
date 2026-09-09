import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import {
  GroupInviteCard,
  InvitePosterCard,
  ProofSharePreviewCard,
  ReferralProgressCard,
} from '../ShareCards';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }) => (
      <View {...props}>{children}</View>
    ),
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ShareCards', () => {
  it('renders the invite poster copy', () => {
    const { getByText } = render(
      <TestWrapper>
        <InvitePosterCard
          title="Join my 30-day streak"
          subtitle="Daily photo proof. Starting now."
          meta="Group mode · 3 spots left"
          badge="Invite group"
          footer="Menta · proof-first accountability"
        />
      </TestWrapper>
    );

    expect(getByText('Join my 30-day streak')).toBeTruthy();
    expect(getByText('Group mode · 3 spots left')).toBeTruthy();
    expect(getByText('Menta · proof-first accountability')).toBeTruthy();
  });

  it('renders group invite details', () => {
    const { getByText } = render(
      <TestWrapper>
        <GroupInviteCard
          groupName="Morning Run Club"
          inviteCode="LOCKEDIN"
          memberCount={5}
        />
      </TestWrapper>
    );

    expect(getByText('Morning Run Club')).toBeTruthy();
    expect(getByText('5 members')).toBeTruthy();
    expect(getByText('LOCKEDIN')).toBeTruthy();
  });

  it('renders referral progress', () => {
    const { getByText } = render(
      <TestWrapper>
        <ReferralProgressCard completed={2} target={5} reward="100 credits" />
      </TestWrapper>
    );

    expect(getByText('Referral progress')).toBeTruthy();
    expect(getByText('2/5')).toBeTruthy();
    expect(getByText('100 credits')).toBeTruthy();
  });

  it('renders proof share preview card details', () => {
    const { getByText } = render(
      <TestWrapper>
        <ProofSharePreviewCard
          dayCount={12}
          title="days of showing up - earned."
          subtitle="Morning run proof is waiting for review."
          meta="MENTA"
          badge="Proof receipt"
        />
      </TestWrapper>
    );

    expect(getByText('MENTA')).toBeTruthy();
    expect(getByText('Proof receipt')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('days of showing up - earned.')).toBeTruthy();
    expect(getByText('Morning run proof is waiting for review.')).toBeTruthy();
  });
});
