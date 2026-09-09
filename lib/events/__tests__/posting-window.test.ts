import fs from 'node:fs';
import path from 'node:path';

import {
  EVENT_PHOTO_POSTING_AGREEMENT_COPY,
  EVENT_PHOTO_POSTING_ALBUM_FACT,
  EVENT_PHOTO_POSTING_COMPOSE_COPY,
  EVENT_PHOTO_POSTING_RULE_COPY,
  EVENT_PHOTO_POSTING_UNAVAILABLE_COPY,
  EVENT_PHOTO_POSTING_WINDOW_COPY,
  eventPhotoPostingReceiptMessage,
  isEventPhotoPostingUnavailable,
} from '@/lib/events/posting-window';

const read = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('event photo posting window copy', () => {
  it('names the published start-to-plus-two-hours contract', () => {
    expect(EVENT_PHOTO_POSTING_WINDOW_COPY).toBe(
      'Photos open when the event starts and stay open for two hours after it ends.'
    );
    expect(EVENT_PHOTO_POSTING_RULE_COPY).toContain('Checked-in attendees');
    expect(EVENT_PHOTO_POSTING_RULE_COPY).toContain(
      'two hours after the event ends'
    );
    expect(EVENT_PHOTO_POSTING_ALBUM_FACT).toBe(
      'From the start until two hours after it ends'
    );
    expect(EVENT_PHOTO_POSTING_UNAVAILABLE_COPY).not.toMatch(/qr/i);
    expect(EVENT_PHOTO_POSTING_UNAVAILABLE_COPY).not.toMatch(/bad/i);
    expect(EVENT_PHOTO_POSTING_COMPOSE_COPY).toContain(
      'two hours after the event ends'
    );
    expect(EVENT_PHOTO_POSTING_AGREEMENT_COPY).toContain(
      'two hours after it ends'
    );
  });

  it('maps POSTING_UNAVAILABLE to the posting window, not a media failure', () => {
    expect(isEventPhotoPostingUnavailable('POSTING_UNAVAILABLE')).toBe(true);
    expect(isEventPhotoPostingUnavailable('INVALID_MEDIA_METADATA')).toBe(
      false
    );
    expect(
      eventPhotoPostingReceiptMessage(
        'POSTING_UNAVAILABLE',
        'Posting is not open for this event.'
      )
    ).toBe(EVENT_PHOTO_POSTING_UNAVAILABLE_COPY);
    expect(
      eventPhotoPostingReceiptMessage(
        'INVALID_MEDIA_METADATA',
        'This image cannot be uploaded with the supplied metadata.'
      )
    ).toBe('This image cannot be uploaded with the supplied metadata.');
  });

  it('keeps authoring SQL opening at start and closing two hours after end', () => {
    const sql = read(
      'supabase/migrations/20260809123400_event_authoring_v1.sql'
    );

    expect(sql).toContain('posting_opens_at');
    expect(sql).toContain('posting_closes_at');
    expect(sql).toContain('p_starts_at,');
    expect(sql).toContain("p_ends_at + interval '2 hours'");
  });
});
