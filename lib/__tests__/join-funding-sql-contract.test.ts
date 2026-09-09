import fs from 'fs';
import path from 'path';

const migration = (): string =>
  fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260806120000_challenge_join_funding_v1.sql'
    ),
    'utf8'
  );

describe('challenge join funding SQL contract', () => {
  it('owns actor and cost on the server', () => {
    const source = migration();
    expect(source).toContain('v_actor_id uuid := auth.uid()');
    expect(source).toContain("where config.key = 'challenge_join_cost_v1'");
    expect(source).not.toMatch(
      /join_challenge_with_funding_v1\([\s\S]*p_user_id/
    );
    expect(source).not.toMatch(/join_challenge_with_funding_v1\([\s\S]*p_cost/);
  });

  it('serialises both request replay and distinct requests for one membership', () => {
    const source = migration();
    expect(source).toContain("'challenge-join-event:'");
    expect(source).toContain("'challenge-join-target:'");
    expect(
      source.match(/resolve_challenge_join_target_v1\(/g)?.length
    ).toBeGreaterThanOrEqual(3);
    expect(source).toContain('if v_target.is_member then');
  });

  it('keeps debit, participant, wallet row, and receipt in one RPC transaction', () => {
    const source = migration();
    const debit = source.indexOf('update public.profiles profile');
    const participant = source.indexOf(
      'insert into public.challenge_participants'
    );
    const wallet = source.indexOf('insert into public.wallet_transactions');
    const receipt = source.indexOf("'code', 'JOIN_CONFIRMED'");
    expect(debit).toBeGreaterThan(0);
    expect(participant).toBeGreaterThan(debit);
    expect(wallet).toBeGreaterThan(participant);
    expect(receipt).toBeGreaterThan(wallet);
  });

  it('exposes only authenticated quote, mutation, and self-readback RPCs', () => {
    const source = migration();
    expect(source).toContain('public.quote_challenge_join_v1');
    expect(source).toContain('public.join_challenge_with_funding_v1');
    expect(source).toContain('public.read_challenge_join_status_v1');
    expect(source).toMatch(
      /revoke all on function public\.join_challenge_with_funding_v1/
    );
    expect(source).toMatch(
      /grant execute on function public\.join_challenge_with_funding_v1[\s\S]*to authenticated/
    );
    expect(source).toContain("'code', 'NO_RECEIPT'");
  });
});
