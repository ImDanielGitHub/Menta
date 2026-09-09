import fs from 'node:fs';
import path from 'node:path';

import {
  COACH_COPY_CATALOG_VERSION,
  pickCatalogIndex,
  reminderKindToCoachKind,
  renderCoachCopy,
  sanitizePromiseLabel,
} from '../coach-copy';

describe('coach copy catalog', () => {
  it('picks a stable variant for the same user, day, and kind', () => {
    const first = pickCatalogIndex(
      '11111111-1111-1111-1111-111111111111',
      '2026-08-14',
      'routine',
      3
    );
    const second = pickCatalogIndex(
      '11111111-1111-1111-1111-111111111111',
      '2026-08-14',
      'routine',
      3
    );

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(3);
  });

  it('changes variant when the local day or kind changes', () => {
    const userId = '22222222-2222-2222-2222-222222222222';
    const routine = pickCatalogIndex(userId, '2026-08-14', 'routine', 3);
    const nextDay = pickCatalogIndex(userId, '2026-08-15', 'routine', 3);
    const save = pickCatalogIndex(userId, '2026-08-14', 'save', 3);

    expect([nextDay, save].some(value => value !== routine)).toBe(true);
  });

  it('renders sentence-case copy with substituted tokens', () => {
    const result = renderCoachCopy({
      userId: '33333333-3333-3333-3333-333333333333',
      localDay: '2026-08-14',
      kind: 'routine',
      tokens: {
        promise_label: 'Walk before dusk',
        streak_length: 12,
        hours_remaining: 2,
        freeze_remaining: 1,
        proof_due_label: '8:00 PM',
        open_promise_count: 1,
      },
    });

    expect(result.catalogVersion).toBe(COACH_COPY_CATALOG_VERSION);
    expect(result.title.endsWith('.')).toBe(true);
    expect(result.title).toMatch(/^[A-Z]/);
    expect(result.title).not.toMatch(/quest|kingdom|glory|battle|honor/i);
    expect(result.body).not.toMatch(/quest|kingdom|glory|battle|honor/i);
    expect(result.body).not.toContain('Walk before dusk');
  });

  it('maps rescue reminders to factual, non-threatening copy', () => {
    expect(reminderKindToCoachKind('rescue')).toBe('save');
    const result = renderCoachCopy({
      userId: '44444444-4444-4444-4444-444444444444',
      localDay: '2026-08-14',
      kind: reminderKindToCoachKind('rescue'),
      tokens: {
        promise_label: 'Morning focus',
        streak_length: 6,
        hours_remaining: 1,
        freeze_remaining: 2,
        proof_due_label: '8:00 PM',
        open_promise_count: 2,
      },
    });

    expect(result.kind).toBe('save');
    expect(`${result.title} ${result.body}`).not.toMatch(
      /last chance|at risk|lose|save your streak|freeze/i
    );
    expect(result.body.toLowerCase()).toMatch(/open|hour|until|day ends/);
  });

  it('falls back to a human promise label and trims long titles', () => {
    expect(sanitizePromiseLabel('   ')).toBe('your promise');
    expect(sanitizePromiseLabel('a'.repeat(90)).endsWith('…')).toBe(true);
  });

  it('keeps the Edge Function copy catalog aligned with app English copy', () => {
    const appCopy = fs.readFileSync(
      path.join(
        process.cwd(),
        'lib/localization/catalogues/en-NZ/full-domain-feedback.ts'
      ),
      'utf8'
    );
    const edgeCopy = fs.readFileSync(
      path.join(process.cwd(), 'supabase/functions/_shared/coach-copy.ts'),
      'utf8'
    );

    for (const phrase of [
      'Proof is due.',
      'Today still counts.',
      'Log today’s proof.',
      'There’s still time today.',
      'Today’s proof is still open.',
      'Choose the next small step.',
    ]) {
      expect(edgeCopy).toContain(phrase);
      expect(appCopy).toContain(phrase);
    }
    expect(`${edgeCopy}\n${appCopy}`).not.toMatch(
      /Last chance|at risk|save today|keep .*streak|You have .*freeze/i
    );
  });
});
