import { translate, type TranslationKey } from '@/lib/localization';

type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

export type CreateReminderPreferenceWriter = (
  userId: string,
  enabled: boolean
) => Promise<void>;

export type CreateReminderPreferenceReader = (
  userId: string
) => Promise<boolean | null | undefined>;

const defaultTranslate: Translate = (key, values) =>
  translate('en-NZ', key, values);

/** Reminders are an account preference, not a per-promise toggle. */
export const getCreateReminderEducationCopy = (
  t: Translate = defaultTranslate
) => ({
  title: t('todayProof.promise.reminder_question'),
  description: t('todayProof.promise.reminder_detail'),
  switchTitle: t('todayProof.promise.remind_about'),
  switchDetail: t('todayProof.promise.remind_detail'),
  continueLabel: t('todayProof.promise.set_reminders'),
  skipLabel: t('todayProof.promise.without_reminders'),
});

export const resolveCreateReminderEnabled = (
  saved: boolean | null | undefined
): boolean => saved !== false;

export async function loadCreateReminderPreference(
  userId: string | null | undefined,
  reader: CreateReminderPreferenceReader
): Promise<boolean> {
  if (!userId) return true;
  return resolveCreateReminderEnabled(await reader(userId));
}

export async function persistCreateReminderPreference(
  userId: string | null | undefined,
  enabled: boolean,
  writer: CreateReminderPreferenceWriter
): Promise<void> {
  if (!userId) return;
  await writer(userId, enabled);
}
