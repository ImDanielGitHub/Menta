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

type GenerateGroupInviteBody = {
  groupId?: string;
  replace?: boolean;
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

    const body = await readJsonBody<GenerateGroupInviteBody>(req);
    const groupId = body?.groupId?.trim();
    const shouldReplace = body?.replace === true;

    if (!groupId) {
      return jsonResponse({ error: 'groupId is required' }, 400);
    }

    const { data: group, error: groupError } = await context.userClient
      .from('teams')
      .select('id, owner_id')
      .eq('id', groupId)
      .maybeSingle();

    if (groupError || !group) {
      return jsonResponse({ error: 'Group not found' }, 404);
    }

    let isAuthorised = group.owner_id === context.user.id;
    if (!isAuthorised) {
      const { data: membership } = await context.userClient
        .from('team_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', context.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      isAuthorised = Boolean(membership);
    }

    if (!isAuthorised) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const { data: existing, error: existingError } = await context.serviceClient
      .from('invite_codes')
      .select('code, expires_at')
      .eq('type', 'group')
      .eq('ref_id', groupId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('[generate-group-invite] read failed:', existingError);
      return jsonResponse({ error: 'Could not read the active invite' }, 500);
    }

    if (existing?.code && !shouldReplace) {
      return jsonResponse({
        success: true,
        code: existing.code,
        replaced: false,
        previous_code_invalidated: false,
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
          type: 'group',
          ref_id: groupId,
          created_by: context.user.id,
          expires_at: inviteExpiryIso(),
        });

      if (!insertError) {
        inserted = true;
        break;
      }

      if (insertError.code !== '23505') {
        console.error('[generate-group-invite] insert failed:', insertError);
        return jsonResponse({ error: 'Could not create the invite' }, 500);
      }
    }

    if (!inserted) {
      return jsonResponse({ error: 'Could not create a unique invite' }, 500);
    }

    if (existing?.code && shouldReplace) {
      const { error: deleteError } = await context.serviceClient
        .from('invite_codes')
        .delete()
        .eq('type', 'group')
        .eq('ref_id', groupId)
        .neq('code', code);

      if (deleteError) {
        console.error('[generate-group-invite] cleanup failed:', deleteError);
        await context.serviceClient
          .from('invite_codes')
          .delete()
          .eq('type', 'group')
          .eq('ref_id', groupId)
          .eq('code', code);
        return jsonResponse({ error: 'Could not replace the invite' }, 500);
      }
    }

    return jsonResponse({
      success: true,
      code,
      replaced: shouldReplace,
      previous_code_invalidated: Boolean(existing?.code && shouldReplace),
    });
  } catch (error) {
    console.error('[generate-group-invite] fatal error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
