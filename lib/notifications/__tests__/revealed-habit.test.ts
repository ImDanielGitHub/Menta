import { supabase } from '@/lib/supabase';
import {
  DEFAULT_COACH_SNOOZE_HOURS,
  localHourAsTime,
  recordTypicalProofHour,
  resolveRescueTime,
  resolveRoutineSlot,
  snoozeCoachMessages,
} from '../revealed-habit';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('revealed habit coach timing', () => {
  it('records the local hour on the hour without minutes', () => {
    const aucklandAfternoon = new Date('2026-08-14T04:17:00.000Z');
    expect(localHourAsTime(aucklandAfternoon, 'Pacific/Auckland')).toBe(
      '16:00:00'
    );
    expect(localHourAsTime(aucklandAfternoon, 'UTC')).toBe('04:00:00');
  });

  it('caps rescue three hours after preferred time at 23:30', () => {
    expect(resolveRescueTime('20:00:00')).toBe('23:00:00');
    expect(resolveRescueTime('21:00:00')).toBe('23:30:00');
    expect(resolveRescueTime(null)).toBe('23:00:00');
  });

  it('uses typical hour when it still falls before rescue', () => {
    expect(
      resolveRoutineSlot({
        typicalProofHour: '19:00:00',
        preferredReminderTime: '20:00:00',
      })
    ).toBe('19:00:00');
    expect(
      resolveRoutineSlot({
        typicalProofHour: '22:00:00',
        preferredReminderTime: '20:00:00',
      })
    ).toBe('22:00:00');
  });

  it('falls back to preferred when typical would empty the routine window', () => {
    expect(
      resolveRoutineSlot({
        typicalProofHour: '23:45:00',
        preferredReminderTime: '20:00:00',
      })
    ).toBe('20:00:00');
    expect(
      resolveRoutineSlot({
        typicalProofHour: null,
        preferredReminderTime: '20:00:00',
      })
    ).toBe('20:00:00');
  });

  it('updates typical proof hour without upserting other preference columns', async () => {
    const update = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    (mockSupabase.from as jest.Mock).mockReturnValueOnce({ update });

    await recordTypicalProofHour({
      userId: '11111111-1111-1111-1111-111111111111',
      timeZone: 'Pacific/Auckland',
      now: new Date('2026-08-14T07:04:00.000Z'),
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('notification_preferences');
    expect(update).toHaveBeenCalledWith({
      typical_proof_hour: '19:00:00',
      updated_at: expect.any(String),
    });
    expect(update.mock.calls[0][0]).not.toHaveProperty('push_enabled');
    expect(update.mock.calls[0][0]).not.toHaveProperty(
      'preferred_reminder_time'
    );
  });

  it('asks the server to pause coach messages for four hours', async () => {
    (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { success: true, code: 'SNOOZE_CONFIRMED' },
      error: null,
    });

    await snoozeCoachMessages();

    expect(mockSupabase.rpc).toHaveBeenCalledWith('snooze_coach_messages', {
      p_hours: DEFAULT_COACH_SNOOZE_HOURS,
    });
  });
});
