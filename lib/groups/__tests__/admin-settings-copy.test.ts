import {
  getGroupSettingsDeleteNoticeCopy,
  getGroupSettingsLeaveNoticeCopy,
  getGroupSettingsNameRequiredCopy,
  getGroupSettingsOwnerOnlyCopy,
  getGroupSettingsSaveFailedCopy,
  getGroupSettingsSaveUnconfirmedCopy,
  getGroupSettingsSavedCopy,
} from '@/lib/groups/admin-settings-copy';
import { translate } from '@/lib/localization/translate';

describe('group settings notice copy', () => {
  it('names owner-only save as a real permission, not a generic error', () => {
    expect(getGroupSettingsOwnerOnlyCopy()).toEqual({
      title: 'Owner only',
      message: 'Only the owner can save these group settings.',
    });
    expect(getGroupSettingsOwnerOnlyCopy().title).toBe(
      translate('en-NZ', 'groupsHome.adminNotice.ownerOnlyTitle')
    );
  });

  it('names a missing group name before saving', () => {
    expect(getGroupSettingsNameRequiredCopy().title).toBe('Name required');
    expect(getGroupSettingsNameRequiredCopy().message).toContain(
      'Give this group a name'
    );
  });

  it('names a confirmed save as settings that are up to date', () => {
    expect(getGroupSettingsSavedCopy()).toEqual({
      title: 'Changes saved',
      message: 'Group settings are up to date.',
    });
  });

  it('keeps unconfirmed and failed saves from sounding finished', () => {
    expect(getGroupSettingsSaveUnconfirmedCopy().title).toBe(
      'Save not confirmed'
    );
    expect(getGroupSettingsSaveFailedCopy().title).toBe(
      "Changes weren't saved"
    );
    expect(getGroupSettingsSaveFailedCopy().message).toContain(
      'Your edits are still here'
    );
  });

  it('names leave and delete by the real outcome, not a server token', () => {
    expect(
      getGroupSettingsLeaveNoticeCopy('unknown', 'Check Groups again.')
    ).toEqual({
      title: 'Leave result unknown',
      message: 'Check Groups again.',
    });
    expect(getGroupSettingsDeleteNoticeCopy('unknown', 'ignored')).toEqual({
      title: 'Delete not confirmed',
      message: translate(
        'en-NZ',
        'groupsHome.adminNotice.deleteUnconfirmedDetail'
      ),
    });
    expect(
      getGroupSettingsDeleteNoticeCopy('failed', 'The group is still here.')
    ).toEqual({
      title: 'Group not deleted',
      message: 'The group is still here.',
    });
  });

  it('uses the active translator so owner receipts can localise', () => {
    const german = (key: Parameters<typeof translate>[1]) =>
      translate('de-DE', key);
    expect(getGroupSettingsSavedCopy(german).title).toBe(
      'Änderungen gespeichert'
    );
  });
});
