import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useGroupStore } from '@/store/group-store';
import { useTranslation } from '@/lib/localization/use-translation';

export type GroupCooldownNotice = {
  title: string;
  message: string;
  groupName?: string;
  hoursRemaining: number;
  cooldownUntil?: string | null;
};

type UseGroupCooldownCheckOptions = {
  onCooldown?: (notice: GroupCooldownNotice) => void;
};

const buildCooldownNotice = (
  result: {
    groupName?: string;
    cooldownUntil?: string | null;
  },
  t: ReturnType<typeof useTranslation>['t']
): GroupCooldownNotice => {
  const cooldownDate = result.cooldownUntil
    ? new Date(result.cooldownUntil)
    : null;
  const hoursRemaining = cooldownDate
    ? Math.max(
        1,
        Math.ceil((cooldownDate.getTime() - Date.now()) / (1000 * 60 * 60))
      )
    : 1;
  const groupName = result.groupName || t('groups.create.last_group');

  return {
    title: t('groups.create.paused_title'),
    message: t('groups.create.cooldown_active', {
      group: groupName,
      hours: hoursRemaining,
    }),
    groupName: result.groupName,
    hoursRemaining,
    cooldownUntil: result.cooldownUntil,
  };
};

/**
 * Hook to check if user is in group creation cooldown.
 * Returns a function that checks cooldown and reports it to the owning surface.
 * @returns Promise<boolean> - true if cooldown is active, false if user can proceed
 */
export function useGroupCooldownCheck(
  options: UseGroupCooldownCheckOptions = {}
) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const checkUserCooldown = useGroupStore(state => state.checkUserCooldown);
  const { onCooldown } = options;

  const checkCooldown = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const result = await checkUserCooldown(user.id);
      if (result.inCooldown) {
        onCooldown?.(buildCooldownNotice(result, t));
        return true; // Cooldown is active
      }
      return false; // No cooldown
    } catch (error) {
      console.error('[useGroupCooldownCheck] Error checking cooldown:', error);
      return false; // Allow navigation on error (fallback to in-screen check)
    }
  }, [user?.id, checkUserCooldown, onCooldown, t]);

  return checkCooldown;
}
