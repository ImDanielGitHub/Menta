import { useTranslation } from '@/lib/localization';
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, type AppButtonProps } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { UnifiedKeyboardContainer } from '@/components/ui/UnifiedKeyboardContainer';
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

export const mentaTokens = {
  canvas: mentaColors.canvas,
  panel: mentaColors.surface,
  panelRaised: mentaColors.raised,
  text: mentaColors.text.primary,
  textMuted: mentaColors.text.secondary,
  textFaint: mentaColors.text.muted,
  inverse: mentaColors.canvas,
  divider: mentaColors.border,
  dividerStrong: mentaColors.border,
  accent: mentaColors.action,
  warning: mentaColors.warning,
  danger: mentaColors.danger,
  dangerSoft: mentaColors.dangerSoft,
  success: mentaColors.success,
};

export interface MentaScreenProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  footer?: React.ReactNode;
  scrollEnabled?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  hero?: React.ReactNode;
  headingAlign?: 'left' | 'center';
  showTopBar?: boolean;
  topBarVariant?: 'brand' | 'backOnly';
}

export const MentaScreen: React.FC<MentaScreenProps> = ({
  eyebrow,
  title,
  subtitle,
  children,
  onBack,
  backLabel = 'Back',
  footer,
  scrollEnabled = true,
  contentContainerStyle,
  hero,
  headingAlign = 'left',
  showTopBar = true,
  topBarVariant = 'brand',
}) => {
  const { t } = useTranslation();
  const centeredHeading = headingAlign === 'center';
  const brandedTopBar = topBarVariant === 'brand';

  return (
    <SafeAreaView style={styles.safeArea}>
      <UnifiedKeyboardContainer
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {showTopBar ? (
          <View
            style={[styles.topBar, !brandedTopBar && styles.topBarBackOnly]}
          >
            <View style={styles.topBarSide}>
              {onBack ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={backLabel}
                  onPress={onBack}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <ArrowLeftIcon size={20} color={mentaTokens.text} />
                </Pressable>
              ) : null}
            </View>
            {brandedTopBar ? (
              <>
                <Text style={styles.wordmark}>
                  {t('fullAuth.component_onboarding_mentasurface.menta')}
                </Text>
                <View style={styles.topBarSide} />
              </>
            ) : null}
          </View>
        ) : null}

        <View
          style={[styles.heroStack, centeredHeading && styles.heroStackCenter]}
        >
          {hero}
          <View
            style={[
              styles.headingBlock,
              centeredHeading && styles.headingBlockCenter,
            ]}
          >
            {eyebrow ? (
              <Text
                style={[styles.eyebrow, centeredHeading && styles.centerText]}
              >
                {eyebrow}
              </Text>
            ) : null}
            <Text
              accessibilityRole="header"
              style={[styles.title, centeredHeading && styles.centerText]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.subtitle, centeredHeading && styles.centerText]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {children}
      </UnifiedKeyboardContainer>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
};

type MentaButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';

export type MentaButtonProps = Omit<AppButtonProps, 'variant'> & {
  tone?: MentaButtonTone;
};

export const MentaButton: React.FC<MentaButtonProps> = ({
  tone = 'primary',
  size = 'large',
  style,
  textStyle,
  ...props
}) => {
  const primary = tone === 'primary';
  const danger = tone === 'danger';
  const ghost = tone === 'ghost';

  return (
    <AppButton
      {...props}
      variant="ghost"
      size={size}
      style={[
        styles.button,
        {
          backgroundColor: primary
            ? mentaTokens.accent
            : danger
              ? mentaTokens.dangerSoft
              : ghost
                ? 'transparent'
                : mentaTokens.panelRaised,
          borderColor: primary
            ? mentaTokens.accent
            : danger
              ? mentaTokens.danger
              : ghost
                ? 'transparent'
                : mentaTokens.dividerStrong,
          borderWidth: ghost ? 0 : StyleSheet.hairlineWidth,
        },
        style,
      ]}
      textStyle={[
        styles.buttonText,
        {
          color: primary
            ? mentaTokens.inverse
            : danger
              ? mentaTokens.danger
              : ghost
                ? mentaTokens.textMuted
                : mentaTokens.text,
        },
        textStyle,
      ]}
    />
  );
};

export interface MentaFieldRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

export interface MentaTextFieldProps extends Omit<
  TextInputProps,
  'style' | 'blurOnSubmit' | 'onSubmitEditing'
> {
  label: string;
  helperText?: string;
  errorText?: string;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  nextInputRef?: React.RefObject<MentaFieldRef | null>;
  dismissKeyboardOnSubmit?: boolean;
  onSubmitEditing?: () => void;
  right?: React.ReactNode;
}

export const MentaTextField = forwardRef<MentaFieldRef, MentaTextFieldProps>(
  (
    {
      label,
      helperText,
      errorText,
      inputStyle,
      containerStyle,
      nextInputRef,
      dismissKeyboardOnSubmit = false,
      onSubmitEditing,
      right,
      placeholder,
      placeholderTextColor,
      returnKeyType,
      multiline,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<TextInput | null>(null);
    const [focused, setFocused] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        inputRef.current?.clear();
        props.onChangeText?.('');
      },
      isFocused: () => focused,
    }));

    const handleSubmit = () => {
      onSubmitEditing?.();
      if (!dismissKeyboardOnSubmit && nextInputRef?.current) {
        nextInputRef.current.focus();
        return;
      }
      if (dismissKeyboardOnSubmit) {
        Keyboard.dismiss();
      }
    };

    return (
      <View style={[styles.fieldBlock, containerStyle]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View
          style={[
            styles.inputShell,
            {
              borderColor: errorText
                ? mentaTokens.danger
                : focused
                  ? mentaTokens.accent
                  : mentaTokens.dividerStrong,
              minHeight: multiline ? 120 : 54,
            },
          ]}
        >
          <TextInput
            {...props}
            ref={inputRef}
            multiline={multiline}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor ?? mentaTokens.textFaint}
            onFocus={event => {
              setFocused(true);
              props.onFocus?.(event);
            }}
            onBlur={event => {
              setFocused(false);
              props.onBlur?.(event);
            }}
            onSubmitEditing={handleSubmit}
            blurOnSubmit={dismissKeyboardOnSubmit || !nextInputRef}
            returnKeyType={returnKeyType ?? (nextInputRef ? 'next' : 'done')}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              inputStyle,
            ]}
          />
          {right ? <View style={styles.inputRight}>{right}</View> : null}
        </View>
        {errorText ? (
          <Text style={styles.fieldError}>{errorText}</Text>
        ) : helperText ? (
          <Text style={styles.fieldHelper}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

MentaTextField.displayName = 'MentaTextField';

export const MentaSecureField = forwardRef<MentaFieldRef, MentaTextFieldProps>(
  (props, ref) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    return (
      <MentaTextField
        {...props}
        ref={ref}
        secureTextEntry={!visible}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              visible
                ? t('fullAuth.component_onboarding_mentasurface.hide_password')
                : t('fullAuth.component_onboarding_mentasurface.show_password')
            }
            onPress={() => setVisible(current => !current)}
            style={({ pressed }) => [
              styles.eyeButton,
              pressed && styles.pressed,
            ]}
          >
            {visible ? (
              <EyeOffIcon size={18} color={mentaTokens.textMuted} />
            ) : (
              <EyeIcon size={18} color={mentaTokens.textMuted} />
            )}
          </Pressable>
        }
      />
    );
  }
);

MentaSecureField.displayName = 'MentaSecureField';

export const MentaDivider: React.FC<{ label?: string }> = ({ label }) => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    {label ? <Text style={styles.dividerLabel}>{label}</Text> : null}
    <View style={styles.dividerLine} />
  </View>
);

export const MentaNotice: React.FC<{
  title: string;
  description?: string;
  tone?: 'error' | 'success' | 'warning' | 'info';
}> = ({ title, description, tone = 'info' }) => {
  const color = {
    error: mentaTokens.danger,
    success: mentaTokens.success,
    warning: mentaTokens.warning,
    info: mentaTokens.textMuted,
  }[tone];

  return (
    <View style={[styles.notice, { borderColor: color }]}>
      <Text style={styles.noticeTitle}>{title}</Text>
      {description ? (
        <Text style={styles.noticeText}>{description}</Text>
      ) : null}
    </View>
  );
};

export const MentaPillToggle = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: {
    label: string;
    value: T;
    testID?: string;
  }[];
  value: T;
  onChange: (next: T) => void;
}) => (
  <View style={styles.toggleShell}>
    {options.map(option => {
      const selected = option.value === value;
      return (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => onChange(option.value)}
          testID={option.testID}
          style={({ pressed }) => [
            styles.toggleItem,
            selected && styles.toggleItemSelected,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.toggleText, selected && styles.toggleTextSelected]}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export const MentaOptionRow: React.FC<{
  title: string;
  description?: string;
  meta?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
  right?: React.ReactNode;
}> = ({
  title,
  description,
  meta,
  selected = false,
  disabled = false,
  onPress,
  testID,
  right,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected, disabled }}
    disabled={disabled}
    onPress={onPress}
    testID={testID}
    style={({ pressed }) => [
      styles.optionRow,
      selected && styles.optionRowSelected,
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
    ]}
  >
    <View style={styles.optionCopy}>
      {meta ? <Text style={styles.optionMeta}>{meta}</Text> : null}
      <Text style={styles.optionTitle}>{title}</Text>
      {description ? (
        <Text style={styles.optionDescription}>{description}</Text>
      ) : null}
    </View>
    <View style={styles.optionRightStack}>
      {right ? <View style={styles.optionIcon}>{right}</View> : null}
      <View
        style={[styles.radio, selected && styles.radioSelected]}
        pointerEvents="none"
      >
        {selected ? <CheckIcon size={13} color={mentaTokens.inverse} /> : null}
      </View>
    </View>
  </Pressable>
);

export const MentaStepHeader: React.FC<{
  step: number;
  totalSteps: number;
  label: string;
}> = ({ step, totalSteps, label }) => {
  const { t } = useTranslation();
  const progress = `${
    Math.max(0, Math.min(1, step / totalSteps)) * 100
  }%` as ViewStyle['width'];

  return (
    <View style={styles.stepHeader}>
      <View style={styles.stepMetaRow}>
        <Text style={styles.stepMeta}>
          {t('fullAuth.component_onboarding_mentasurface.setup')} {step}/
          {totalSteps}
        </Text>
        <Text style={styles.stepMeta}>{label}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progress }]} />
      </View>
    </View>
  );
};

export const MentaProcessRail: React.FC<{
  items: {
    label: string;
    value: string;
  }[];
}> = ({ items }) => (
  <View style={styles.processRail}>
    {items.map((item, index) => (
      <View key={item.label} style={styles.processItem}>
        <View style={styles.processIndex}>
          <Text style={styles.processIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.processCopy}>
          <Text style={styles.processLabel}>{item.label}</Text>
          <Text style={styles.processValue}>{item.value}</Text>
        </View>
      </View>
    ))}
  </View>
);

export const MentaSummaryRow: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

export const MentaLinkRow: React.FC<{
  text: string;
  action: string;
  onPress: () => void;
}> = ({ text, action, onPress }) => (
  <View style={styles.linkRow}>
    <Text style={styles.linkText}>{text}</Text>
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.linkAction, pressed && styles.pressed]}
    >
      <Text style={styles.linkActionText}>{action}</Text>
      <ChevronRightIcon size={15} color={mentaTokens.text} />
    </Pressable>
  </View>
);

export const MentaLoadingOverlay: React.FC<{ label: string }> = ({ label }) => (
  <View
    accessible
    accessibilityLabel={label}
    accessibilityRole="progressbar"
    pointerEvents="none"
    style={styles.loadingOverlay}
  >
    <View style={styles.loadingPill}>
      <View style={styles.loadingBones}>
        <SkeletonLoader announce={false} height={12} width={116} />
        <SkeletonLoader announce={false} height={9} width={82} />
      </View>
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mentaTokens.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: mentaSpacing[6],
    paddingTop: mentaSpacing[3],
    paddingBottom: 36,
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarBackOnly: {
    justifyContent: 'flex-start',
  },
  topBarSide: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: mentaRadii.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mentaTokens.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaTokens.dividerStrong,
  },
  wordmark: {
    color: mentaTokens.text,
    ...mentaTypography.bodySemibold,
  },
  heroStack: {
    gap: 14,
    paddingTop: 16,
    paddingBottom: 22,
  },
  heroStackCenter: {
    alignItems: 'center',
  },
  headingBlock: {
    gap: 12,
  },
  headingBlockCenter: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  eyebrow: {
    color: mentaTokens.accent,
    ...mentaTypography.label,
  },
  title: {
    color: mentaTokens.text,
    ...mentaTypography.heading,
  },
  subtitle: {
    color: mentaTokens.textMuted,
    ...mentaTypography.body,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaTokens.divider,
    backgroundColor: mentaTokens.canvas,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: mentaSpacing[6],
    paddingTop: 14,
    paddingBottom: 18,
  },
  button: {
    borderRadius: mentaRadii.medium,
    minHeight: 56,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    ...mentaTypography.control,
  },
  fieldBlock: {
    gap: 9,
  },
  fieldLabel: {
    color: mentaTokens.text,
    ...mentaTypography.caption,
    fontFamily: mentaTypography.bodySemibold.fontFamily,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaTokens.panelRaised,
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    color: mentaTokens.text,
    ...mentaTypography.control,
    fontFamily: mentaTypography.body.fontFamily,
    minHeight: 56,
    paddingVertical: 15,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputRight: {
    marginLeft: 10,
  },
  eyeButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    color: mentaTokens.danger,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  fieldHelper: {
    color: mentaTokens.textFaint,
    fontSize: 13,
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: mentaTokens.divider,
  },
  dividerLabel: {
    color: mentaTokens.textFaint,
    fontSize: 13,
    fontWeight: '700',
  },
  notice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.medium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: mentaTokens.panel,
  },
  noticeTitle: {
    color: mentaTokens.text,
    ...mentaTypography.bodySemibold,
  },
  noticeText: {
    color: mentaTokens.textMuted,
    ...mentaTypography.caption,
    marginTop: 3,
  },
  toggleShell: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: mentaTokens.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaTokens.divider,
  },
  toggleItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  toggleItemSelected: {
    backgroundColor: mentaTokens.accent,
  },
  toggleText: {
    color: mentaTokens.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  toggleTextSelected: {
    color: mentaTokens.inverse,
  },
  optionRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaTokens.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
  },
  optionRowSelected: {
    borderTopColor: mentaTokens.text,
  },
  optionCopy: {
    flex: 1,
    gap: 5,
  },
  optionMeta: {
    color: mentaTokens.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  optionTitle: {
    color: mentaTokens.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  optionDescription: {
    color: mentaTokens.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  optionRightStack: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  optionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaTokens.dividerStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: mentaTokens.accent,
    borderColor: mentaTokens.accent,
  },
  stepHeader: {
    gap: 11,
  },
  stepMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  stepMeta: {
    color: mentaTokens.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 2,
    backgroundColor: mentaTokens.divider,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: mentaTokens.accent,
  },
  processRail: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaTokens.divider,
  },
  processItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaTokens.divider,
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
  },
  processIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: mentaTokens.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processIndexText: {
    color: mentaTokens.inverse,
    fontSize: 13,
    fontWeight: '900',
  },
  processCopy: {
    flex: 1,
    gap: 3,
  },
  processLabel: {
    color: mentaTokens.text,
    fontSize: 15,
    fontWeight: '800',
  },
  processValue: {
    color: mentaTokens.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaTokens.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 13,
  },
  summaryLabel: {
    color: mentaTokens.textFaint,
    fontSize: 13,
    fontWeight: '800',
  },
  summaryValue: {
    color: mentaTokens.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'right',
  },
  linkRow: {
    alignItems: 'center',
    gap: 9,
    paddingTop: 2,
  },
  linkText: {
    color: mentaTokens.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  linkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 34,
  },
  linkActionText: {
    color: mentaTokens.text,
    fontSize: 14,
    fontWeight: '800',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPill: {
    alignItems: 'center',
    backgroundColor: mentaTokens.panel,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaTokens.dividerStrong,
    gap: mentaSpacing[3],
    minWidth: 176,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  loadingText: {
    color: mentaTokens.text,
    textAlign: 'center',
    ...mentaTypography.caption,
  },
  loadingBones: {
    alignItems: 'center',
    gap: mentaSpacing[2],
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.42,
  },
});
