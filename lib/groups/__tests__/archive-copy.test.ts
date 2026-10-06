import { formatArchivedGroupDate } from '../archive-copy';

describe('archived group date copy', () => {
  it('names a known archive date instead of leaving English around the value', () => {
    expect(formatArchivedGroupDate('2026-08-31', 'en-US')).toBe(
      'Archived Aug 31'
    );
    expect(formatArchivedGroupDate('2026-08-31T12:00:00.000Z', 'en-GB')).toBe(
      'Archived 31 Aug'
    );
  });

  it('names a missing or unreadable archive date as an archived group', () => {
    expect(formatArchivedGroupDate(null, 'en-NZ')).toBe('Archived group');
    expect(formatArchivedGroupDate('not-a-date', 'en-NZ')).toBe(
      'Archived group'
    );
  });

  it('lets the locale own the sentence around the formatted date', () => {
    const t = (key: string, values: Record<string, string | number> = {}) => {
      const copy: Record<string, string> = {
        'groups.source.date.archived': 'Archivé le {date}',
        'groups.source.date.archived_unknown': 'Groupe archivé',
      };
      return (copy[key] ?? key).replace(/\{(\w+)\}/g, (_, name: string) =>
        String(values[name] ?? `{${name}}`)
      );
    };

    expect(formatArchivedGroupDate('2026-08-31', 'fr-FR', t)).toBe(
      'Archivé le 31 août'
    );
    expect(formatArchivedGroupDate(null, 'fr-FR', t)).toBe('Groupe archivé');
  });
});
