import { supabase } from '@/lib/supabase';
import { resolveFreezesRemaining } from '@/lib/streak/freezes-remaining';
import {
  translate as resolveCopy,
  type TranslationKey,
} from '@/lib/localization';

const streakDebugLog = (..._args: unknown[]) => {
  void _args;
};

const streakMessage = (
  locale: string,
  key: TranslationKey,
  values: Record<string, string | number> = {}
): string => resolveCopy(locale, key, values);

interface StreakCheckResult {
  shouldUseFreeze: boolean;
  freezesRemaining: number;
  streakMaintained: boolean;
  message: string;
  daysGap?: number;
}

export interface MilestoneResult {
  reached: boolean;
  milestone: number;
  reward: number;
}

/**
 * Manages streak protection, milestones, and perfect week tracking
 * Based on Duolingo's proven habit-building mechanics
 */
export class StreakManager {
  /**
   * Check if user missed submission and apply freeze if available
   * This is the core streak protection logic
   */
  static async checkAndApplyFreeze(
    userId: string,
    challengeId: string,
    locale = 'en-NZ'
  ): Promise<StreakCheckResult> {
    try {
      // Get user challenge data
      const { data: uc, error: ucError } = await supabase
        .from('challenge_participants')
        .select('current_streak, streak_freezes_remaining, last_check_in')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (ucError) {
        console.error(
          '[StreakManager] Error fetching user challenge:',
          ucError
        );
        throw ucError;
      }

      if (!uc) {
        return {
          shouldUseFreeze: false,
          freezesRemaining: 0,
          streakMaintained: false,
          message: streakMessage(
            locale,
            'todayProof.streak.challenge_not_found'
          ),
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const lastCheckIn = uc.last_check_in ? new Date(uc.last_check_in) : null;

      if (lastCheckIn) {
        lastCheckIn.setHours(0, 0, 0, 0);
      }

      const lastCheckInStr = lastCheckIn
        ? lastCheckIn.toISOString().split('T')[0]
        : null;

      // Check if user already checked in today
      if (lastCheckInStr === todayStr) {
        return {
          shouldUseFreeze: false,
          freezesRemaining: resolveFreezesRemaining(
            uc.streak_freezes_remaining
          ),
          streakMaintained: true,
          message: streakMessage(
            locale,
            'todayProof.streak.already_checked_in'
          ),
        };
      }

      // Calculate if user missed yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // User is within grace period (checked in yesterday or today)
      if (lastCheckInStr === yesterdayStr) {
        return {
          shouldUseFreeze: false,
          freezesRemaining: resolveFreezesRemaining(
            uc.streak_freezes_remaining
          ),
          streakMaintained: true,
          message: streakMessage(
            locale,
            'todayProof.streak.within_grace_period'
          ),
        };
      }

      // Calculate days gap
      let daysGap = 0;
      if (lastCheckIn) {
        daysGap = Math.floor(
          (today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      // User missed yesterday (or more days) - need to apply freeze
      if (daysGap >= 2) {
        const freezesRemaining = resolveFreezesRemaining(
          uc.streak_freezes_remaining
        );

        if (freezesRemaining > 0) {
          // Apply freeze
          const { error: updateError } = await supabase
            .from('challenge_participants')
            .update({
              streak_freezes_remaining: freezesRemaining - 1,
              last_freeze_used: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('challenge_id', challengeId);

          if (updateError) {
            console.error(
              '[StreakManager] Error applying freeze:',
              updateError
            );
            throw updateError;
          }

          // Log freeze usage
          await supabase.from('streak_freeze_log').insert({
            user_id: userId,
            challenge_id: challengeId,
            freeze_type: 'auto',
            days_saved: 1,
          });

          streakDebugLog(
            `[StreakManager] Freeze applied for user ${userId}, challenge ${challengeId}`
          );

          return {
            shouldUseFreeze: true,
            freezesRemaining: freezesRemaining - 1,
            streakMaintained: true,
            message: streakMessage(locale, 'todayProof.streak.freeze_used', {
              count: freezesRemaining - 1,
            }),
            daysGap,
          };
        } else {
          // No freezes available - streak will reset
          streakDebugLog(
            `[StreakManager] No freezes available for user ${userId}, streak will reset`
          );

          return {
            shouldUseFreeze: false,
            freezesRemaining: 0,
            streakMaintained: false,
            message: streakMessage(locale, 'todayProof.streak.no_freezes'),
            daysGap,
          };
        }
      }

      // Edge case: last check in was null or very old
      return {
        shouldUseFreeze: false,
        freezesRemaining: resolveFreezesRemaining(uc.streak_freezes_remaining),
        streakMaintained: false,
        message: streakMessage(locale, 'todayProof.streak.no_recent_checkin'),
        daysGap,
      };
    } catch (error) {
      console.error('[StreakManager] Error in checkAndApplyFreeze:', error);
      return {
        shouldUseFreeze: false,
        freezesRemaining: 0,
        streakMaintained: false,
        message: streakMessage(locale, 'todayProof.streak.check_error'),
      };
    }
  }

  /**
   * Calculate if current week is "perfect" (no freezes used)
   * Returns days completed this week and perfect status
   */
  static async calculatePerfectWeek(
    userId: string,
    challengeId: string
  ): Promise<{ isPerfect: boolean; daysThisWeek: number }> {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get submissions this week
      const { data: submissions, error: subError } = await supabase
        .from('challenge_submissions')
        .select('submission_date')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .gte('submission_date', startOfWeek.toISOString())
        .order('submission_date', { ascending: false });

      if (subError) {
        console.error(
          '[StreakManager] Error calculating perfect week:',
          subError
        );
        return { isPerfect: false, daysThisWeek: 0 };
      }

      // Get unique days
      const uniqueDays = new Set(
        (submissions || []).map(
          v => new Date(v.submission_date).toISOString().split('T')[0]
        )
      );

      const daysThisWeek = uniqueDays.size;

      // Check if any freezes were used this week
      const { data: freezeLog, error: freezeError } = await supabase
        .from('streak_freeze_log')
        .select('used_at')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .gte('used_at', startOfWeek.toISOString());

      if (freezeError) {
        console.error(
          '[StreakManager] Error checking freeze log:',
          freezeError
        );
      }

      const usedFreezeThisWeek = (freezeLog || []).length > 0;

      // Perfect if submitted every day so far this week AND no freezes used
      const daysSinceStartOfWeek =
        Math.floor(
          (Date.now() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      const isPerfect =
        daysThisWeek === Math.min(daysSinceStartOfWeek, 7) &&
        !usedFreezeThisWeek;

      return { isPerfect, daysThisWeek };
    } catch (error) {
      console.error('[StreakManager] Error in calculatePerfectWeek:', error);
      return { isPerfect: false, daysThisWeek: 0 };
    }
  }

  /**
   * Check for and award streak milestones
   * Returns milestone data if one was reached
   */
  static async checkMilestone(
    userId: string,
    challengeId: string,
    currentStreak: number
  ): Promise<MilestoneResult | null> {
    try {
      const MILESTONES = [
        { days: 3, reward: 25 }, // Early win
        { days: 7, reward: 50 }, // Week
        { days: 14, reward: 100 }, // Two weeks
        { days: 30, reward: 250 }, // Month
        { days: 50, reward: 500 }, // 50 days
        { days: 100, reward: 1000 }, // Century
      ];

      // Get last milestone reached
      const { data: uc, error: ucError } = await supabase
        .from('challenge_participants')
        .select('milestone_reached')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (ucError) {
        console.error('[StreakManager] Error fetching milestone:', ucError);
        return null;
      }

      const lastMilestone = uc?.milestone_reached ?? 0;

      // Find next milestone
      const nextMilestone = MILESTONES.find(
        m => m.days > lastMilestone && currentStreak >= m.days
      );

      if (nextMilestone) {
        streakDebugLog(
          `[StreakManager] Milestone reached: ${nextMilestone.days} days for user ${userId}`
        );

        // Update milestone_reached
        await supabase
          .from('challenge_participants')
          .update({ milestone_reached: nextMilestone.days })
          .eq('user_id', userId)
          .eq('challenge_id', challengeId);

        // Award momenta coins
        const { error: momentaError } = await supabase.rpc('add_user_momenta', {
          p_user_id: userId,
          p_amount: nextMilestone.reward,
          p_reason: `${nextMilestone.days}-day streak milestone`,
        });

        if (momentaError) {
          console.error(
            '[StreakManager] Error awarding momenta:',
            momentaError
          );
        }

        return {
          reached: true,
          milestone: nextMilestone.days,
          reward: nextMilestone.reward,
        };
      }

      return null;
    } catch (error) {
      console.error('[StreakManager] Error in checkMilestone:', error);
      return null;
    }
  }

  /**
   * Get comprehensive streak status for a user challenge
   * Returns all relevant streak information
   */
  static async getStreakStatus(
    userId: string,
    challengeId: string
  ): Promise<{
    currentStreak: number;
    freezesRemaining: number;
    lastCheckIn: string | null;
    isPerfectWeek: boolean;
    daysThisWeek: number;
    needsFreeze: boolean;
    milestoneReached: number;
  } | null> {
    try {
      const { data: uc, error } = await supabase
        .from('challenge_participants')
        .select(
          'current_streak, streak_freezes_remaining, last_check_in, milestone_reached'
        )
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (error || !uc) {
        console.error('[StreakManager] Error fetching streak status:', error);
        return null;
      }

      // Check perfect week
      const { isPerfect, daysThisWeek } = await this.calculatePerfectWeek(
        userId,
        challengeId
      );

      // Check if freeze needed
      const freezeCheck = await this.checkAndApplyFreeze(userId, challengeId);

      return {
        currentStreak: uc.current_streak ?? 0,
        freezesRemaining: resolveFreezesRemaining(uc.streak_freezes_remaining),
        lastCheckIn: uc.last_check_in,
        isPerfectWeek: isPerfect,
        daysThisWeek,
        needsFreeze:
          !freezeCheck.streakMaintained && freezeCheck.freezesRemaining === 0,
        milestoneReached: uc.milestone_reached ?? 0,
      };
    } catch (error) {
      console.error('[StreakManager] Error in getStreakStatus:', error);
      return null;
    }
  }
}
