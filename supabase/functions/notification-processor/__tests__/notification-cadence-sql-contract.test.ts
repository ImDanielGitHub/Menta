import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Narrow SQL safety contract until this operational migration is exercised in
// the authorised project. This does not claim PostgreSQL execution evidence.
const sql = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260913045500_notification_queue_cadence.sql'
  ),
  'utf8'
);

describe('notification cron migration safety', () => {
  it('changes only the cadence of the two existing notification jobs', () => {
    assert.equal((sql.match(/perform cron\.alter_job/gi) ?? []).length, 2);
    assert.match(sql, /schedule := '\*\/5 \* \* \* \*'/);
    assert.match(sql, /schedule := '1-59\/5 \* \* \* \*'/);
    assert.doesNotMatch(
      sql,
      /set command|cron\.schedule\(|cron\.unschedule\(|update cron\.job|vault\./i
    );
  });
  it('fails closed on missing or duplicate jobs and preserves their database scope', () => {
    assert.equal((sql.match(/v_count <> 1/g) ?? []).length, 2);
    assert.equal(
      (sql.match(/job\.database = pg_catalog\.current_database\(\)/g) ?? [])
        .length,
      2
    );
    assert.match(sql, /begin;/);
    assert.match(sql, /commit;/);
    assert.doesNotMatch(sql, /create policy|grant |revoke |delete from/i);
  });
});
