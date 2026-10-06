import { getNotificationPermissionOffCopy } from '../permission-off-copy';

describe('notification permission-off copy', () => {
  it('names the skip as continuing without reminders', () => {
    const copy = getNotificationPermissionOffCopy();

    expect(copy.action).toBe('Continue without reminders');
    expect(copy.action).not.toBe('Continue');
    expect(copy.title).toBe('Notifications are off');
    expect(copy.body).toContain('Menta works without notifications');
    expect(copy.settings).toBe('Open settings');
  });
});
