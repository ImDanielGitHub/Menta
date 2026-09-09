import fs from 'node:fs';
import path from 'node:path';

import {
  EVENT_CHECK_IN_OPENS_MINUTES_BEFORE,
  EVENT_CHECK_IN_WINDOW_COPY,
  getEventCheckInEntryCopy,
  getEventCheckInFactDetail,
  getEventCheckInRejectedCopy,
  getEventJoinHelperCopy,
  getEventJoinedReceiptCopy,
  isEventCheckInWindowClosed,
} from '@/lib/events/check-in-window';

describe('event check-in window copy', () => {
  it('names the published 30-minute open window and close-at-end bound', () => {
    expect(EVENT_CHECK_IN_OPENS_MINUTES_BEFORE).toBe(30);
    expect(EVENT_CHECK_IN_WINDOW_COPY).toBe(
      'Check-in opens 30 minutes before the event and stays open until it ends.'
    );
    expect(getEventJoinHelperCopy()).toContain(
      'Check-in opens 30 minutes before the event'
    );
    expect(getEventJoinedReceiptCopy()).toBe(
      'Your place is saved. Check-in opens 30 minutes before the event and stays open until it ends. Add a photo after you check in.'
    );
    expect(getEventCheckInFactDetail()).toBe(
      'Opens 30 minutes before the event, until it ends'
    );
    expect(getEventCheckInEntryCopy()).toContain(
      'Check-in opens 30 minutes before the event and stays open until it ends.'
    );
  });

  it('does not treat a bad code as a closed window', () => {
    expect(isEventCheckInWindowClosed('TOKEN_UNAVAILABLE')).toBe(false);
    expect(
      getEventCheckInRejectedCopy(
        'TOKEN_UNAVAILABLE',
        'This check-in token is expired or invalid.'
      )
    ).toEqual({
      title: 'QR not accepted',
      description:
        'This check-in token is expired or invalid. It may be expired, already used, or for another occurrence. No attendance receipt was created and nothing changed.',
    });
  });

  it('explains CHECKIN_UNAVAILABLE as the window, not a bad QR', () => {
    const copy = getEventCheckInRejectedCopy('CHECKIN_UNAVAILABLE');
    expect(isEventCheckInWindowClosed('CHECKIN_UNAVAILABLE')).toBe(true);
    expect(copy.title).toBe('Check-in is not open yet');
    expect(copy.description).toContain(
      'Check-in opens 30 minutes before the event'
    );
    expect(copy.description).toContain('Nothing changed');
  });

  it('matches the authoring SQL window that attendees now read', () => {
    const sql = fs.readFileSync(
      path.join(
        process.cwd(),
        'supabase/migrations/20260809123400_event_authoring_v1.sql'
      ),
      'utf8'
    );

    expect(sql).toContain("p_starts_at - interval '30 minutes'");
    expect(sql).toContain('checkin_closes_at');
  });
});
