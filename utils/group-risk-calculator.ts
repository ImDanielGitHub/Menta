export interface GroupRiskLevel {
  level: 'safe' | 'at_risk' | 'critical' | 'failed' | 'expired';
  daysUntilFailure: number;
  currentParticipationRate: number;
  requiredParticipationRate: number;
  missedDaysCount: number;
  warningMessage?: string;
  actionRequired?: string;
}

export interface GroupWithRisk {
  id: string;
  name: string;
  current_streak: number;
  status: 'active' | 'failed' | 'expired';
  failure_threshold_days: number;
  min_participation_rate: number;
  last_success_date?: string;
  last_failure_date?: string;
  end_date?: string;
  allow_recovery: boolean;
  riskLevel?: GroupRiskLevel;
  description?: string;
  member_count?: number;
  members_count?: number;
  privacy?: 'public' | 'private' | 'secret' | string;
  challenge_count?: number;
  active_challenges_count?: number;
  participation_rate?: number;
}

/**
 * Calculate the risk level for a group based on participation and streak data
 */
export function calculateGroupRiskLevel(
  group: Omit<GroupWithRisk, 'riskLevel'>,
  todayParticipationRate: number = 0,
  consecutiveMissedDays: number = 0
): GroupRiskLevel {
  const {
    status,
    failure_threshold_days = 3,
    min_participation_rate = 0.8,
    end_date,
  } = group;

  // Handle expired groups
  if (end_date && new Date(end_date) < new Date()) {
    return {
      level: 'expired',
      daysUntilFailure: 0,
      currentParticipationRate: todayParticipationRate,
      requiredParticipationRate: min_participation_rate,
      missedDaysCount: consecutiveMissedDays,
      warningMessage: 'This group has completed its duration',
      actionRequired: 'View final stats and achievements',
    };
  }

  // Handle already failed groups
  if (status === 'failed') {
    return {
      level: 'failed',
      daysUntilFailure: 0,
      currentParticipationRate: todayParticipationRate,
      requiredParticipationRate: min_participation_rate,
      missedDaysCount: consecutiveMissedDays,
      warningMessage: 'This group has failed due to low participation',
      actionRequired: 'Contact admin for restoration options',
    };
  }

  // Calculate days until potential failure
  const daysUntilFailure = Math.max(0, failure_threshold_days - consecutiveMissedDays);
  
  // Determine risk level based on consecutive missed days
  let level: GroupRiskLevel['level'] = 'safe';
  let warningMessage = '';
  let actionRequired = '';

  if (consecutiveMissedDays >= failure_threshold_days) {
    level = 'failed';
    warningMessage = 'Group has failed due to insufficient participation';
    actionRequired = 'Group is now read-only. Restoration may be available';
  } else if (consecutiveMissedDays === failure_threshold_days - 1) {
    level = 'critical';
    warningMessage = `Critical: Group will fail in ${daysUntilFailure} day if participation doesn't improve`;
    actionRequired = 'Submit today or risk group failure!';
  } else if (consecutiveMissedDays >= 1) {
    level = 'at_risk';
    warningMessage = `Warning: ${daysUntilFailure} days remaining before group failure`;
    actionRequired = 'Encourage members to submit daily';
  } else if (todayParticipationRate < min_participation_rate && todayParticipationRate > 0) {
    level = 'at_risk';
    warningMessage = `Today's participation (${Math.round(todayParticipationRate * 100)}%) is below target (${Math.round(min_participation_rate * 100)}%)`;
    actionRequired = 'More members need to submit today';
  }

  return {
    level,
    daysUntilFailure,
    currentParticipationRate: todayParticipationRate,
    requiredParticipationRate: min_participation_rate,
    missedDaysCount: consecutiveMissedDays,
    warningMessage: warningMessage || undefined,
    actionRequired: actionRequired || undefined,
  };
}

/**
 * Get the appropriate icon and color for a risk level - optimized for black/white theme
 * Uses theme-based colors instead of hardcoded values for better consistency and accessibility
 */
export function getRiskLevelStyling(level: GroupRiskLevel['level']) {
  switch (level) {
    case 'safe':
      return {
        icon: 'flame' as const,
        color: '#737373', // Medium gray for icon (theme-compatible)
        backgroundColor: '#262626', // Dark surface from theme
        borderColor: '#525252', // Medium gray border from theme
        accentColor: '#d4d4d4', // Light gray accent for subtle success indication
      };
    case 'at_risk':
      return {
        icon: 'alert-triangle' as const,
        color: '#a3a3a3', // Light gray for warning visibility on dark background
        backgroundColor: '#404040', // Medium dark surface from theme
        borderColor: '#737373', // Medium gray border for warning
        accentColor: '#a3a3a3', // Light gray accent for warning
      };
    case 'critical':
      return {
        icon: 'alert-circle' as const,
        color: '#d4d4d4', // Light gray for high contrast on dark background
        backgroundColor: '#525252', // Medium gray surface for critical state
        borderColor: '#a3a3a3', // Light gray border for danger indication
        accentColor: '#d4d4d4', // Light gray accent for critical state
      };
    case 'failed':
      return {
        icon: 'x-circle' as const,
        color: '#a3a3a3', // Light gray for readability on dark background
        backgroundColor: '#404040', // Dark surface for failed state
        borderColor: '#737373', // Medium gray border for contrast
        accentColor: '#a3a3a3', // Light gray accent for failed text
      };
    case 'expired':
      return {
        icon: 'check-circle' as const,
        color: '#a3a3a3', // Light gray for readability
        backgroundColor: '#333333', // Medium dark surface
        borderColor: '#666666', // Medium gray border for visibility
        accentColor: '#a3a3a3', // Light gray accent for completed state
      };
    default:
      return {
        icon: 'help-circle' as const,
        color: '#a3a3a3', // Light gray for unknown states
        backgroundColor: '#404040', // Default dark surface
        borderColor: '#737373', // Default medium gray border
        accentColor: '#a3a3a3', // Default light gray accent
      };
  }
}

/**
 * Determine if a group should be accessible for new activities
 */
export function isGroupAccessible(group: GroupWithRisk): boolean {
  if (!group.riskLevel) return true;
  
  // Failed groups are read-only
  if (group.riskLevel.level === 'failed') return false;
  
  // Expired groups are read-only  
  if (group.riskLevel.level === 'expired') return false;
  
  // All other states allow access
  return true;
}

/**
 * Get user-friendly status text for group cards - minimal black/white theme
 */
export function getGroupStatusText(riskLevel: GroupRiskLevel): string {
  switch (riskLevel.level) {
    case 'safe':
      return riskLevel.currentParticipationRate > 0 ? 
        `${Math.round(riskLevel.currentParticipationRate * 100)}% active today` : 
        'On track';
    case 'at_risk':
      return `${riskLevel.daysUntilFailure} days to improve`;
    case 'critical':
      return `Critical - ${riskLevel.daysUntilFailure} day left`;
    case 'failed':
      return 'Failed';
    case 'expired':
      return 'Completed';
    default:
      return 'Unknown';
  }
} 