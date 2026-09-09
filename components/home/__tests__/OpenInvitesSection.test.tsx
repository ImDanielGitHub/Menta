import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { OpenInvitesSection } from '@/components/home/OpenInvitesSection';
import type { Group } from '@/store/group-store';

const publicGroup: Group = {
  id: 'group-1',
  name: 'Morning crew',
  description: 'Walk before work',
  owner_id: 'owner-1',
  status: 'active',
  duration_days: 14,
  current_streak: 3,
  created_at: '2026-06-01T00:00:00.000Z',
  member_count: 7,
  privacy: 'public',
};

const renderSection = (
  props?: Partial<React.ComponentProps<typeof OpenInvitesSection>>
) => {
  const handlers = {
    onToggle: jest.fn(),
    onOpenSavedInvite: jest.fn(),
    onClearSavedInvite: jest.fn(),
    onPreviewGroup: jest.fn(),
    onRefreshInvites: jest.fn(),
    onJoinWithCode: jest.fn(),
    onStartSolo: jest.fn(),
  };

  return {
    ...handlers,
    ...render(
      <ThemeProvider>
        <OpenInvitesSection
          groups={[publicGroup]}
          expanded
          {...handlers}
          {...props}
        />
      </ThemeProvider>
    ),
  };
};

describe('OpenInvitesSection', () => {
  it('previews public groups without owning join state', () => {
    const { onPreviewGroup, onToggle } = renderSection();

    expect(screen.getByText('Open invites')).toBeTruthy();
    expect(screen.getByText('Hide')).toBeTruthy();
    expect(screen.getByText('Morning crew')).toBeTruthy();
    expect(screen.getByText('7 members - 3 days streak')).toBeTruthy();

    fireEvent.press(screen.getByText('Morning crew'));
    fireEvent.press(screen.getByText('Hide'));

    expect(onPreviewGroup).toHaveBeenCalledWith(publicGroup);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keeps empty discovery recoverable', () => {
    const { onRefreshInvites, onJoinWithCode, onStartSolo } = renderSection({
      groups: [],
    });

    expect(screen.getByText('No public groups')).toBeTruthy();
    expect(
      screen.getByText(
        'Check again, join with a code, or make a personal promise.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Check again'));
    fireEvent.press(screen.getByText('Join with code'));
    fireEvent.press(screen.getByText('Make a personal promise'));

    expect(onRefreshInvites).toHaveBeenCalledTimes(1);
    expect(onJoinWithCode).toHaveBeenCalledTimes(1);
    expect(onStartSolo).toHaveBeenCalledTimes(1);
  });

  it('keeps saved invite retry and dismissal visible above discovery', () => {
    const { onOpenSavedInvite, onClearSavedInvite } = renderSection({
      pendingInvite: {
        type: 'challenge',
        code: 'FIT2026',
        timestamp: Date.now(),
      },
      expanded: false,
    });

    expect(screen.getByText('Saved promise invite')).toBeTruthy();
    expect(
      screen.getByText(
        'We saved code FIT2026 on this phone. Open it again, or clear it if the invite no longer works.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Open saved invite'));
    fireEvent.press(screen.getByText('Clear'));

    expect(onOpenSavedInvite).toHaveBeenCalledTimes(1);
    expect(onClearSavedInvite).toHaveBeenCalledTimes(1);
  });

  it('keeps collapsed browse state quiet', () => {
    renderSection({ expanded: false });

    expect(screen.getByText('Browse')).toBeTruthy();
    expect(screen.queryByText('Morning crew')).toBeNull();
  });
});
