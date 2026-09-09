import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { GroupsAdminArchiveFamilyGallery } from '@/components/paper-gallery/GroupsAdminArchiveFamilyGallery';
import { GROUPS_ADMIN_ARCHIVE_PAPER_STATES } from '@/lib/paper-state-registry/groups-admin-archive';

describe('GroupsAdminArchiveFamilyGallery', () => {
  it('renders every assigned state deterministically without a public route', () => {
    const { getByTestId } = render(<GroupsAdminArchiveFamilyGallery />);
    expect(GROUPS_ADMIN_ARCHIVE_PAPER_STATES).toHaveLength(12);
    GROUPS_ADMIN_ARCHIVE_PAPER_STATES.forEach(state => {
      expect(
        getByTestId(`groups-admin-archive-paper-${state.paperId}`)
      ).toBeTruthy();
    });
  });

  it('keeps saving controls visibly busy and disabled', () => {
    const saving = GROUPS_ADMIN_ARCHIVE_PAPER_STATES.find(
      state => state.paperId === '4WV-0'
    );
    if (!saving) throw new Error('Missing Saving Changes state');
    const { getByLabelText, getByText } = render(
      <GroupsAdminArchiveFamilyGallery states={[saving]} />
    );
    expect(
      getByText('Controls unlock when Menta confirms the change.')
    ).toBeTruthy();
    expect(getByLabelText('Saving…').props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
  });

  it('reports the visible recovery action instead of a generic navigation action', () => {
    const onAction = jest.fn();
    const unavailable = GROUPS_ADMIN_ARCHIVE_PAPER_STATES.find(
      state => state.paperId === '4ZB-0'
    );
    if (!unavailable) throw new Error('Missing Archive Unavailable state');
    const { getByText } = render(
      <GroupsAdminArchiveFamilyGallery
        onAction={onAction}
        states={[unavailable]}
      />
    );
    fireEvent.press(getByText('Try again'));
    expect(onAction).toHaveBeenCalledWith({
      id: 'retry_archive',
      paperId: '4ZB-0',
    });
  });

  it('keeps unsaved retention separate from discarding the draft', () => {
    const onAction = jest.fn();
    const unsaved = GROUPS_ADMIN_ARCHIVE_PAPER_STATES.find(
      state => state.paperId === '4WK-0'
    );
    if (!unsaved) throw new Error('Missing Unsaved Changes state');
    const { getByText } = render(
      <GroupsAdminArchiveFamilyGallery onAction={onAction} states={[unsaved]} />
    );
    expect(getByText('Your edits have not been saved.')).toBeTruthy();
    fireEvent.press(getByText('Keep editing'));
    fireEvent.press(getByText('Discard changes'));
    expect(onAction).toHaveBeenNthCalledWith(1, {
      id: 'keep_editing',
      paperId: '4WK-0',
    });
    expect(onAction).toHaveBeenNthCalledWith(2, {
      id: 'discard_changes',
      paperId: '4WK-0',
    });
  });
});
