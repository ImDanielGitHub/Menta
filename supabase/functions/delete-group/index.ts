import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

serve(async req => {
  try {
    const { groupId } = await req.json();

    if (!groupId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required field: groupId',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Authorization header required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');

    // Verify the token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid authorization token',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if the group exists and if the user is the owner
    const { data: group, error: groupError } = await supabase
      .from('teams')
      .select('id, name, owner_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return new Response(
        JSON.stringify({
          error: 'Group not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if the user is the owner of the group
    if (group.owner_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: 'Only the group owner can delete the group',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Start a transaction-like sequence to delete all related data
    // First, get all challenge IDs for this group
    const { data: groupChallenges, error: groupChallengesError } =
      await supabase
        .from('team_challenges')
        .select('challenge_id')
        .eq('group_id', groupId);

    if (groupChallengesError) {
      console.error('Error fetching group challenges:', groupChallengesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch group challenges',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const linkedChallengeIds =
      groupChallenges?.map(gc => gc.challenge_id) || [];
    let challengeIds: string[] = [];

    if (linkedChallengeIds.length > 0) {
      const [
        { data: ownedChallenges, error: ownedError },
        { data: otherLinks, error: linksError },
      ] = await Promise.all([
        supabase
          .from('challenges')
          .select('id')
          .eq('creator_id', user.id)
          .in('id', linkedChallengeIds),
        supabase
          .from('team_challenges')
          .select('challenge_id')
          .in('challenge_id', linkedChallengeIds)
          .neq('group_id', groupId),
      ]);

      if (ownedError || linksError) {
        console.error(
          'Error authorising linked challenges:',
          ownedError || linksError
        );
        return new Response(
          JSON.stringify({
            error: 'Failed to authorise linked challenges',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const sharedChallengeIds = new Set(
        (otherLinks || []).map(link => link.challenge_id)
      );
      challengeIds = (ownedChallenges || [])
        .map(challenge => challenge.id)
        .filter(challengeId => !sharedChallengeIds.has(challengeId));
    }

    // Delete challenge-related data for challenges in this group
    if (challengeIds.length > 0) {
      // Delete power-up usage records tied to these challenges (if any)
      const { error: powerUpUsageError } = await supabase
        .from('power_up_usage')
        .delete()
        .in('challenge_id', challengeIds);

      if (powerUpUsageError) {
        console.error(
          'Error deleting power up usage for challenges:',
          powerUpUsageError
        );
        return new Response(
          JSON.stringify({
            error: 'Failed to delete group data: power up usage',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Delete invite codes associated with these challenges
      const { error: challengeCodesError } = await supabase
        .from('invite_codes')
        .delete()
        .eq('type', 'challenge')
        .in('ref_id', challengeIds as unknown as string[]);

      if (challengeCodesError) {
        console.error(
          'Error deleting challenge invite codes:',
          challengeCodesError
        );
        return new Response(
          JSON.stringify({
            error: 'Failed to delete group data: challenge invite codes',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Delete challenge verifications for challenges in this group
      const { error: verificationsError } = await supabase
        .from('challenge_submissions')
        .delete()
        .in('challenge_id', challengeIds);

      if (verificationsError) {
        console.error(
          'Error deleting challenge verifications:',
          verificationsError
        );
        return new Response(
          JSON.stringify({
            error: 'Failed to delete group data: challenge verifications',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Delete user challenges for this group
      const { error: userChallengesError } = await supabase
        .from('challenge_participants')
        .delete()
        .in('challenge_id', challengeIds);

      if (userChallengesError) {
        console.error('Error deleting user challenges:', userChallengesError);
        return new Response(
          JSON.stringify({
            error: 'Failed to delete group data: user challenges',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Delete challenges associated with this group
      const { error: challengesError } = await supabase
        .from('challenges')
        .delete()
        .in('id', challengeIds);

      if (challengesError) {
        console.error('Error deleting challenges:', challengesError);
        return new Response(
          JSON.stringify({
            error: 'Failed to delete group data: challenges',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Delete group challenges relationships
    const { error: groupChallengesDeleteError } = await supabase
      .from('team_challenges')
      .delete()
      .eq('group_id', groupId);

    if (groupChallengesDeleteError) {
      console.error(
        'Error deleting group challenges:',
        groupChallengesDeleteError
      );
      return new Response(
        JSON.stringify({
          error: 'Failed to delete group data: group challenges',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete group invite codes
    const { error: groupCodesError } = await supabase
      .from('invite_codes')
      .delete()
      .eq('type', 'group')
      .eq('ref_id', groupId);

    if (groupCodesError) {
      console.error('Error deleting group invite codes:', groupCodesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete group data: group invite codes',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete group streak tracking data
    const { error: groupStreakError } = await supabase
      .from('group_streak_tracking')
      .delete()
      .eq('group_id', groupId);

    if (groupStreakError) {
      console.error('Error deleting group streak tracking:', groupStreakError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete group data: streak tracking',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete group members
    const { error: membersError } = await supabase
      .from('team_members')
      .delete()
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error deleting group members:', membersError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete group data: members',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Finally, delete the group itself
    const { error: groupDeleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', groupId);

    if (groupDeleteError) {
      console.error('Error deleting group:', groupDeleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete group',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Group "${group.name}" has been deleted successfully`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Delete group error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
