import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildFunctionContext,
  jsonResponse,
  readJsonBody,
} from '../_shared/security.ts';

type ConsumeJoinCodeBody = {
  code?: string;
  type?: 'group' | 'challenge';
  cost?: number;
};

function isLikelyInviteCode(value: string): boolean {
  return /^[A-Z0-9]{4,32}$/.test(value);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method not allowed',
      },
      405
    );
  }

  try {
    const context = await buildFunctionContext(req);

    if (!context.user) {
      return jsonResponse(
        {
          success: false,
          code: 'NOT_AUTHENTICATED',
          error: 'Not authenticated',
        },
        401
      );
    }

    const body = await readJsonBody<ConsumeJoinCodeBody>(req);
    const normalizedCode = body?.code?.trim().toUpperCase();

    if (!normalizedCode || !isLikelyInviteCode(normalizedCode)) {
      return jsonResponse({
        success: false,
        code: 'INVALID_CODE',
        error: 'Invalid invite code',
      });
    }

    const requestedType = body?.type;
    // This is consent to the displayed quote, never pricing authority.
    // Postgres recomputes the cost under the shared account join lock.
    const joinGroupCost =
      typeof body.cost === 'number' &&
      Number.isInteger(body.cost) &&
      body.cost >= 0
        ? body.cost
        : null;

    const { data: joinCode, error: joinCodeError } = await context.serviceClient
      .from('invite_codes')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (joinCodeError || !joinCode) {
      return jsonResponse({
        success: false,
        code: 'INVALID_CODE',
        error: 'Invalid invite code',
      });
    }

    if (joinCode.expires_at && new Date(joinCode.expires_at) < new Date()) {
      return jsonResponse({
        success: false,
        code: 'EXPIRED_CODE',
        error: 'Invite code has expired',
      });
    }

    if (requestedType && requestedType !== joinCode.type) {
      return jsonResponse({
        success: false,
        code: 'INVALID_CODE',
        error: 'Invite code does not match requested type',
      });
    }

    if (joinCode.type === 'group') {
      if (joinGroupCost === null) {
        return jsonResponse({
          success: false,
          code: 'QUOTE_STALE',
          error: 'Review the current join cost before joining.',
        });
      }
      const { data: rpcResult, error: rpcError } =
        await context.serviceClient.rpc('join_group_with_payment', {
          p_user_id: context.user.id,
          p_invite_code: normalizedCode,
          p_cost: joinGroupCost,
        });

      if (rpcError) {
        console.error(
          '[consume-join-code] join_group_with_payment error:',
          rpcError
        );
        return jsonResponse({
          success: false,
          code: 'JOIN_FAILED',
          error: 'Failed to join group',
        });
      }

      if (!rpcResult || rpcResult.success !== true) {
        return jsonResponse({
          success: false,
          code: rpcResult?.error || 'JOIN_FAILED',
          error: rpcResult?.error || 'Failed to join group',
          group_name: rpcResult?.group_name ?? null,
          group_id: rpcResult?.group_id ?? null,
        });
      }

      const groupId = rpcResult.group_id || joinCode.ref_id;
      const { data: group } = await context.serviceClient
        .from('teams')
        .select(
          'id, name, description, status, owner_id, duration_days, privacy, current_streak, created_at'
        )
        .eq('id', groupId)
        .maybeSingle();

      return jsonResponse({
        success: true,
        type: 'group',
        group,
        group_id: groupId,
        group_name: group?.name || rpcResult.group_name || 'Group',
        cost:
          typeof rpcResult.cost === 'number' &&
          Number.isInteger(rpcResult.cost) &&
          rpcResult.cost >= 0
            ? rpcResult.cost
            : null,
      });
    }

    const { data: joinResult, error: joinError } = await context.userClient.rpc(
      'join_challenge_with_invite_v1',
      { p_invite_code: normalizedCode }
    );

    if (joinError) {
      console.error('[consume-join-code] challenge join RPC error:', joinError);
      return jsonResponse({
        success: false,
        code: 'JOIN_FAILED',
        error: 'Failed to join challenge',
      });
    }
    if (!joinResult || joinResult.success !== true) {
      const code = joinResult?.error || 'JOIN_FAILED';
      return jsonResponse({ success: false, code, error: code });
    }

    const challengeId = joinResult.challenge_id || joinCode.ref_id;
    const { data: challenge, error: challengeError } =
      await context.serviceClient
        .from('challenges')
        .select(
          'id, title, description, creator_id, allow_self_review, status, completion_status'
        )
        .eq('id', challengeId)
        .maybeSingle();

    if (challengeError || !challenge) {
      return jsonResponse({
        success: false,
        code: 'CHALLENGE_NOT_FOUND',
        error: 'Challenge not found',
      });
    }

    return jsonResponse({
      success: true,
      type: 'challenge',
      challenge,
      challenge_id: challengeId,
      challenge_title: challenge.title,
      group_id: joinResult.group_id ?? null,
      group_join_cost: joinResult.group_join_cost ?? 0,
    });
  } catch (error) {
    console.error('[consume-join-code] fatal error:', error);
    return jsonResponse(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Internal server error',
      },
      500
    );
  }
});
