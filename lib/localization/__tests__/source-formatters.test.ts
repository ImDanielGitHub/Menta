import {
  formatGroupDate,
  formatGroupDateRange,
  formatProofHistoryDetail,
  formatProofRelativeTime,
} from '@/lib/localization/source-formatters';

const translate = (
  key: string,
  values: Record<string, string | number> = {}
) => {
  const copy: Record<string, string> = {
    'groups.source.date.no_fixed': 'No fixed dates',
    'groups.source.date.range': '{start} to {end}',
    'groups.source.date.starts': 'Starts {date}',
    'groups.source.date.ends': 'Ends {date}',
    'todayProof.promise.time_unavailable': 'Time unavailable',
    'todayProof.promise.date_unavailable': 'Date unavailable',
    'todayProof.promise.sent_recently': 'Sent recently',
    'todayProof.promise.sent_just_now': 'Sent just now',
    'todayProof.source.relative.sent_minutes': 'Sent {count} minutes ago',
    'todayProof.source.relative.sent_hours': 'Sent {count} hours ago',
    'todayProof.source.relative.sent_weekday': 'Sent {weekday}',
    'todayProof.source.history.approved': '{media} approved',
    'todayProof.source.history.needs_another_try': '{media} needs another try',
  };
  return (copy[key] ?? key).replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values[name] ?? `{${name}}`)
  );
};

describe('localised source formatters', () => {
  it('keeps a date-only group day stable in every timezone', () => {
    expect(formatGroupDate('2026-08-31', 'en-US')).toBe('Aug 31');
    expect(formatGroupDate('2026-08-31', 'de-DE')).toBe('31. Aug.');
  });

  it('localises group date range sentences around formatted values', () => {
    expect(
      formatGroupDateRange('2026-08-31', '2026-09-02', 'en-US', translate)
    ).toBe('Aug 31 to Sep 2');
  });

  it('uses translated proof status sentences without English concatenation', () => {
    expect(formatProofHistoryDetail('approved', 'Foto', null, translate)).toBe(
      'Foto approved'
    );
    expect(formatProofHistoryDetail('rejected', 'Foto', null, translate)).toBe(
      'Foto needs another try'
    );
    expect(formatProofHistoryDetail('pending', 'Foto', null, translate)).toBe(
      'Foto'
    );
  });

  it('formats proof relative time with the selected locale', () => {
    const now = new Date('2026-08-31T12:10:00.000Z');
    expect(
      formatProofRelativeTime(
        '2026-08-31T12:08:00.000Z',
        now,
        'en-US',
        translate
      )
    ).toBe('Sent 2 minutes ago');
  });

  it('keeps production fallbacks and weekday context', () => {
    const now = new Date('2026-08-31T12:10:00.000Z');
    expect(formatProofRelativeTime('not-a-date', now, 'en-US', translate)).toBe(
      'Sent recently'
    );
    expect(
      formatProofRelativeTime(
        '2026-08-31T12:10:00.000Z',
        now,
        'en-US',
        translate
      )
    ).toBe('Sent just now');
    expect(
      formatProofRelativeTime(
        '2026-08-28T12:10:00.000Z',
        now,
        'en-NZ',
        translate
      )
    ).toBe('Sent saturday');
    expect(formatGroupDate(null, 'en-NZ')).toBeNull();
  });
});
