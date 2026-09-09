import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

type JsonResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

serve(async (req) => {
  try {
    const { challengeId } = await req.json();

    if (!challengeId) {
      return new Response(JSON.stringify({
        error: 'Missing required field: challengeId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Authorization header required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid authorization token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, creator_id')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return new Response(JSON.stringify({
        error: 'Challenge not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (challenge.creator_id !== user.id) {
      return new Response(JSON.stringify({
        error: 'Only the challenge creator can delete this challenge'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deletions: Array<Promise<{ error: any }>> = [
      supabase.from('challenge_submissions').delete().eq('challenge_id', challengeId),
      supabase.from('challenge_participants').delete().eq('challenge_id', challengeId),
      supabase.from('team_challenges').delete().eq('challenge_id', challengeId),
      supabase.from('power_up_usage').delete().eq('challenge_id', challengeId),
      supabase.from('invite_codes').delete().eq('type', 'challenge').eq('ref_id', challengeId),
    ];

    const deletionTargets = [
      'challenge verifications',
      'user challenges',
      'group challenge links',
      'power up usage',
      'challenge invite codes'
    ];

    for (let i = 0; i < deletions.length; i++) {
      const { error } = await deletions[i];
      if (error) {
        console.error(`Error deleting ${deletionTargets[i]} for challenge ${challengeId}:`, error);
        return new Response(JSON.stringify({
          error: `Failed to delete related challenge data: ${deletionTargets[i]}`
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const { error: challengeDeleteError } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    if (challengeDeleteError) {
      console.error('Error deleting challenge:', challengeDeleteError);
      return new Response(JSON.stringify({
        error: 'Failed to delete challenge'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response: JsonResponse = {
      success: true,
      message: `Challenge "${challenge.title}" has been deleted successfully`
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete challenge error:', error);
    return new Response(JSON.stringify({
      error: error?.message ?? 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
