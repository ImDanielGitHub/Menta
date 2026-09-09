import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import {
  DatePicker as ExpoDatePicker,
  Host,
  SecureField as ExpoSecureField,
  type SecureFieldRef as ExpoSecureFieldRef,
  TextField as ExpoTextField,
  type TextFieldRef as ExpoTextFieldRef,
  Toggle as ExpoToggle,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  accessibilityHint as swiftUIAccessibilityHint,
  accessibilityLabel as swiftUIAccessibilityLabel,
  font as swiftUIFont,
} from '@expo/ui/swift-ui/modifiers';
import NativeDatePicker from 'react-native-date-picker';
import { ChevronRightIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icons';
import {
  AppScaledText as Text,
  useAppTextScale,
} from '@/components/ui/AppScaledText';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { composeSpokenLabel } from '@/lib/accessibility';
import { scaleTypeMetrics } from '@/constants/phone-layout';
import { useTranslation } from '@/lib/localization/use-translation';

const AndroidDatePicker = Platform.OS === 'android' ? NativeDatePicker : null;

export interface AppTextFieldRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

export interface AppTextFieldProps extends Omit<
  TextInputProps,
  'style' | 'blurOnSubmit'
> {
  label?: string;
  helperText?: string;
  errorText?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
  nextInputRef?: React.RefObject<AppTextFieldRef | null>;
  dismissKeyboardOnSubmit?: boolean;
  onSubmitEditing?: () => void;
  textScale?: number;
}

const canUseExpoField = ({
  multiline,
  editable,
}: {
  multiline?: boolean;
  editable?: boolean;
}) => Platform.OS === 'ios' && !multiline && editable !== false;

export const AppTextField = forwardRef<AppTextFieldRef, AppTextFieldProps>(
  (
    {
      label,
      helperText,
      errorText,
      left,
      right,
      containerStyle,
      fieldStyle,
      inputStyle,
      nextInputRef,
      dismissKeyboardOnSubmit = false,
      onSubmitEditing,
      textScale: requestedTextScale,
      value,
      defaultValue,
      placeholder,
      editable,
      multiline,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const inheritedTextScale = useAppTextScale();
    const textScale = requestedTextScale ?? inheritedTextScale ?? undefined;
    const expoRef = useRef<ExpoTextFieldRef | null>(null);
    const expoTextState = useNativeState(String(defaultValue ?? value ?? ''));
    const nativeRef = useRef<TextInput | null>(null);
    const [focused, setFocused] = useState(false);
    const lastValueRef = useRef(value ?? defaultValue ?? '');

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (canUseExpoField({ multiline, editable })) {
          void expoRef.current?.focus();
          return;
        }
        nativeRef.current?.focus();
      },
      blur: () => {
        if (canUseExpoField({ multiline, editable })) {
          void expoRef.current?.blur();
          return;
        }
        nativeRef.current?.blur();
      },
      clear: () => {
        lastValueRef.current = '';
        if (canUseExpoField({ multiline, editable })) {
          expoTextState.set('');
          props.onChangeText?.('');
          return;
        }
        nativeRef.current?.clear();
        props.onChangeText?.('');
      },
      isFocused: () => focused,
    }));

    useEffect(() => {
      if (value === undefined) {
        return;
      }
      const nextValue = String(value);
      if (!canUseExpoField({ multiline, editable })) {
        return;
      }
      if (nextValue === lastValueRef.current) {
        return;
      }
      lastValueRef.current = nextValue;
      expoTextState.set(nextValue);
    }, [editable, expoTextState, multiline, value]);

    const handleSubmit = () => {
      onSubmitEditing?.();
      if (!dismissKeyboardOnSubmit && nextInputRef?.current) {
        nextInputRef.current.focus();
      }
    };

    const resolvedError = errorText;
    const borderColor = resolvedError
      ? theme.colors.status.error
      : focused
        ? theme.colors.interactive.primary
        : theme.colors.border.primary;

    const showExpoField = canUseExpoField({ multiline, editable });
    const resolvedAccessibilityLabel =
      props.accessibilityLabel ?? label ?? placeholder;
    const scaledInputStyle =
      textScale == null
        ? undefined
        : scaleTypeMetrics(
            StyleSheet.flatten([styles.nativeInput, inputStyle]) ?? {},
            textScale
          );
    const swiftModifiers = [
      ...(resolvedAccessibilityLabel
        ? [swiftUIAccessibilityLabel(resolvedAccessibilityLabel)]
        : []),
      ...(textScale == null
        ? []
        : [
            swiftUIFont({
              size: scaleTypeMetrics(mentaTypography.body, textScale).fontSize,
            }),
          ]),
    ];

    return (
      <View style={containerStyle}>
        {label ? (
          <Text
            style={[styles.label, { color: theme.colors.text.primary }]}
            textScale={textScale}
          >
            {label}
          </Text>
        ) : null}
        <View
          style={[
            styles.fieldShell,
            {
              backgroundColor: theme.colors.background.surface,
              borderColor,
              minHeight: multiline ? 120 : 56,
            },
            fieldStyle,
          ]}
        >
          {left ? <View style={styles.side}>{left}</View> : null}
          <View style={styles.fieldBody}>
            {showExpoField ? (
              <Host style={styles.swiftUIHost}>
                <ExpoTextField
                  ref={expoRef}
                  text={expoTextState}
                  placeholder={placeholder}
                  modifiers={
                    swiftModifiers.length > 0 ? swiftModifiers : undefined
                  }
                  onTextChange={(nextValue: string) => {
                    lastValueRef.current = nextValue;
                    props.onChangeText?.(nextValue);
                  }}
                  onFocusChange={setFocused}
                  autoFocus={props.autoFocus}
                  testID={props.testID}
                />
              </Host>
            ) : (
              <TextInput
                {...props}
                ref={nativeRef}
                value={value}
                defaultValue={defaultValue}
                placeholder={placeholder}
                accessibilityLabel={resolvedAccessibilityLabel}
                editable={editable}
                multiline={multiline}
                allowFontScaling={
                  textScale == null ? props.allowFontScaling : false
                }
                onFocus={event => {
                  setFocused(true);
                  props.onFocus?.(event);
                }}
                onBlur={event => {
                  setFocused(false);
                  props.onBlur?.(event);
                }}
                onSubmitEditing={() => handleSubmit()}
                style={[
                  styles.nativeInput,
                  {
                    color: theme.colors.text.primary,
                    minHeight: multiline ? 90 : undefined,
                  },
                  inputStyle,
                  scaledInputStyle,
                ]}
                placeholderTextColor={
                  props.placeholderTextColor ?? theme.colors.text.placeholder
                }
              />
            )}
          </View>
          {right ? <View style={styles.side}>{right}</View> : null}
        </View>
        {resolvedError ? (
          <Text
            style={[styles.helper, { color: theme.colors.status.error }]}
            textScale={textScale}
          >
            {resolvedError}
          </Text>
        ) : helperText ? (
          <Text
            style={[styles.helper, { color: theme.colors.text.secondary }]}
            textScale={textScale}
          >
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  }
);

AppTextField.displayName = 'AppTextField';

export const AppSecureField = forwardRef<AppTextFieldRef, AppTextFieldProps>(
  (
    {
      label,
      helperText,
      errorText,
      containerStyle,
      inputStyle,
      nextInputRef,
      dismissKeyboardOnSubmit = false,
      onSubmitEditing,
      textScale: requestedTextScale,
      value,
      defaultValue,
      placeholder,
      editable,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const inheritedTextScale = useAppTextScale();
    const textScale = requestedTextScale ?? inheritedTextScale ?? undefined;
    const expoRef = useRef<ExpoSecureFieldRef | null>(null);
    const expoTextState = useNativeState(String(defaultValue ?? value ?? ''));
    const nativeRef = useRef<TextInput | null>(null);
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const lastValueRef = useRef(value ?? defaultValue ?? '');

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (Platform.OS === 'ios' && editable !== false && !visible) {
          void expoRef.current?.focus();
          return;
        }
        nativeRef.current?.focus();
      },
      blur: () => {
        if (Platform.OS === 'ios' && editable !== false && !visible) {
          void expoRef.current?.blur();
          return;
        }
        nativeRef.current?.blur();
      },
      clear: () => {
        lastValueRef.current = '';
        if (Platform.OS === 'ios' && editable !== false && !visible) {
          expoTextState.set('');
          props.onChangeText?.('');
          return;
        }
        nativeRef.current?.clear();
        props.onChangeText?.('');
      },
      isFocused: () => focused,
    }));

    useEffect(() => {
      if (value === undefined) {
        return;
      }
      const nextValue = String(value);
      if (!(Platform.OS === 'ios' && editable !== false && !visible)) {
        return;
      }
      if (nextValue === lastValueRef.current) {
        return;
      }
      lastValueRef.current = nextValue;
      expoTextState.set(nextValue);
    }, [editable, expoTextState, value, visible]);

    const handleSubmit = () => {
      onSubmitEditing?.();
      if (!dismissKeyboardOnSubmit && nextInputRef?.current) {
        nextInputRef.current.focus();
      }
    };

    const borderColor = errorText
      ? theme.colors.status.error
      : focused
        ? theme.colors.interactive.primary
        : theme.colors.border.primary;

    const showExpoSecureField =
      Platform.OS === 'ios' && editable !== false && !visible;
    const resolvedAccessibilityLabel =
      props.accessibilityLabel ?? label ?? placeholder;
    const scaledInputStyle =
      textScale == null
        ? undefined
        : scaleTypeMetrics(
            StyleSheet.flatten([styles.nativeInput, inputStyle]) ?? {},
            textScale
          );
    const swiftModifiers = [
      ...(resolvedAccessibilityLabel
        ? [swiftUIAccessibilityLabel(resolvedAccessibilityLabel)]
        : []),
      ...(textScale == null
        ? []
        : [
            swiftUIFont({
              size: scaleTypeMetrics(mentaTypography.body, textScale).fontSize,
            }),
          ]),
    ];

    return (
      <View style={containerStyle}>
        {label ? (
          <Text
            style={[styles.label, { color: theme.colors.text.primary }]}
            textScale={textScale}
          >
            {label}
          </Text>
        ) : null}
        <View
          style={[
            styles.fieldShell,
            {
              backgroundColor: theme.colors.background.surface,
              borderColor,
              minHeight: 56,
            },
          ]}
        >
          <View style={styles.fieldBody}>
            {showExpoSecureField ? (
              <Host style={styles.swiftUIHost}>
                <ExpoSecureField
                  ref={expoRef}
                  text={expoTextState}
                  placeholder={placeholder}
                  modifiers={
                    swiftModifiers.length > 0 ? swiftModifiers : undefined
                  }
                  onTextChange={(nextValue: string) => {
                    lastValueRef.current = nextValue;
                    props.onChangeText?.(nextValue);
                  }}
                  onFocusChange={setFocused}
                  autoFocus={props.autoFocus}
                  testID={props.testID}
                />
              </Host>
            ) : (
              <TextInput
                {...props}
                ref={nativeRef}
                value={value}
                defaultValue={defaultValue}
                placeholder={placeholder}
                accessibilityLabel={resolvedAccessibilityLabel}
                editable={editable}
                secureTextEntry={!visible}
                allowFontScaling={
                  textScale == null ? props.allowFontScaling : false
                }
                onFocus={event => {
                  setFocused(true);
                  props.onFocus?.(event);
                }}
                onBlur={event => {
                  setFocused(false);
                  props.onBlur?.(event);
                }}
                onSubmitEditing={() => handleSubmit()}
                style={[
                  styles.nativeInput,
                  { color: theme.colors.text.primary },
                  inputStyle,
                  scaledInputStyle,
                ]}
                placeholderTextColor={
                  props.placeholderTextColor ?? theme.colors.text.placeholder
                }
              />
            )}
          </View>
          <Pressable
            accessibilityLabel={
              visible
                ? t('shared.accessibility.hidePassword')
                : t('shared.accessibility.showPassword')
            }
            accessibilityRole="button"
            accessibilityState={{ expanded: visible }}
            onPress={() => setVisible(current => !current)}
            style={styles.passwordToggle}
          >
            {visible ? (
              <EyeOffIcon size={18} color={theme.colors.text.secondary} />
            ) : (
              <EyeIcon size={18} color={theme.colors.text.secondary} />
            )}
          </Pressable>
        </View>
        {errorText ? (
          <Text
            style={[styles.helper, { color: theme.colors.status.error }]}
            textScale={textScale}
          >
            {errorText}
          </Text>
        ) : helperText ? (
          <Text
            style={[styles.helper, { color: theme.colors.text.secondary }]}
            textScale={textScale}
          >
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  }
);

AppSecureField.displayName = 'AppSecureField';

export const AppTextArea = forwardRef<AppTextFieldRef, AppTextFieldProps>(
  (props, ref) => (
    <AppTextField
      {...props}
      ref={ref}
      multiline
      inputStyle={[styles.textArea, props.inputStyle]}
    />
  )
);

AppTextArea.displayName = 'AppTextArea';

export const AppKeyboardDoneAccessory: React.FC<{
  nativeID: string;
  label?: string;
}> = ({ nativeID, label }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('shared.action.done');
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View
        style={[
          styles.keyboardAccessory,
          {
            backgroundColor: theme.colors.background.surface,
            borderTopColor: theme.colors.border.primary,
          },
        ]}
      >
        <Pressable
          accessibilityLabel={t('shared.accessibility.doneEditing')}
          accessibilityRole="button"
          onPress={() => Keyboard.dismiss()}
          style={({ pressed }) => [
            styles.keyboardAccessoryAction,
            pressed && styles.keyboardAccessoryPressed,
          ]}
        >
          <Text
            style={[
              styles.keyboardAccessoryLabel,
              { color: theme.colors.interactive.primary },
            ]}
          >
            {resolvedLabel}
          </Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
};

export const AppFormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => {
  const theme = useTheme();
  return (
    <View style={styles.formSection}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            styles.sectionDescription,
            { color: theme.colors.text.secondary },
          ]}
        >
          {description}
        </Text>
      ) : null}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.background.card,
            borderColor: theme.colors.border.primary,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

export const AppSwitchRow: React.FC<{
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  showDivider?: boolean;
}> = ({ title, subtitle, value, onChange, showDivider = true }) => {
  const theme = useTheme();
  const iosToggleModifiers = [
    swiftUIAccessibilityLabel(title),
    ...(subtitle ? [swiftUIAccessibilityHint(subtitle)] : []),
  ];
  const copy = (
    <View
      importantForAccessibility="no-hide-descendants"
      style={styles.rowBody}
    >
      <Text
        accessible={false}
        style={[styles.rowTitle, { color: theme.colors.text.primary }]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          accessible={false}
          style={[styles.rowSubtitle, { color: theme.colors.text.secondary }]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          styles.row,
          showDividerStyle(showDivider, theme.colors.border.primary),
        ]}
      >
        {copy}
        <Host style={styles.swiftUISwitchHost}>
          <ExpoToggle
            isOn={value}
            modifiers={iosToggleModifiers}
            onIsOnChange={onChange}
          />
        </Host>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={subtitle}
      accessibilityLabel={title}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={[
        styles.row,
        showDividerStyle(showDivider, theme.colors.border.primary),
      ]}
    >
      {copy}
      <View
        accessible={false}
        importantForAccessibility="no"
        style={[
          styles.fakeSwitch,
          {
            backgroundColor: value
              ? theme.colors.interactive.primary
              : theme.colors.background.secondary,
          },
        ]}
      >
        <View
          style={[
            styles.fakeThumb,
            value && styles.fakeThumbOn,
            {
              backgroundColor: value
                ? theme.colors.text.inverse
                : theme.colors.text.primary,
            },
          ]}
        />
      </View>
    </Pressable>
  );
};

export const AppFieldRow: React.FC<{
  title: string;
  subtitle?: string;
  value?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
  showDivider?: boolean;
  testID?: string;
}> = ({
  title,
  subtitle,
  value,
  icon,
  onPress,
  trailing,
  destructive = false,
  showChevron = true,
  showDivider = true,
  testID,
}) => {
  const theme = useTheme();
  const spokenLabel = composeSpokenLabel(title, subtitle, value);
  const hideNestedText = Boolean(onPress);
  const content = (
    <>
      <View style={styles.rowLeading}>
        {icon ? <View style={styles.rowIcon}>{icon}</View> : null}
        <View style={styles.rowBody}>
          <Text
            accessible={!hideNestedText}
            style={[
              styles.rowTitle,
              {
                color: destructive
                  ? theme.colors.status.error
                  : theme.colors.text.primary,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              accessible={!hideNestedText}
              style={[
                styles.rowSubtitle,
                { color: theme.colors.text.secondary },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rowTrailing}>
        {value ? (
          <Text
            accessible={!hideNestedText}
            style={[
              styles.rowValue,
              {
                color: destructive
                  ? theme.colors.status.error
                  : theme.colors.text.secondary,
              },
            ]}
          >
            {value}
          </Text>
        ) : null}
        {trailing}
        {onPress && showChevron ? (
          <ChevronRightIcon size={18} color={theme.colors.text.tertiary} />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View
        testID={testID}
        style={[
          styles.row,
          showDividerStyle(showDivider, theme.colors.border.primary),
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={spokenLabel}
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDividerStyle(showDivider, theme.colors.border.primary),
        pressed && styles.rowPressed,
      ]}
    >
      {content}
    </Pressable>
  );
};

export const AppSelectRow: React.FC<{
  title: string;
  subtitle?: string;
  value?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  showDivider?: boolean;
}> = ({ title, subtitle, value, icon, onPress, showDivider = true }) => (
  <AppFieldRow
    title={title}
    subtitle={subtitle}
    value={value}
    icon={icon}
    onPress={onPress}
    showDivider={showDivider}
  />
);

export const AppDateTimeRow: React.FC<{
  title: string;
  subtitle?: string;
  value: Date;
  onChange: (date: Date) => void;
  showDivider?: boolean;
}> = ({ title, subtitle, value, onChange, showDivider = true }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View>
      <Pressable
        accessibilityHint={subtitle}
        accessibilityLabel={composeSpokenLabel(title, label)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(current => !current)}
        style={[
          styles.row,
          showDividerStyle(showDivider, theme.colors.border.primary),
        ]}
      >
        <View style={styles.rowBody}>
          <Text
            accessible={false}
            style={[styles.rowTitle, { color: theme.colors.text.primary }]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              accessible={false}
              style={[
                styles.rowSubtitle,
                { color: theme.colors.text.secondary },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text
          accessible={false}
          style={[styles.rowValue, { color: theme.colors.brand.secondary }]}
        >
          {label}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.datePickerWrap}>
          {Platform.OS === 'ios' ? (
            <Host style={styles.swiftUIDatePickerHost}>
              <ExpoDatePicker
                selection={value}
                displayedComponents={['hourAndMinute']}
                onDateChange={onChange}
              />
            </Host>
          ) : AndroidDatePicker ? (
            <AndroidDatePicker
              date={value}
              mode="time"
              onDateChange={onChange}
            />
          ) : (
            <Text
              style={[styles.helper, { color: theme.colors.text.secondary }]}
            >
              {t('shared.fields.timePickerUnavailable')}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
};

const showDividerStyle = (showDivider: boolean, borderColor: string) =>
  showDivider
    ? {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: borderColor,
      }
    : null;

const styles = StyleSheet.create({
  keyboardAccessory: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[4],
  },
  keyboardAccessoryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    minWidth: 64,
  },
  keyboardAccessoryLabel: {
    ...mentaTypography.bodySemibold,
  },
  keyboardAccessoryPressed: { opacity: 0.64 },
  // A field label tells the person what to type, so it is readable sentence-case
  // text rather than a 12pt bold micro-label.
  label: {
    ...mentaTypography.bodySmallMedium,
    marginBottom: mentaSpacing[2],
  },
  fieldShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: mentaRadii.medium,
    paddingHorizontal: mentaSpacing[4],
  },
  fieldBody: {
    flex: 1,
    justifyContent: 'center',
  },
  swiftUIHost: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
  },
  swiftUISwitchHost: {
    width: 52,
    minHeight: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
  },
  swiftUIDatePickerHost: {
    minHeight: 120,
  },
  nativeInput: {
    ...mentaTypography.body,
    minHeight: 52,
    paddingVertical: mentaSpacing[3],
  },
  side: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordToggle: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  helper: {
    ...mentaTypography.caption,
    marginTop: mentaSpacing[2],
  },
  textArea: {
    textAlignVertical: 'top',
  },
  formSection: {
    gap: mentaSpacing[3],
  },
  sectionTitle: {
    ...mentaTypography.labelBold,
    textTransform: 'uppercase',
  },
  sectionDescription: {
    ...mentaTypography.bodySmall,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: mentaRadii.medium,
    overflow: 'hidden',
  },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  rowPressed: {
    opacity: 0.9,
  },
  rowLeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: mentaSpacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    paddingRight: mentaSpacing[3],
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[2],
    marginLeft: mentaSpacing[3],
  },
  rowTitle: {
    ...mentaTypography.bodyMedium,
  },
  rowSubtitle: {
    ...mentaTypography.caption,
    marginTop: mentaSpacing[1],
  },
  rowValue: {
    ...mentaTypography.bodySmallMedium,
  },
  fakeSwitch: {
    width: 52,
    height: 32,
    borderRadius: mentaRadii.round,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  fakeThumb: {
    width: 26,
    height: 26,
    borderRadius: mentaRadii.round,
  },
  fakeThumbOn: {
    alignSelf: 'flex-end',
  },
  datePickerWrap: {
    paddingHorizontal: mentaSpacing[2],
    paddingBottom: mentaSpacing[3],
  },
});
