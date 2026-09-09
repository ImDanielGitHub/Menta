import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('event organiser review contract', () => {
  const migration = () =>
    read(
      'supabase/migrations/20260804230452_20260805210000_event_organiser_review_queue.sql'
    );
  const edge = () => read('supabase/functions/event-participation/index.ts');

  it('keeps the queue self-scoped to auth.uid with least-privilege grants', () => {
    const sql = migration();

    expect(sql).toContain('v_actor_id uuid := auth.uid()');
    expect(sql).toContain('v_event.organiser_id is distinct from v_actor_id');
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain(
      'grant execute on function public.event_get_organiser_review_queue_v1(uuid)\n  to authenticated;'
    );
    expect(sql).toContain(
      'revoke all on function public.event_get_organiser_review_queue_v1(uuid)'
    );
    expect(sql).not.toContain('p_actor_id uuid');
    expect(sql).not.toContain("'mediaPath'");
    expect(sql).not.toContain("'email'");
  });

  it('preserves the caller JWT to the self-scoped queue RPC', () => {
    const source = edge();
    const queueBranch = source.slice(
      source.indexOf("if (command.action === 'get_organiser_review_queue')"),
      source.indexOf(
        'const requestHash = await hashCommandForActor',
        source.indexOf("if (command.action === 'get_organiser_review_queue')")
      )
    );

    expect(source).toContain('context.userClient.rpc(rpc, args)');
    expect(queueBranch).toContain("'event_get_organiser_review_queue_v1'");
    expect(queueBranch).toContain('p_occurrence_id: command.occurrenceId');
    expect(queueBranch).not.toContain('p_actor_id: context.user.id');
    expect(source).toContain('createSignedUrls(paths, 60)');
    expect(source).toContain('mediaPreviewUrl');
    expect(source).toContain('parsedPath.ownerId !== row.user_id');
  });
});
