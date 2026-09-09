import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('event occurrence lifecycle contract', () => {
  const migration = () =>
    read(
      'supabase/migrations/20260809141646_event_occurrence_lifecycle_v1.sql'
    );
  const edge = () => read('supabase/functions/event-participation/index.ts');

  it('derives a monotonic state from server time and stored occurrence bounds', () => {
    const sql = migration();

    expect(sql).toContain(
      'create or replace function private.event_occurrence_state_at_v1'
    );
    expect(sql).toContain("when p_current_state = 'cancelled'");
    expect(sql).toContain("when p_current_state = 'ended'");
    expect(sql).toContain('when p_ends_at <= p_at');
    expect(sql).toContain(
      "when p_current_state = 'live' or p_starts_at <= p_at"
    );
    expect(sql).toContain("elsif old.state in ('cancelled', 'ended')");
  });

  it('normalises occurrence writes and indexes only transitionable rows', () => {
    const sql = migration();

    expect(sql).toContain('event_occurrences_apply_lifecycle_v1');
    expect(sql).toContain(
      'before insert or update on public.event_occurrences'
    );
    expect(sql).toContain('event_occurrences_scheduled_starts_idx');
    expect(sql).toContain("where state = 'scheduled'");
    expect(sql).toContain('event_occurrences_live_ends_idx');
    expect(sql).toContain("where state = 'live'");
  });

  it('advances due rows atomically and records each server transition', () => {
    const sql = migration();

    expect(sql).toContain(
      'create or replace function public.event_reconcile_occurrence_lifecycle_v1()'
    );
    expect(sql).toContain("where occurrence.state = 'scheduled'");
    expect(sql).toContain('and occurrence.starts_at <= v_at');
    expect(sql).toContain("where occurrence.state = 'live'");
    expect(sql).toContain('and occurrence.ends_at <= v_at');
    expect(sql).toContain("'event.occurrence_lifecycle_reconciled'");
    expect(sql).toContain("'from', 'scheduled'");
    expect(sql).toContain("'from', 'live'");
  });

  it('keeps reconciliation service-only and derives summary state at response time', () => {
    const sql = migration();
    const lifecycleGrant = sql.slice(
      sql.indexOf(
        'revoke all on function public.event_reconcile_occurrence_lifecycle_v1()'
      ),
      sql.indexOf('commit;')
    );

    expect(sql).toContain('security definer');
    expect(sql).toContain("set search_path = ''");
    expect(lifecycleGrant).toContain('from public, anon, authenticated;');
    expect(lifecycleGrant).toContain('to service_role;');
    expect(lifecycleGrant).not.toContain('to authenticated;');
    expect(sql).toContain(
      "'occurrenceState', private.event_occurrence_state_at_v1("
    );
    expect(sql).toContain('statement_timestamp()');
  });

  it('reconciles before dispatching every valid app event command', () => {
    const source = edge();
    const reconcileCall = source.indexOf(
      'const lifecycleFailure = await reconcileOccurrenceLifecycle('
    );
    const firstDispatch = source.indexOf(
      "if (command.action === 'get_event_summary')"
    );

    expect(source).toContain("'event_reconcile_occurrence_lifecycle_v1'");
    expect(source).toContain("'EVENT_LIFECYCLE_UNCONFIRMED'");
    expect(reconcileCall).toBeGreaterThan(-1);
    expect(firstDispatch).toBeGreaterThan(reconcileCall);
  });
});
