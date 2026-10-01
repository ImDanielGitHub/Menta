import type { MascotState } from '@/components/ui/MentaMascot';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import type {
  MentaCheckReason,
  MentaCheckTip,
  MentaTodayItem,
} from '@/lib/menta-check/types';

type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

/** After this many "not yets" in a day, Menta stops asking and offers a way out. */
export const MENTA_NOT_YET_LIMIT = 2;

export type MentaSpeech = {
  mascot: MascotState;
  title: string;
  detail: string;
};

const tipLine = (tip: MentaCheckTip | null, t: Translate): string => {
  switch (tip) {
    case 'show_display':
      return t('mentaCheck.tip.show_display');
    case 'get_closer':
      return t('mentaCheck.tip.get_closer');
    case 'more_light':
      return t('mentaCheck.tip.more_light');
    case 'show_whole_activity':
      return t('mentaCheck.tip.show_whole_activity');
    case 'add_detail':
      return t('mentaCheck.tip.add_detail');
    case 'video_counted':
      return t('mentaCheck.tip.video_counted');
    default:
      return '';
  }
};

const reasonLine = (
  reason: MentaCheckReason | null,
  proofKind: 'photo' | 'video' | 'text',
  rule: string,
  t: Translate
): string => {
  if (proofKind === 'text') return t('mentaCheck.notYet.note', { rule });
  switch (reason) {
    case 'shows_something_else':
      return t('mentaCheck.notYet.shows_something_else', { rule });
    case 'too_unclear':
      return t('mentaCheck.notYet.too_unclear');
    case 'old_photo':
      return t('mentaCheck.notYet.old_photo');
    case 'screenshot':
      return t('mentaCheck.notYet.screenshot');
    case 'duplicate':
      return t('mentaCheck.notYet.duplicate');
    default:
      return t('mentaCheck.notYet.cant_see_rule', { rule });
  }
};

/** Menta's bubble for one Today state. Every line is fixed catalogue copy. */
export function mentaSpeechFor(
  item: Pick<
    MentaTodayItem,
    | 'state'
    | 'rule'
    | 'reason'
    | 'tip'
    | 'proofKind'
    | 'notYetsToday'
    | 'mediaType'
  >,
  t: Translate
): MentaSpeech | null {
  const rule = item.rule;
  const kind = item.mediaType ?? item.proofKind;
  switch (item.state) {
    case 'checking':
      return {
        mascot: 'menta-check',
        title: t('mentaCheck.today.checkingTitle'),
        detail: t('mentaCheck.today.checkingDetail', { rule }),
      };
    case 'slow':
      return {
        mascot: 'today-review-wait',
        title: t('mentaCheck.today.slowTitle'),
        detail: t('mentaCheck.today.slowDetail'),
      };
    case 'counted':
      return {
        mascot: 'today-accepted',
        title: t('mentaCheck.today.countedTitle'),
        detail: t('mentaCheck.today.countedDetail', { rule }),
      };
    case 'counted_tip':
      return {
        mascot: 'today-clear',
        title: t('mentaCheck.today.countedTipTitle'),
        detail: tipLine(item.tip, t),
      };
    case 'not_yet':
      if (item.notYetsToday >= MENTA_NOT_YET_LIMIT) {
        return {
          mascot: 'calm-warning',
          title: t('mentaCheck.today.wayOutTitle'),
          detail: t('mentaCheck.today.wayOutDetail'),
        };
      }
      return {
        mascot: 'today-correction',
        title: t('mentaCheck.today.notYetTitle'),
        detail: reasonLine(item.reason, kind, rule, t),
      };
    case 'counted_by_you':
      return {
        mascot: 'promise-confirmed',
        title: t('mentaCheck.today.countedByYouTitle'),
        detail: t('mentaCheck.today.countedByYouDetail'),
      };
    case 'backup_counted':
      return {
        mascot: 'today-accepted',
        title: t('mentaCheck.today.backupTitle'),
        detail: t('mentaCheck.today.backupDetail', { rule }),
      };
    case 'unavailable':
      return {
        mascot: 'today-clear',
        title: t('mentaCheck.today.unavailableTitle'),
        detail: t('mentaCheck.today.unavailableDetail'),
      };
    case 'access_ended':
      return {
        mascot: 'today-accepted',
        title: t('mentaCheck.today.accessEndedTitle'),
        detail: t('mentaCheck.today.accessEndedDetail'),
      };
    default:
      return null;
  }
}

/** The short status beside the proof thumbnail. */
export function mentaStatusFor(
  item: Pick<MentaTodayItem, 'state' | 'reason' | 'backupHours'>,
  t: Translate
): {
  label: string;
  detail: string | null;
  tone: 'action' | 'success' | 'warning';
} | null {
  switch (item.state) {
    case 'checking':
      return {
        label: t('mentaCheck.status.checking'),
        detail: null,
        tone: 'action',
      };
    case 'slow':
      return {
        label: t('mentaCheck.status.stillChecking'),
        detail: null,
        tone: 'action',
      };
    case 'counted':
    case 'counted_tip':
    case 'unavailable':
      return {
        label: t('mentaCheck.status.counted'),
        detail: null,
        tone: 'success',
      };
    case 'counted_by_you':
      return {
        label: t('mentaCheck.status.countedByYou'),
        detail: null,
        tone: 'success',
      };
    case 'backup_counted':
      return {
        label: t('mentaCheck.status.countedByMenta'),
        detail: item.backupHours
          ? t('mentaCheck.status.afterHours', { hours: item.backupHours })
          : null,
        tone: 'success',
      };
    case 'access_ended':
      return {
        label: t('mentaCheck.status.counted'),
        detail: null,
        tone: 'success',
      };
    case 'not_yet':
      return {
        label: t('mentaCheck.status.notYet'),
        detail: reasonStatus(item.reason, t),
        tone: 'warning',
      };
    default:
      return null;
  }
}

const reasonStatus = (
  reason: MentaCheckReason | null,
  t: Translate
): string => {
  switch (reason) {
    case 'shows_something_else':
      return t('mentaCheck.status.looksDifferent');
    case 'too_unclear':
      return t('mentaCheck.status.tooUnclear');
    case 'old_photo':
      return t('mentaCheck.status.oldPhoto');
    case 'screenshot':
      return t('mentaCheck.status.screenshot');
    case 'duplicate':
      return t('mentaCheck.status.seenBefore');
    default:
      return t('mentaCheck.status.cantSeeIt');
  }
};

/** Today states Menta Check owns. Everything else keeps the normal Today card. */
export const isMentaTodayState = (
  item: MentaTodayItem | null | undefined
): boolean =>
  Boolean(
    item &&
    [
      'checking',
      'slow',
      'counted',
      'counted_tip',
      'not_yet',
      'counted_by_you',
      'backup_counted',
      'unavailable',
      'access_ended',
    ].includes(item.state)
  );
