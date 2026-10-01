import { type MentaPalette, mentaDepth } from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MentaNarrator } from '@/components/onboarding/MentaNarrator';
import type { MascotState } from '@/components/ui/MentaMascot';
import {
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  FileTextIcon,
  LockIcon,
  UserPlusIcon,
  VideoIcon,
  XIcon,
} from '@/components/ui/icons';

import { useTheme } from '@/constants/ThemeContext';
import { mentaFonts } from '@/lib/menta-fonts';
import { useTranslation } from '@/lib/localization';

export type PromiseProofKind = 'photo' | 'text' | 'video';

/** ISO weekdays (1 = Monday). */
/**
 * The equipped theme's accent for selected states. Null keeps the default
 * Menta violet exactly as designed; a theme supplies its own mark, edge and
 * tint so selections match its buttons and tab bar.
 */
type FlowTone = {
  mark: string;
  onMark: string;
  edge: string;
  tint: string;
};
const useFlowTone = (): FlowTone | null => {
  const mentaColors = useMentaPalette();

  const { colors } = useTheme();
  return React.useMemo(
    () =>
      colors.border.focus === mentaColors.action
        ? null
        : {
            mark: colors.accent.primary,
            onMark: colors.onPrimary,
            edge: colors.border.focus ?? colors.accent.primary,
            tint: colors.accent.background,
          },
    [colors, mentaColors.action]
  );
};
const selectedTone = (tone: FlowTone | null) =>
  tone
    ? {
        borderColor: tone.edge,
        backgroundColor: tone.tint,
        boxShadow: [
          {
            offsetX: 0,
            offsetY: mentaDepth.action,
            blurRadius: 0,
            color: tone.mark,
          },
        ],
      }
    : null;

export type CheckInPlan =
  { kind: 'every' } | { kind: 'weekdays' } | { kind: 'custom'; days: number[] };

export type ReviewerChoice =
  | { kind: 'menta' }
  | { kind: 'self' }
  | { kind: 'friend' }
  | { kind: 'group'; groupId: string; name: string };

export type ReviewerGroupOption = {
  id: string;
  name: string;
  memberCount?: number;
};

const ISO_WEEK = [1, 2, 3, 4, 5, 6, 7] as const;
const WEEKDAYS = [1, 2, 3, 4, 5];
const INSET = 24;

/** The schedule the server stores: null means every day. */
export const checkInWeekdaysFor = (plan: CheckInPlan): number[] | null => {
  if (plan.kind === 'every') return null;
  const days = plan.kind === 'weekdays' ? WEEKDAYS : plan.days;
  const unique = [...new Set(days)].filter(day => day >= 1 && day <= 7);
  unique.sort((a, b) => a - b);
  return unique.length === 7 ? null : unique;
};

const isoWeekday = (date: Date) => ((date.getDay() + 6) % 7) + 1;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/** Scheduled days from today through the promise's last day. */
export const countCheckIns = (
  duration: number,
  weekdays: number[] | null,
  start: Date = new Date()
): number => {
  if (!weekdays) return duration;
  let count = 0;
  for (let offset = 0; offset < duration; offset += 1) {
    if (weekdays.includes(isoWeekday(addDays(start, offset)))) count += 1;
  }
  return count;
};

/**
 * The first day that has to have proof. The day a promise is created is
 * partial, so the server never counts it as missed.
 */
export const firstRequiredCheckInDay = (
  weekdays: number[] | null,
  start: Date = new Date()
): Date => {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = addDays(start, offset);
    if (!weekdays || weekdays.includes(isoWeekday(candidate))) {
      return candidate;
    }
  }
  return addDays(start, 1);
};

const weekdayLabel = (
  isoDay: number,
  locale: string,
  width: 'narrow' | 'short' | 'long'
) => {
  // 2024-01-01 was a Monday.
  const date = new Date(2024, 0, isoDay);
  try {
    return new Intl.DateTimeFormat(locale, { weekday: width }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-NZ', { weekday: width }).format(date);
  }
};

export const describeCheckInPlan = (
  plan: CheckInPlan,
  locale: string,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  const weekdays = checkInWeekdaysFor(plan);
  if (!weekdays) return t('todayProof.createFlow.everyDay');
  if (
    weekdays.length === WEEKDAYS.length &&
    WEEKDAYS.every(day => weekdays.includes(day))
  ) {
    return t('todayProof.createFlow.weekdays');
  }
  return weekdays.map(day => weekdayLabel(day, locale, 'short')).join(', ');
};

export const describeFirstProofDay = (
  weekdays: number[] | null,
  locale: string,
  t: ReturnType<typeof useTranslation>['t'],
  start: Date = new Date()
): string => {
  const day = firstRequiredCheckInDay(weekdays, start);
  const diff = Math.round(
    (new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() -
      new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      ).getTime()) /
      86_400_000
  );
  if (diff === 1) return t('todayProof.createFlow.tomorrow');
  return weekdayLabel(isoWeekday(day), locale, 'long');
};

export const proofKindLabel = (
  kind: PromiseProofKind,
  t: ReturnType<typeof useTranslation>['t']
) =>
  kind === 'text'
    ? t('todayProof.createFlow.noteProof')
    : kind === 'video'
      ? t('todayProof.createFlow.videoProof')
      : t('todayProof.createFlow.photoProof');

/* ------------------------------------------------------------------ */
/* Frame                                                               */
/* ------------------------------------------------------------------ */

export function PromiseFlowHeader({
  first,
  progress,
  disabled,
  onBack,
}: {
  first: boolean;
  progress: number;
  disabled?: boolean;
  onBack: () => void;
}) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const tone = useFlowTone();
  const clamped = Math.max(0.08, Math.min(1, progress));
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          first
            ? t('todayProof.createFlow.close')
            : t('todayProof.createFlow.back')
        }
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={12}
        onPress={onBack}
        style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
        testID="create-promise-header-back"
      >
        {first ? (
          <XIcon size={24} color={mentaColors.text.muted} />
        ) : (
          <ChevronLeftIcon size={26} color={mentaColors.text.muted} />
        )}
      </Pressable>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(clamped * 100),
        }}
        testID="create-promise-progress"
      >
        <View
          style={[
            styles.fill,
            tone && { backgroundColor: tone.mark },
            { width: `${clamped * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

export function PromiseFlowQuestion({
  state,
  message,
  testID,
}: {
  state: MascotState;
  message: string;
  testID?: string;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  return (
    <View style={styles.question}>
      <MentaNarrator state={state} message={message} testID={testID} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* P01 · What you'll do                                                */
/* ------------------------------------------------------------------ */

export function PromiseTitleStep({
  value,
  maxLength,
  suggestions,
  disabled,
  onChange,
  onPickSuggestion,
  onSubmit,
}: {
  value: string;
  maxLength: number;
  suggestions: { id: string; title: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onPickSuggestion: (id: string) => void;
  onSubmit: () => void;
}) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.titleField}>
        <TextInput
          testID="create-promise-name-input"
          accessibilityLabel={t('todayProof.createFlow.promiseLabel')}
          value={value}
          onChangeText={onChange}
          editable={!disabled}
          maxLength={maxLength}
          multiline
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={onSubmit}
          placeholder={t('todayProof.create.name_promise')}
          placeholderTextColor={mentaColors.text.muted}
          selectionColor={mentaColors.action}
          style={styles.titleInput}
        />
      </View>
      <View style={styles.titleMeta}>
        <Text style={styles.metaText}>
          {t('todayProof.createFlow.draftNote')}
        </Text>
        <Text style={styles.metaCount}>{`${value.length} / ${maxLength}`}</Text>
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          <Text style={styles.sectionLabelMuted}>
            {t('todayProof.createFlow.startFrom')}
          </Text>
          <View style={styles.chipWrap}>
            {suggestions.map(suggestion => (
              <Pressable
                key={suggestion.id}
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => onPickSuggestion(suggestion.id)}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.pressedDown,
                ]}
                testID={`create-promise-suggestion-${suggestion.id}`}
              >
                <Text style={styles.chipText}>{suggestion.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Shared choice row                                                   */
/* ------------------------------------------------------------------ */

function ChoiceRow({
  selected,
  title,
  detail,
  leading,
  trailing,
  disabled,
  onPress,
  testID,
  style,
}: {
  selected: boolean;
  title: string;
  detail?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const tone = useFlowTone();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={detail ? `${title}. ${detail}` : title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        selected && selectedTone(tone),
        pressed && styles.pressedDown,
        style,
      ]}
      testID={testID}
    >
      {leading}
      <View style={styles.choiceCopy}>
        <Text
          style={[styles.choiceTitle, selected && styles.choiceTitleSelected]}
        >
          {title}
        </Text>
        {detail ? <Text style={styles.choiceDetail}>{detail}</Text> : null}
      </View>
      {trailing ?? <Radio selected={selected} />}
    </Pressable>
  );
}

function Radio({ selected }: { selected: boolean }) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const tone = useFlowTone();
  return selected ? (
    <View
      style={[
        styles.radioOn,
        tone && { backgroundColor: tone.mark, borderColor: tone.mark },
      ]}
    >
      <CheckIcon size={15} color={tone?.onMark ?? mentaColors.canvas} />
    </View>
  ) : (
    <View style={styles.radioOff} />
  );
}

function IconTile({
  selected,
  children,
}: {
  selected: boolean;
  children: (color: string) => React.ReactNode;
}) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const tone = useFlowTone();
  return (
    <View
      style={[
        styles.iconTile,
        selected && styles.iconTileSelected,
        selected && tone && { backgroundColor: tone.mark },
      ]}
    >
      {children(
        selected
          ? (tone?.onMark ?? mentaColors.canvas)
          : mentaColors.text.secondary
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* P02 · Proof                                                         */
/* ------------------------------------------------------------------ */

export function PromiseProofStep({
  promiseTitle,
  proofKind,
  proofRule,
  shared,
  safetyNote,
  disabled,
  onChangeKind,
  onChangeRule,
}: {
  promiseTitle: string;
  proofKind: PromiseProofKind;
  proofRule: string;
  shared: boolean;
  safetyNote: string;
  disabled?: boolean;
  onChangeKind: (kind: PromiseProofKind) => void;
  onChangeRule: (value: string) => void;
}) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const tone = useFlowTone();
  const options: {
    kind: PromiseProofKind;
    title: string;
    detail: string;
    prompt: string;
    icon: (color: string) => React.ReactNode;
  }[] = [
    {
      kind: 'photo',
      title: t('todayProof.createFlow.photo'),
      detail: t('todayProof.createFlow.photoDetail'),
      prompt: t('todayProof.createFlow.showPhoto'),
      icon: color => <CameraIcon size={22} color={color} />,
    },
    {
      kind: 'text',
      title: t('todayProof.createFlow.note'),
      detail: t('todayProof.createFlow.noteDetail'),
      prompt: t('todayProof.createFlow.showNote'),
      icon: color => <FileTextIcon size={22} color={color} />,
    },
    {
      kind: 'video',
      title: t('todayProof.createFlow.video'),
      detail: t('todayProof.createFlow.videoDetail'),
      prompt: t('todayProof.createFlow.showVideo'),
      icon: color => <VideoIcon size={22} color={color} />,
    },
  ];

  return (
    <View>
      {promiseTitle ? (
        <Text style={styles.sectionLabel} numberOfLines={2}>
          {t('todayProof.createFlow.proofFor', { title: promiseTitle })}
        </Text>
      ) : null}
      <View style={styles.stack} accessibilityRole="radiogroup">
        {options.map(option => {
          const selected = option.kind === proofKind;
          return (
            <View key={option.kind}>
              <ChoiceRow
                selected={selected}
                title={option.title}
                detail={option.detail}
                disabled={disabled}
                onPress={() => onChangeKind(option.kind)}
                leading={<IconTile selected={selected}>{option.icon}</IconTile>}
                testID={`create-promise-proof-${option.kind}`}
              />
              {selected ? (
                <View style={styles.ruleBlock}>
                  <Text style={styles.ruleLabel}>{option.prompt}</Text>
                  <View
                    style={[
                      styles.ruleField,
                      tone && { borderBottomColor: tone.mark },
                    ]}
                  >
                    <TextInput
                      testID="create-promise-reviewer-instructions-input"
                      accessibilityLabel={option.prompt}
                      value={proofRule}
                      onChangeText={onChangeRule}
                      editable={!disabled}
                      maxLength={300}
                      multiline
                      submitBehavior="blurAndSubmit"
                      returnKeyType="done"
                      placeholder={t('todayProof.create.photo_example')}
                      placeholderTextColor={mentaColors.text.muted}
                      selectionColor={tone?.mark ?? mentaColors.action}
                      style={styles.ruleInput}
                    />
                    {proofRule.trim().length >= 8 ? (
                      <CheckIcon
                        size={18}
                        color={tone?.mark ?? mentaColors.action}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.ruleHelp}>
                    {shared
                      ? t('todayProof.createFlow.showHelpShared')
                      : t('todayProof.createFlow.showHelpSolo')}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      <Text style={styles.footnote}>{safetyNote}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* P03 · Who checks                                                    */
/* ------------------------------------------------------------------ */

export function PromiseReviewerStep({
  groups,
  value,
  disabled,
  onChange,
}: {
  groups: ReviewerGroupOption[];
  value: ReviewerChoice;
  disabled?: boolean;
  onChange: (value: ReviewerChoice) => void;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  return (
    <View accessibilityRole="radiogroup">
      {groups.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>
            {t('todayProof.createFlow.yourGroups')}
          </Text>
          <View style={styles.stack}>
            {groups.map(group => {
              const selected =
                value.kind === 'group' && value.groupId === group.id;
              return (
                <ChoiceRow
                  key={group.id}
                  selected={selected}
                  title={group.name}
                  detail={
                    typeof group.memberCount === 'number'
                      ? t('todayProof.createFlow.groupMembers', {
                          count: group.memberCount,
                        })
                      : undefined
                  }
                  disabled={disabled}
                  onPress={() =>
                    onChange({
                      kind: 'group',
                      groupId: group.id,
                      name: group.name,
                    })
                  }
                  leading={
                    <View
                      style={[styles.avatar, selected && styles.avatarSelected]}
                    >
                      <Text style={styles.avatarText}>
                        {group.name.trim().charAt(0).toUpperCase() || 'M'}
                      </Text>
                    </View>
                  }
                  testID={`create-promise-reviewer-group-${group.id}`}
                />
              );
            })}
          </View>
          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
            {t('todayProof.createFlow.or')}
          </Text>
        </>
      ) : null}
      <View style={styles.stack}>
        <ChoiceRow
          selected={value.kind === 'menta'}
          title={t('mentaCheck.option.title')}
          detail={t('mentaCheck.option.detail')}
          disabled={disabled}
          onPress={() => onChange({ kind: 'menta' })}
          testID="create-promise-reviewer-menta"
        />
        <ChoiceRow
          selected={value.kind === 'friend'}
          title={t('todayProof.createFlow.friend')}
          detail={t('todayProof.createFlow.friendDetail')}
          disabled={disabled}
          onPress={() => onChange({ kind: 'friend' })}
          leading={
            <IconTile selected={value.kind === 'friend'}>
              {color => <UserPlusIcon size={20} color={color} />}
            </IconTile>
          }
          testID="create-promise-reviewer-friend"
        />
        <ChoiceRow
          selected={value.kind === 'self'}
          title={t('todayProof.createFlow.justMe')}
          detail={t('todayProof.createFlow.justMeDetail')}
          disabled={disabled}
          onPress={() => onChange({ kind: 'self' })}
          leading={
            <IconTile selected={value.kind === 'self'}>
              {color => <LockIcon size={20} color={color} />}
            </IconTile>
          }
          testID="create-promise-reviewer-self"
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* P04 · How long                                                      */
/* ------------------------------------------------------------------ */

export function PromiseLengthStep({
  promiseTitle,
  summary,
  durations,
  duration,
  plan,
  disabled,
  onChangeDuration,
  onChangePlan,
}: {
  promiseTitle: string;
  summary: string;
  durations: readonly number[];
  duration: number;
  plan: CheckInPlan;
  /** False until the server supports weekday schedules. */
  disabled?: boolean;
  onChangeDuration: (days: number) => void;
  onChangePlan: (plan: CheckInPlan) => void;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t, locale } = useTranslation();
  const tone = useFlowTone();
  const weekdays = checkInWeekdaysFor(plan);
  const customDays =
    plan.kind === 'custom'
      ? plan.days
      : plan.kind === 'weekdays'
        ? WEEKDAYS
        : [...ISO_WEEK];

  const toggleDay = (day: number) => {
    const has = customDays.includes(day);
    const next = has
      ? customDays.filter(value => value !== day)
      : [...customDays, day];
    if (next.length === 0) return;
    onChangePlan(
      next.length === 7 ? { kind: 'every' } : { kind: 'custom', days: next }
    );
  };

  return (
    <View>
      <View style={styles.paperCard}>
        <Text style={styles.paperTitle} numberOfLines={3}>
          {promiseTitle}
        </Text>
        <Text style={styles.paperMeta}>{summary}</Text>
      </View>

      <View style={[styles.stack, styles.lengthList]}>
        {durations.map(days => {
          const selected = duration === days;
          const checkIns = countCheckIns(days, weekdays);
          return (
            <Pressable
              key={days}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              accessibilityLabel={`${t('todayProof.createFlow.days', {
                count: days,
              })}. ${t('todayProof.createFlow.checkIns', { count: checkIns })}`}
              disabled={disabled}
              onPress={() => onChangeDuration(days)}
              style={({ pressed }) => [
                styles.lengthRow,
                selected && styles.choiceSelected,
                selected && selectedTone(tone),
                pressed && styles.pressedDown,
              ]}
              testID={`create-promise-duration-${days}`}
            >
              <Text
                style={[
                  styles.lengthDays,
                  selected && styles.choiceTitleSelected,
                ]}
              >
                {t('todayProof.createFlow.days', { count: days })}
              </Text>
              <View style={styles.lengthTrail}>
                <Text
                  style={[
                    styles.lengthCheckIns,
                    selected && styles.lengthCheckInsSelected,
                    selected && tone && { color: tone.mark },
                  ]}
                >
                  {t('todayProof.createFlow.checkIns', { count: checkIns })}
                </Text>
                {selected ? <Radio selected /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <>
        <Text style={[styles.sectionLabel, styles.whichDaysLabel]}>
          {t('todayProof.createFlow.whichDays')}
        </Text>
        <View style={styles.segmentRow} accessibilityRole="radiogroup">
          {(
            [
              ['every', t('todayProof.createFlow.everyDay')],
              ['weekdays', t('todayProof.createFlow.weekdays')],
              ['custom', t('todayProof.createFlow.pickDays')],
            ] as const
          ).map(([kind, label]) => {
            const selected = plan.kind === kind;
            return (
              <Pressable
                key={kind}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled }}
                disabled={disabled}
                onPress={() =>
                  onChangePlan(
                    kind === 'custom'
                      ? { kind: 'custom', days: customDays }
                      : { kind }
                  )
                }
                style={({ pressed }) => [
                  styles.segment,
                  selected && styles.segmentSelected,
                  selected &&
                    tone && {
                      borderColor: tone.edge,
                      backgroundColor: tone.tint,
                    },
                  pressed && styles.pressed,
                ]}
                testID={`create-promise-days-${kind}`}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selected && styles.segmentTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {plan.kind === 'custom' ? (
          <View style={styles.dayRow}>
            {ISO_WEEK.map(day => {
              const on = customDays.includes(day);
              const name = weekdayLabel(day, locale, 'long');
              return (
                <Pressable
                  key={day}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on, disabled }}
                  accessibilityLabel={
                    on
                      ? t('todayProof.createFlow.dayToggle', { day: name })
                      : t('todayProof.createFlow.dayToggleOff', { day: name })
                  }
                  disabled={disabled}
                  onPress={() => toggleDay(day)}
                  style={({ pressed }) => [
                    styles.dayToggle,
                    on && styles.dayToggleOn,
                    on &&
                      tone && {
                        borderColor: tone.mark,
                        backgroundColor: tone.mark,
                      },
                    pressed && styles.pressed,
                  ]}
                  testID={`create-promise-day-${day}`}
                >
                  <Text style={[styles.dayText, on && styles.dayTextOn]}>
                    {weekdayLabel(day, locale, 'narrow')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* P05 / P06 · Review                                                  */
/* ------------------------------------------------------------------ */

export function PromiseReviewStep({
  short,
  bubble,
  promiseTitle,
  summary,
  checker,
  firstProof,
}: {
  short: boolean;
  bubble: string;
  promiseTitle: string;
  summary: string;
  checker: string;
  firstProof: string;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  return (
    <View style={styles.review}>
      <MentaNarrator
        layout="stacked"
        mascotSize={136}
        state={short ? 'momenta-short' : 'promise-confirmed'}
        message={bubble}
        testID="create-promise-narrator"
      />
      <Text style={styles.reviewHeading} accessibilityRole="header">
        {short
          ? t('todayProof.createFlow.almostThere')
          : t('todayProof.createFlow.ready')}
      </Text>
      <View style={styles.reviewCard} testID="create-promise-review-card">
        <View style={styles.reviewCardHead}>
          <Text style={styles.reviewTitle}>{promiseTitle}</Text>
          <Text style={styles.paperMeta}>{summary}</Text>
        </View>
        <View style={styles.reviewFact}>
          <Text style={styles.reviewFactLabel}>
            {t('todayProof.createFlow.checkedBy')}
          </Text>
          <Text style={styles.reviewFactValue} numberOfLines={1}>
            {checker}
          </Text>
        </View>
        <View style={[styles.reviewFact, styles.reviewFactLast]}>
          <Text style={styles.reviewFactLabel}>
            {t('todayProof.createFlow.firstProofDue')}
          </Text>
          <Text style={styles.reviewFactValue}>{firstProof}</Text>
        </View>
      </View>
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    header: {
      minHeight: 44,
      paddingTop: 6,
      paddingLeft: 20,
      paddingRight: INSET,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    headerIcon: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    track: {
      flex: 1,
      height: 10,
      borderRadius: 999,
      backgroundColor: mentaColors.raised,
      overflow: 'hidden',
    },
    fill: {
      height: 10,
      borderRadius: 999,
      backgroundColor: mentaColors.action,
    },
    // Paper leaves a clear band under the progress bar and before the first
    // choice; the inline mascot bleeds 12pt past this box on both edges.
    question: {
      marginLeft: -16,
      paddingTop: 36,
      paddingBottom: 24,
    },
    pressed: { opacity: 0.8 },
    pressedDown: { transform: [{ translateY: 2 }] },

    titleField: {
      paddingTop: 28,
      paddingBottom: 16,
      borderBottomWidth: 1.5,
      borderBottomColor: mentaColors.text.primary,
    },
    titleInput: {
      padding: 0,
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.newsreader.regular,
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.32,
      minHeight: 40,
    },
    titleMeta: {
      paddingTop: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    metaText: {
      flex: 1,
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.regular,
      fontSize: 15,
      lineHeight: 21,
    },
    metaCount: {
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.medium,
      fontSize: 15,
      lineHeight: 21,
    },
    suggestions: { paddingTop: 36, gap: 12 },
    sectionLabelMuted: {
      color: mentaColors.text.muted,
      fontFamily: mentaFonts.inter.medium,
      fontSize: 15,
      lineHeight: 21,
    },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      minHeight: 44,
      paddingHorizontal: 16,
      justifyContent: 'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: mentaColors.border,
      backgroundColor: mentaColors.raised,
      boxShadow: [
        { offsetX: 0, offsetY: 2, blurRadius: 0, color: mentaColors.border },
      ],
    },
    chipText: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.inter.medium,
      fontSize: 15,
      lineHeight: 21,
    },

    sectionLabel: {
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.regular,
      fontSize: 15,
      lineHeight: 21,
      paddingTop: 20,
      paddingBottom: 12,
    },
    sectionLabelSpaced: { paddingTop: 24 },
    stack: { gap: 12 },
    choice: {
      minHeight: 68,
      paddingHorizontal: 20,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: mentaColors.border,
      backgroundColor: mentaColors.raised,
      boxShadow: [
        {
          offsetX: 0,
          offsetY: mentaDepth.action,
          blurRadius: 0,
          color: mentaColors.border,
        },
      ],
    },
    choiceSelected: {
      borderWidth: 2,
      borderColor: mentaColors.action,
      backgroundColor: 'rgba(184, 140, 255, 0.1)',
      boxShadow: [
        {
          offsetX: 0,
          offsetY: mentaDepth.action,
          blurRadius: 0,
          color: '#7750B6',
        },
      ],
    },
    choiceCopy: { flex: 1, gap: 2 },
    choiceTitle: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.inter.semibold,
      fontSize: 18,
      lineHeight: 24,
    },
    choiceTitleSelected: { color: mentaColors.text.primary },
    choiceDetail: {
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.regular,
      fontSize: 16,
      lineHeight: 22,
    },
    radioOn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: mentaColors.action,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOff: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: mentaColors.text.muted,
    },
    iconTile: {
      width: 52,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mentaColors.surface,
    },
    iconTileSelected: { backgroundColor: mentaColors.action },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mentaColors.surface,
    },
    avatarSelected: { backgroundColor: 'rgba(184, 140, 255, 0.25)' },
    avatarText: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.inter.semibold,
      fontSize: 17,
    },

    ruleBlock: { paddingTop: 16, paddingHorizontal: 4, paddingBottom: 4 },
    ruleLabel: {
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.regular,
      fontSize: 15,
      lineHeight: 21,
    },
    ruleField: {
      marginTop: 6,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      borderBottomWidth: 1.5,
      borderBottomColor: mentaColors.action,
    },
    ruleInput: {
      flex: 1,
      padding: 0,
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.newsreader.regular,
      fontSize: 24,
      lineHeight: 30,
    },
    ruleHelp: {
      paddingTop: 8,
      color: mentaColors.text.muted,
      fontFamily: mentaFonts.inter.regular,
      fontSize: 13,
      lineHeight: 18,
    },
    footnote: {
      paddingTop: 20,
      color: mentaColors.text.muted,
      fontFamily: mentaFonts.inter.regular,
      fontSize: 13,
      lineHeight: 18,
    },

    paperCard: {
      marginTop: 22,
      paddingHorizontal: 22,
      paddingVertical: 20,
      gap: 8,
      borderRadius: 18,
      backgroundColor: mentaColors.paper,
    },
    paperTitle: {
      color: mentaColors.text.onPaper,
      fontFamily: mentaFonts.newsreader.regular,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.24,
    },
    paperMeta: {
      color: mentaColors.text.mutedOnPaper,
      fontFamily: mentaFonts.inter.medium,
      fontSize: 15,
      lineHeight: 21,
    },
    lengthList: { paddingTop: 18 },
    lengthRow: {
      minHeight: 68,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: mentaColors.border,
      backgroundColor: mentaColors.raised,
      boxShadow: [
        {
          offsetX: 0,
          offsetY: mentaDepth.action,
          blurRadius: 0,
          color: mentaColors.border,
        },
      ],
    },
    lengthDays: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.inter.semibold,
      fontSize: 18,
      lineHeight: 24,
    },
    lengthTrail: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    lengthCheckIns: {
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.regular,
      fontSize: 16,
      lineHeight: 22,
    },
    lengthCheckInsSelected: {
      color: mentaColors.action,
      fontFamily: mentaFonts.inter.medium,
    },
    whichDaysLabel: { paddingTop: 20, paddingBottom: 10 },
    segmentRow: { flexDirection: 'row', gap: 8 },
    segment: {
      flex: 1,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: mentaColors.border,
      backgroundColor: mentaColors.raised,
    },
    segmentSelected: {
      borderColor: mentaColors.action,
      backgroundColor: '#231B33',
    },
    segmentText: {
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.medium,
      fontSize: 15,
      lineHeight: 18,
    },
    segmentTextSelected: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.inter.semibold,
    },
    dayRow: {
      paddingTop: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    dayToggle: {
      flex: 1,
      maxWidth: 48,
      aspectRatio: 1,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: mentaColors.border,
      backgroundColor: mentaColors.raised,
    },
    dayToggleOn: {
      borderColor: mentaColors.action,
      backgroundColor: mentaColors.action,
    },
    dayText: {
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.semibold,
      fontSize: 15,
    },
    dayTextOn: { color: mentaColors.canvas },

    review: { alignItems: 'center', paddingTop: 12 },
    reviewHeading: {
      paddingTop: 6,
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.newsreader.regular,
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: -0.76,
      textAlign: 'center',
    },
    reviewCard: {
      alignSelf: 'stretch',
      marginTop: 24,
      borderRadius: 18,
      backgroundColor: mentaColors.paper,
    },
    reviewCardHead: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 16,
      gap: 6,
    },
    reviewTitle: {
      color: mentaColors.text.onPaper,
      fontFamily: mentaFonts.newsreader.regular,
      fontSize: 26,
      lineHeight: 31,
    },
    reviewFact: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: mentaColors.borderPaper,
    },
    reviewFactLast: { paddingBottom: 14 },
    reviewFactLabel: {
      color: mentaColors.text.onPaper,
      fontFamily: mentaFonts.inter.medium,
      fontSize: 15,
      lineHeight: 21,
    },
    reviewFactValue: {
      flexShrink: 1,
      color: mentaColors.text.onPaper,
      fontFamily: mentaFonts.inter.semibold,
      fontSize: 15,
      lineHeight: 21,
      textAlign: 'right',
    },
  });
  return { styles };
};
