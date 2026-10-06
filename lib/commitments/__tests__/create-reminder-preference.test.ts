import {
  getCreateReminderEducationCopy,
  loadCreateReminderPreference,
  persistCreateReminderPreference,
  resolveCreateReminderEnabled,
} from '@/lib/commitments/create-reminder-preference';

describe('create reminder preference', () => {
  it('names reminders as an account setting, not a per-promise toggle', () => {
    const copy = getCreateReminderEducationCopy();

    expect(copy.title).toBe('Want proof reminders?');
    expect(copy.description).toContain('any active promise');
    expect(copy.description.toLowerCase()).not.toContain('this promise');
    expect(copy.switchTitle).toBe('Proof reminders');
    expect(copy.switchDetail).toBe(
      'Applies to every promise, not just this one.'
    );
    expect(copy.continueLabel).toBe('Set up reminders');
    expect(copy.skipLabel).toBe('Continue without reminders');
  });

  it('treats a missing saved preference as on', () => {
    expect(resolveCreateReminderEnabled(undefined)).toBe(true);
    expect(resolveCreateReminderEnabled(null)).toBe(true);
    expect(resolveCreateReminderEnabled(true)).toBe(true);
    expect(resolveCreateReminderEnabled(false)).toBe(false);
  });

  it('loads the saved account preference for a signed-in person', async () => {
    const reader = jest.fn(async () => false);

    await expect(loadCreateReminderPreference('user-1', reader)).resolves.toBe(
      false
    );
    expect(reader).toHaveBeenCalledWith('user-1');
  });

  it('does not invent a signed-out preference write', async () => {
    const writer = jest.fn(async () => undefined);

    await persistCreateReminderPreference(undefined, false, writer);
    await persistCreateReminderPreference(null, true, writer);

    expect(writer).not.toHaveBeenCalled();
  });

  it('writes the account challenge_reminders choice', async () => {
    const writer = jest.fn(async () => undefined);

    await persistCreateReminderPreference('user-1', false, writer);

    expect(writer).toHaveBeenCalledWith('user-1', false);
  });
});
