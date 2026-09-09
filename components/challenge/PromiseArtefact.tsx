import React from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { EditIcon } from '@/components/ui/icons';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { useTranslation } from '@/lib/localization';

type PromiseArtefactProps = {
  accentColor?: string;
  promise: string;
  countsWhen?: string | null;
  proofRule?: string | null;
  editable?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onChangePromise?: (value: string) => void;
  onChangeCountsWhen?: (value: string) => void;
  promiseInputTestID?: string;
  countsWhenInputTestID?: string;
  promiseMaxLength?: number;
  countsWhenMaxLength?: number;
  promisePlaceholders?: readonly string[];
  countsWhenPlaceholders?: readonly string[];
  onPress?: () => void;
  accessibilityHint?: string;
  /**
   * When this artefact is the screen's identity, expose it to the VoiceOver
   * headings rotor. Leave off when a chrome title already owns that role.
   */
  isHeading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const readableValue = (value: string | null | undefined, fallback: string) =>
  value?.trim() || fallback;

const sentencePart = (label: string, value: string | null | undefined) => {
  const clean = value?.trim();
  return clean ? `${label}: ${clean.replace(/[.!?]+$/u, '')}.` : null;
};

type CyclingPlaceholderProps = {
  examples: readonly string[] | undefined;
  fallback: string;
  initialDelay?: number;
  style: React.ComponentProps<typeof Text>['style'];
  testID?: string;
};

const AnimatedTypingInput = Animated.createAnimatedComponent(TextInput);
const TYPE_CHARACTER_MS = 52;

export const resolveTypingPlaceholderFrame = (
  values: readonly string[],
  elapsedMs: number
): string => {
  'worklet';

  if (values.length === 0) return '';
  const value = values[0];
  return value.slice(
    0,
    Math.min(
      value.length,
      Math.floor(Math.max(0, elapsedMs) / TYPE_CHARACTER_MS) + 1
    )
  );
};

const CyclingPlaceholder = ({
  examples,
  fallback,
  initialDelay = 180,
  style,
  testID,
}: CyclingPlaceholderProps) => {
  const values = React.useMemo(() => {
    const cleaned = examples?.map(value => value.trim()).filter(Boolean) ?? [];
    return cleaned.length > 0 ? cleaned : [fallback];
  }, [examples, fallback]);
  const elapsed = useSharedValue(0);
  const typeDuration = React.useMemo(
    () => values[0].length * TYPE_CHARACTER_MS,
    [values]
  );

  React.useEffect(() => {
    elapsed.value = 0;
    elapsed.value = withDelay(
      initialDelay,
      withTiming(typeDuration, {
        duration: typeDuration,
        easing: Easing.linear,
      })
    );
    return () => {
      cancelAnimation(elapsed);
      elapsed.value = 0;
    };
  }, [elapsed, initialDelay, typeDuration]);

  const animatedProps = useAnimatedProps(() => {
    const text = resolveTypingPlaceholderFrame(values, elapsed.value);
    return { text, defaultValue: text };
  });

  return (
    <AnimatedTypingInput
      accessible={false}
      accessibilityElementsHidden
      animatedProps={animatedProps}
      caretHidden
      editable={false}
      focusable={false}
      importantForAccessibility="no"
      style={[style, styles.typingInput]}
      testID={testID}
      underlineColorAndroid="transparent"
    />
  );
};

/**
 * The promise is the product's central object, not a pair of unrelated form
 * fields. This component keeps the same editorial paper artefact through
 * creation, detail, history and human review while leaving the surrounding
 * route responsible for navigation and server state.
 */
export function PromiseArtefact({
  accentColor = mentaColors.actionOnPaper,
  promise,
  countsWhen,
  proofRule,
  editable = false,
  disabled = false,
  compact = false,
  onChangePromise,
  onChangeCountsWhen,
  promiseInputTestID,
  countsWhenInputTestID,
  promiseMaxLength = 100,
  countsWhenMaxLength = 500,
  promisePlaceholders,
  countsWhenPlaceholders,
  onPress,
  accessibilityHint,
  isHeading = false,
  testID,
  style,
}: PromiseArtefactProps) {
  const { t } = useTranslation();
  const motion = useMotionPreferences();
  const countsWhenInputRef = React.useRef<TextInput>(null);
  const [promiseFocused, setPromiseFocused] = React.useState(false);
  const [countsWhenFocused, setCountsWhenFocused] = React.useState(false);
  const canAnimatePlaceholders =
    !motion.reduceMotion && !motion.screenReaderEnabled;
  const showPromiseTyping =
    canAnimatePlaceholders &&
    editable &&
    !disabled &&
    promise.length === 0 &&
    !promiseFocused;
  const showCountsWhenTyping =
    canAnimatePlaceholders &&
    editable &&
    !disabled &&
    (countsWhen?.length ?? 0) === 0 &&
    !countsWhenFocused;
  const staticPromisePlaceholder =
    promisePlaceholders?.find(value => value.trim()) ??
    'Morning walk before work…';
  const staticCountsWhenPlaceholder =
    countsWhenPlaceholders?.find(value => value.trim()) ??
    'Walk outside for 20 minutes…';
  const promiseValue = readableValue(promise, 'Name your promise');
  const countsValue = readableValue(countsWhen, 'Set your daily minimum');
  const summary = [
    sentencePart('Your promise', promise),
    sentencePart('Daily minimum', countsWhen),
    sentencePart('Proof should show', proofRule),
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {t('todayProof.residual.your_promise')}
        </Text>
        {editable ? (
          <View style={styles.editCue}>
            <EditIcon size={13} color={accentColor} />
            <Text style={[styles.editCueLabel, { color: accentColor }]}>
              {t('todayProof.residual.edit')}
            </Text>
            <Text style={styles.counter}>
              {promise.length}/{promiseMaxLength}
            </Text>
          </View>
        ) : null}
      </View>

      {editable ? (
        <View style={styles.inputShell}>
          <TextInput
            accessibilityLabel={t('todayProof.create.your_promise')}
            testID={promiseInputTestID}
            value={promise}
            onChangeText={onChangePromise}
            editable={!disabled}
            maxLength={promiseMaxLength}
            placeholder={
              showPromiseTyping
                ? ''
                : promiseFocused
                  ? t('todayProof.residual.type_your_promise')
                  : staticPromisePlaceholder
            }
            placeholderTextColor={mentaColors.text.mutedOnPaper}
            onFocus={() => setPromiseFocused(true)}
            onBlur={() => setPromiseFocused(false)}
            autoCapitalize="sentences"
            returnKeyType="next"
            blurOnSubmit
            onSubmitEditing={() => countsWhenInputRef.current?.focus()}
            multiline
            textAlignVertical="top"
            style={[
              styles.promiseInput,
              compact ? styles.promiseInputCompact : null,
            ]}
          />
          {showPromiseTyping ? (
            <View pointerEvents="none" style={styles.promiseTypingOverlay}>
              <CyclingPlaceholder
                examples={promisePlaceholders}
                fallback="Morning walk before work…"
                style={styles.promiseTypingText}
                testID={
                  promiseInputTestID
                    ? `${promiseInputTestID}-typing-placeholder`
                    : undefined
                }
              />
            </View>
          ) : null}
        </View>
      ) : (
        <Text
          style={[
            styles.promiseText,
            compact ? styles.promiseTextCompact : null,
          ]}
        >
          {promiseValue}
        </Text>
      )}

      <View
        style={[styles.actionRule, { backgroundColor: accentColor }]}
        testID={testID ? `${testID}-accent-rule` : undefined}
      />

      <View style={[styles.labelRow, styles.countsLabelRow]}>
        <Text style={styles.label}>
          {t('todayProof.residual.daily_minimum')}
        </Text>
        {editable ? (
          <View style={styles.editCue}>
            <EditIcon size={13} color={accentColor} />
            <Text style={[styles.editCueLabel, { color: accentColor }]}>
              {t('todayProof.residual.edit')}
            </Text>
            <Text style={styles.counter}>
              {countsWhen?.length ?? 0}/{countsWhenMaxLength}
            </Text>
          </View>
        ) : null}
      </View>

      {editable ? (
        <View style={styles.inputShell}>
          <TextInput
            ref={countsWhenInputRef}
            accessibilityLabel={t('todayProof.residual.daily_minimum_2')}
            testID={countsWhenInputTestID}
            value={countsWhen ?? ''}
            onChangeText={onChangeCountsWhen}
            editable={!disabled}
            maxLength={countsWhenMaxLength}
            placeholder={
              showCountsWhenTyping
                ? ''
                : countsWhenFocused
                  ? t('todayProof.residual.describe_what_counts_as_done')
                  : staticCountsWhenPlaceholder
            }
            placeholderTextColor={mentaColors.text.mutedOnPaper}
            onFocus={() => setCountsWhenFocused(true)}
            onBlur={() => setCountsWhenFocused(false)}
            autoCapitalize="sentences"
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            multiline
            textAlignVertical="top"
            style={[
              styles.countsInput,
              compact ? styles.countsInputCompact : null,
            ]}
          />
          {showCountsWhenTyping ? (
            <View pointerEvents="none" style={styles.countsTypingOverlay}>
              <CyclingPlaceholder
                examples={countsWhenPlaceholders}
                fallback="Walk outside for 20 minutes…"
                initialDelay={520}
                style={styles.countsTypingText}
                testID={
                  countsWhenInputTestID
                    ? `${countsWhenInputTestID}-typing-placeholder`
                    : undefined
                }
              />
            </View>
          ) : null}
        </View>
      ) : (
        <Text
          style={[styles.countsText, compact ? styles.countsTextCompact : null]}
        >
          {countsValue}
        </Text>
      )}

      {proofRule?.trim() ? (
        <View style={styles.proofSection}>
          <Text style={styles.label}>
            {t('todayProof.residual.proof_should_show')}
          </Text>
          <Text style={styles.proofText}>{proofRule.trim()}</Text>
        </View>
      ) : null}
    </>
  );

  const paperStyle = [
    styles.paper,
    compact ? styles.paperCompact : null,
    disabled ? styles.disabled : null,
    style,
  ];

  if (editable) {
    return (
      <View testID={testID} style={paperStyle}>
        {content}
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          paperStyle,
          pressed ? styles.paperPressed : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityRole={isHeading ? 'header' : 'summary'}
      accessibilityLabel={summary}
      testID={testID}
      style={paperStyle}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.large,
    backgroundColor: mentaColors.paper,
    paddingHorizontal: mentaSpacing[5],
    paddingTop: mentaSpacing[5],
    paddingBottom: mentaSpacing[6],
    transform: [{ rotate: '-0.28deg' }],
  },
  paperCompact: {
    paddingHorizontal: mentaSpacing[4],
    paddingTop: mentaSpacing[4],
    paddingBottom: mentaSpacing[5],
    transform: [{ rotate: '-0.18deg' }],
  },
  paperPressed: {
    backgroundColor: mentaColors.paperPressed,
    transform: [{ rotate: '-0.18deg' }, { scale: 0.995 }],
  },
  disabled: {
    opacity: 0.68,
  },
  labelRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  label: {
    ...mentaTypography.label,
    color: mentaColors.text.mutedOnPaper,
  },
  counter: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
    fontVariant: ['tabular-nums'],
  },
  editCue: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[1],
  },
  editCueLabel: {
    ...mentaTypography.label,
  },
  promiseText: {
    ...mentaTypography.journeyTitle,
    color: mentaColors.text.onPaper,
    marginTop: mentaSpacing[2],
  },
  promiseTextCompact: {
    ...mentaTypography.title,
  },
  promiseInput: {
    ...mentaTypography.journeyTitle,
    minHeight: 78,
    color: mentaColors.text.onPaper,
    backgroundColor: 'transparent',
    borderColor: mentaColors.actionBorder,
    borderRadius: mentaRadii.small,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mentaSpacing[3],
    paddingTop: mentaSpacing[2],
    paddingBottom: mentaSpacing[2],
  },
  promiseInputCompact: {
    ...mentaTypography.title,
    minHeight: 64,
  },
  inputShell: {
    position: 'relative',
  },
  promiseTypingOverlay: {
    left: mentaSpacing[3],
    position: 'absolute',
    right: mentaSpacing[3],
    top: mentaSpacing[2],
  },
  promiseTypingText: {
    ...mentaTypography.journeyTitle,
    color: mentaColors.text.mutedOnPaper,
  },
  typingInput: {
    borderWidth: 0,
    padding: 0,
  },
  actionRule: {
    width: 64,
    height: 3,
    borderRadius: mentaRadii.round,
    marginTop: mentaSpacing[4],
  },
  countsLabelRow: {
    marginTop: mentaSpacing[5],
  },
  countsText: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
    marginTop: mentaSpacing[2],
  },
  countsTextCompact: {
    ...mentaTypography.lead,
  },
  countsInput: {
    ...mentaTypography.title,
    minHeight: 108,
    color: mentaColors.text.onPaper,
    backgroundColor: 'transparent',
    borderColor: mentaColors.actionBorder,
    borderRadius: mentaRadii.small,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mentaSpacing[3],
    paddingTop: mentaSpacing[2],
    paddingBottom: 0,
  },
  countsInputCompact: {
    ...mentaTypography.lead,
    minHeight: 84,
  },
  countsTypingOverlay: {
    left: mentaSpacing[3],
    position: 'absolute',
    right: mentaSpacing[3],
    top: mentaSpacing[2],
  },
  countsTypingText: {
    ...mentaTypography.title,
    color: mentaColors.text.mutedOnPaper,
  },
  proofSection: {
    marginTop: mentaSpacing[5],
    paddingTop: mentaSpacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.borderPaper,
    gap: mentaSpacing[2],
  },
  proofText: {
    ...mentaTypography.body,
    color: mentaColors.text.onPaper,
  },
});
