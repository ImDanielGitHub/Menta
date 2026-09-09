import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildFunctionContext,
  jsonResponse,
  readJsonBody,
} from '../_shared/security.ts';
import {
  generateSecureInviteCode,
  inviteExpiryIso,
} from '../_shared/invite-code.ts';

type GenerateChallengeInviteBody = {
  challengeId?: string;
  forceNew?: boolean;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const context = await buildFunctionContext(req);

    if (!context.user) {
      return jsonResponse({ error: 'Not authenticated' }, 401);
    }

    const body = await readJsonBody<GenerateChallengeInviteBody>(req);
    const challengeId = body?.challengeId?.trim();
    const forceNew = body?.forceNew === true;

    if (!challengeId) {
      return jsonResponse({ error: 'challengeId is required' }, 400);
    }

    const { data: challenge, error: challengeError } = await context.userClient
      .from('challenges')
      .select('id, title, creator_id, allow_self_review')
      .eq('id', challengeId)
      .maybeSingle();

    if (challengeError || !challenge) {
      return jsonResponse({ error: 'Challenge not found' }, 404);
    }

    const isCreator = challenge.creator_id === context.user.id;

    if (challenge.allow_self_review) {
      const { data: promiseContainer, error: promiseContainerError } =
        await context.userClient
          .from('team_challenges')
          .select('group_id, teams!inner(kind, owner_id)')
          .eq('challenge_id', challengeId)
          .eq('teams.kind', 'promise')
          .eq('teams.owner_id', context.user.id)
          .limit(1)
          .maybeSingle();

      if (promiseContainerError || !promiseContainer || !isCreator) {
        return jsonResponse(
          { error: 'Solo challenges do not support invites' },
          400
        );
      }
    }

    if (!isCreator) {
      const { data: participant } = await context.userClient
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', context.user.id)
        .maybeSingle();

      if (!participant) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
    }

    const nowIso = new Date().toISOString();

    const { data: existing } = forceNew
      ? { data: null }
      : await context.serviceClient
          .from('invite_codes')
          .select('code, expires_at')
          .eq('type', 'challenge')
          .eq('ref_id', challengeId)
          .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

    if (existing?.code) {
      return jsonResponse({
        success: true,
        code: existing.code,
        challengeId,
        challengeTitle: challenge.title,
      });
    }

    let code = '';
    let inserted = false;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      code = generateSecureInviteCode();
      const { error: insertError } = await context.serviceClient
        .from('invite_codes')
        .insert({
          code,
          type: 'challenge',
          ref_id: challengeId,
          created_by: context.user.id,
          expires_at: inviteExpiryIso(),
        });

      if (!insertError) {
        inserted = true;
        break;
      }

      if (insertError.code !== '23505') {
        console.error('[generate-challenge-invite] insert error:', insertError);
        return jsonResponse({ error: 'Failed to generate invite code' }, 500);
      }
    }

    if (!inserted) {
      return jsonResponse(
        { error: 'Failed to generate unique invite code' },
        500
      );
    }

    return jsonResponse({
      success: true,
      code,
      challengeId,
      challengeTitle: challenge.title,
    });
  } catch (error) {
    console.error('[generate-challenge-invite] fatal error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
