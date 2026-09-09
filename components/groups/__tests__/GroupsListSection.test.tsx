import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { GroupsListSection } from '@/components/groups/GroupsListSection';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getThemeAppearance } from '@/lib/shop/catalogSupport';
import { getGroupImagePreset } from '@/lib/groups/group-image-presets';
import type { Group } from '@/store/group-store';

const group = (overrides: Partial<Group> = {}): Group => ({
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
  ...overrides,
});

const renderSection = (
  props?: Partial<React.ComponentProps<typeof GroupsListSection>>,
  equippedThemeSku?: string
) => {
  const handlers = {
    onRefreshGroups: jest.fn(),
    onGoToToday: jest.fn(),
    onJoinWithCode: jest.fn(),
    onChoosePromise: jest.fn(),
    onCreateGroup: jest.fn(),
    onOpenPromise: jest.fn(),
    onOpenGroup: jest.fn(),
    onPreviewGroup: jest.fn(),
  };

  const view = render(
    <ThemeProvider equippedThemeSku={equippedThemeSku}>
      <GroupsListSection
        tab="mine"
        userId="owner-1"
        myGroups={[group()]}
        discoverGroups={[group({ id: 'group-2', name: 'Lunch walkers' })]}
        initialLoading={false}
        fetchError={null}
        {...handlers}
        {...props}
      />
    </ThemeProvider>
  );

  return { ...handlers, ...view };
};

describe('GroupsListSection Paper states', () => {
  it('renders GRP-00 with one announced canonical skeleton composition', () => {
    renderSection({ initialLoading: true });

    expect(screen.getByTestId('groups-paper-GRP-00')).toBeTruthy();
    expect(screen.getByLabelText('Loading Together')).toBeTruthy();
    expect(screen.getByText('Shared promises')).toBeTruthy();
    expect(screen.queryByText('Loading Together')).toBeNull();
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
  });

  it('renders GRP-01 as accessible owned-group rows', () => {
    const { onOpenGroup } = renderSection();

    expect(screen.getByTestId('groups-paper-GRP-01')).toBeTruthy();
    expect(screen.getByText('Saved groups')).toBeTruthy();
    expect(screen.getByText('Walk before work')).toBeTruthy();
    expect(screen.getByText('Owner')).toBeTruthy();
    expect(screen.getByText('3-day group streak')).toBeTruthy();
    expect(screen.queryByText('Open')).toBeNull();
    expect(screen.getByText('M', { includeHiddenElements: true })).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Morning crew, Owner'));
    expect(onOpenGroup).toHaveBeenCalledWith('group-1');
  });

  it('uses Ember semantic surfaces and personalised marks for owned cards', () => {
    const ember = getThemeAppearance('profile_theme_ember');
    expect(ember).not.toBeNull();

    renderSection(undefined, 'profile_theme_ember');

    expect(screen.getByTestId('owned-group-card-group-1')).toHaveStyle({
      backgroundColor: ember?.surfacePrimary,
      borderColor: mentaColors.border,
      alignItems: 'center',
    });
    expect(
      screen.getByTestId('groups-owned-mark', {
        includeHiddenElements: true,
      })
    ).toHaveStyle({
      backgroundColor: ember?.interactivePrimary,
    });
  });

  it('shows a saved group image and keeps the generic mark as the fallback', () => {
    renderSection({
      myGroups: [
        group({ image_url: 'https://cdn.example.com/morning-crew.jpg' }),
      ],
    });

    expect(
      screen.getByTestId('group-image', { includeHiddenElements: true })
    ).toHaveProp('source', {
      uri: 'https://cdn.example.com/morning-crew.jpg',
    });
  });

  it('resolves a bundled preset token without a remote image request', () => {
    renderSection({
      myGroups: [group({ image_url: 'menta-preset:reset' })],
    });

    expect(
      screen.getByTestId('group-preset-image', {
        includeHiddenElements: true,
      })
    ).toHaveProp('source', getGroupImagePreset('reset').source);
  });

  it('renders GRP-02 with both recovery actions', () => {
    const { onChoosePromise, onCreateGroup, onJoinWithCode } = renderSection({
      myGroups: [],
    });

    expect(screen.getByTestId('groups-paper-GRP-02')).toBeTruthy();
    expect(screen.getByText('Bring someone into a promise.')).toBeTruthy();
    expect(
      screen.getByText(
        'Choose one promise, then decide how another person can help.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Choose a promise'));
    fireEvent.press(screen.getByText('Enter an invite code'));
    fireEvent.press(screen.getByText('Create a saved group'));

    expect(onChoosePromise).toHaveBeenCalledTimes(1);
    expect(onCreateGroup).toHaveBeenCalledTimes(1);
    expect(onJoinWithCode).toHaveBeenCalledTimes(1);
  });

  it('puts shared promises before their hidden promise container', () => {
    const { onOpenPromise } = renderSection({
      myGroups: [
        group({
          kind: 'promise',
          member_count: 2,
          shared_promises: [
            {
              id: 'promise-1',
              title: 'Walk after work',
              status: 'active',
              durationDays: 14,
              startDate: '2026-08-31T00:00:00.000Z',
              endDate: '2026-09-13T00:00:00.000Z',
            },
          ],
        }),
      ],
    });

    expect(screen.getByTestId('together-shared-promises')).toBeTruthy();
    expect(screen.getByText('Walk after work')).toBeTruthy();
    expect(screen.queryByText('Saved groups')).toBeNull();
    fireEvent.press(screen.getByLabelText('Walk after work. 2 people.'));
    expect(onOpenPromise).toHaveBeenCalledWith('promise-1');
  });

  it('renders GRP-03 as public preview rows without an optimistic join', () => {
    const publicGroup = group({ id: 'group-2', name: 'Lunch walkers' });
    const { onPreviewGroup } = renderSection({ tab: 'discover' });

    expect(screen.getByTestId('groups-paper-GRP-03')).toBeTruthy();
    expect(screen.getByText('Public groups')).toBeTruthy();
    expect(screen.getByText('7 members · Public')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('View Lunch walkers before joining'));
    expect(onPreviewGroup).toHaveBeenCalledWith(publicGroup);
  });

  it('renders GRP-04 without collapsing stale data to an empty state', () => {
    renderSection({ fetchError: 'Network unavailable' });

    expect(screen.getByTestId('groups-paper-GRP-04')).toBeTruthy();
    expect(screen.getByText("You're offline")).toBeTruthy();
    expect(screen.getByText('Known group · actions paused')).toHaveStyle({
      color: mentaColors.warning,
    });
    expect(screen.getByText('Morning crew')).toBeTruthy();
  });

  it('renders GRP-05 with retry and safe navigation actions', () => {
    const { onRefreshGroups, onGoToToday } = renderSection({
      myGroups: [],
      fetchError: 'Network unavailable',
    });

    expect(screen.getByTestId('groups-paper-GRP-05')).toBeTruthy();
    expect(screen.getByText("Together couldn't load")).toBeTruthy();
    expect(
      screen.getByText(
        'Nothing changed. Try again when your connection is stable.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Try again'));
    fireEvent.press(screen.getByText('Go to Today'));

    expect(onRefreshGroups).toHaveBeenCalledTimes(1);
    expect(onGoToToday).toHaveBeenCalledTimes(1);
  });
});
