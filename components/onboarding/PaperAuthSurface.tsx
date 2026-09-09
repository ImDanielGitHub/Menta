import { useTranslation } from '@/lib/localization';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Image,
  type ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showToast } from '@/components/ui/Toast';
import {
  AppScaledText as Text,
  AppTextScaleProvider,
  useAppTextScale,
} from '@/components/ui/AppScaledText';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from '@/components/ui/icons';
import {
  loadOnboardingDraft,
  type OnboardingDraft,
} from '@/lib/onboarding-draft';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

import { mentaFonts, useMentaFonts } from '@/lib/menta-fonts';
import { googleProviderLabelTypography } from '@/components/ui/google-provider-style';
import {
  APP_COMMUNITY_STANDARDS_URL,
  APP_PRIVACY_URL,
  APP_TERMS_URL,
} from '@/constants/LegalLinks';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { scaleTypeMetrics } from '@/constants/phone-layout';

export const paperAuthTokens = {
  canvas: mentaColors.canvas,
  surface: mentaColors.surface,
  raised: mentaColors.raised,
  border: mentaColors.border,
  paper: mentaColors.paper,
  text: mentaColors.text.primary,
  muted: mentaColors.text.secondary,
  mutedPaper: mentaColors.text.mutedOnPaper,
  action: mentaColors.action,
  danger: mentaColors.danger,
  success: mentaColors.success,
  successSoft: mentaColors.successSoft,
  warning: mentaColors.warning,
} as const;

export const paperAuthFonts = {
  googleSansMedium: mentaFonts.provider.google,
  inter: mentaFonts.inter.regular,
  interMedium: mentaFonts.inter.medium,
  interBold: mentaFonts.inter.bold,
  newsreader: mentaFonts.newsreader.regular,
  newsreaderMedium: mentaFonts.newsreader.medium,
} as const;

const welcomeBackMascot =
  require('../../assets/images/mascot/welcome-back.png') as ImageSourcePropType;
export const usePaperAuthFonts = useMentaFonts;

export function usePaperAuthDraft(
  override?: OnboardingDraft | null
): OnboardingDraft | null {
  const [draft, setDraft] = useState<OnboardingDraft | null>(override ?? null);

  useEffect(() => {
    if (override !== undefined) {
      setDraft(override);
      return;
    }

    let mounted = true;
    void loadOnboardingDraft()
      .then(nextDraft => {
        if (mounted) setDraft(nextDraft);
      })
      .catch(() => {
        if (mounted) setDraft(null);
      });

    return () => {
      mounted = false;
    };
  }, [override]);

  return draft;
}

export interface PaperAuthFrameProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export const PaperAuthFrame: React.FC<PaperAuthFrameProps> = ({
  children,
  contentContainerStyle,
  testID = 'paper-auth-frame',
}) => {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  return (
    <AppTextScaleProvider scale={phoneLayout.textScale}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            accessibilityLabel={t(
              'fullAuth.component_onboarding_paperauthsurface.menta_authentication'
            )}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: phoneLayout.screenInset },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            testID={testID}
          >
            <View style={styles.brandRow}>
              <Text style={styles.wordmark}>
                {t('fullAuth.component_onboarding_paperauthsurface.menta')}
              </Text>
            </View>

            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppTextScaleProvider>
  );
};

export const PaperAuthContextCard: React.FC<{
  label: string;
  value: string;
  detail?: string;
  compact?: boolean;
  testID?: string;
}> = ({ label, value, detail, compact = false, testID }) => (
  <View
    style={[styles.contextCard, compact && styles.contextCardCompact]}
    testID={testID}
  >
    <Text style={styles.contextLabel}>{label}</Text>
    <Text style={[styles.contextValue, compact && styles.contextValueCompact]}>
      {value}
    </Text>
    {detail ? <Text style={styles.contextDetail}>{detail}</Text> : null}
  </View>
);

export const PaperAuthPromiseCard: React.FC<{
  draft: OnboardingDraft | null;
  testID?: string;
}> = ({ draft, testID = 'paper-auth-promise-card' }) => {
  const { t } = useTranslation();
  if (!draft?.promise.trim()) return null;

  return (
    <PaperAuthContextCard
      label={t('fullAuth.component_onboarding_paperauthsurface.returning_to')}
      value={draft.promise.trim()}
      testID={testID}
    />
  );
};

type PaperAuthHeadingSize = 'large' | 'medium' | 'check';

export const PaperAuthHeading: React.FC<{
  title: string;
  subtitle?: string;
  size?: PaperAuthHeadingSize;
  testID?: string;
}> = ({ title, subtitle, size = 'medium', testID }) => (
  <View
    style={[styles.headingBlock, size === 'large' && styles.headingLarge]}
    testID={testID ? `${testID}-block` : undefined}
  >
    <Text
      style={[
        styles.heading,
        size === 'large' && styles.headingLargeText,
        size === 'check' && styles.headingCheckText,
      ]}
      testID={testID}
    >
      {title}
    </Text>
    {subtitle ? <Text style={styles.headingSubtitle}>{subtitle}</Text> : null}
  </View>
);

export const PaperAuthButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'action' | 'paper' | 'google' | 'muted';
  disabled?: boolean;
  loading?: boolean;
  loadingTitle?: string;
  loadingProgress?: number;
  textScale?: number;
  icon?: React.ReactNode;
  testID?: string;
}> = ({
  title,
  onPress,
  variant = 'action',
  disabled = false,
  loading = false,
  loadingTitle,
  loadingProgress,
  textScale,
  icon,
  testID,
}) => {
  const isDisabled = disabled || loading;
  const visibleTitle = loading ? (loadingTitle ?? title) : title;
  const progress = Math.min(Math.max(loadingProgress ?? 0.56, 0), 1);

  return (
    <Pressable
      accessibilityLabel={visibleTitle}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'paper' && styles.buttonPaper,
        variant === 'google' && styles.buttonGoogle,
        variant === 'muted' && styles.buttonMuted,
        loading && variant === 'action' && styles.buttonLoadingAction,
        isDisabled && !loading && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
      ]}
      testID={testID}
    >
      {loading ? (
        <View
          pointerEvents="none"
          style={[styles.buttonProgress, { width: `${progress * 100}%` }]}
          testID={testID ? `${testID}-progress` : undefined}
        />
      ) : null}
      <View
        style={[
          styles.buttonIconSlot,
          variant === 'google' && styles.buttonGoogleLeadingSlot,
        ]}
      >
        {!loading ? icon : null}
      </View>
      <Text
        style={[
          styles.buttonText,
          variant === 'paper' && styles.buttonPaperText,
          variant === 'google' && styles.buttonGoogleText,
          variant === 'muted' && styles.buttonMutedText,
        ]}
        textScale={textScale}
      >
        {visibleTitle}
      </Text>
      <View
        style={[
          styles.buttonIconSlot,
          variant === 'google' && styles.buttonGoogleTrailingSlot,
        ]}
      />
    </Pressable>
  );
};

export interface PaperAuthFieldRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

export interface PaperAuthTextFieldProps extends Omit<
  TextInputProps,
  'style' | 'onSubmitEditing' | 'blurOnSubmit' | 'secureTextEntry' | 'value'
> {
  label: string;
  value: string;
  errorText?: string;
  helperText?: string;
  labelAccessory?: React.ReactNode;
  nextFieldRef?: React.RefObject<PaperAuthFieldRef | null>;
  secure?: boolean;
  onSubmitEditing?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export const PaperAuthTextField = forwardRef<
  PaperAuthFieldRef,
  PaperAuthTextFieldProps
>(
  (
    {
      label,
      value,
      errorText,
      helperText,
      labelAccessory,
      nextFieldRef,
      secure = false,
      onSubmitEditing,
      containerStyle,
      testID,
      onFocus,
      onBlur,
      onChangeText,
      placeholderTextColor,
      returnKeyType,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const textScale = useAppTextScale();
    const inputRef = useRef<TextInput | null>(null);
    const [focused, setFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        inputRef.current?.clear();
        onChangeText?.('');
      },
      isFocused: () => focused,
    }));

    const handleSubmit = () => {
      onSubmitEditing?.();
      if (nextFieldRef?.current) {
        nextFieldRef.current.focus();
        return;
      }
      Keyboard.dismiss();
    };

    const borderColor = errorText
      ? paperAuthTokens.danger
      : focused
        ? paperAuthTokens.action
        : paperAuthTokens.border;

    return (
      <View style={[styles.fieldBlock, containerStyle]} testID={testID}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {labelAccessory ? (
            <View style={styles.fieldLabelAccessory}>{labelAccessory}</View>
          ) : null}
        </View>
        <View
          style={[
            styles.inputShell,
            {
              borderColor,
              borderWidth: focused || errorText ? 2 : 1,
            },
          ]}
          testID={testID ? `${testID}-shell` : undefined}
        >
          <TextInput
            {...props}
            allowFontScaling={
              textScale == null ? props.allowFontScaling : false
            }
            autoCorrect={props.autoCorrect ?? false}
            placeholderTextColor={placeholderTextColor ?? paperAuthTokens.muted}
            ref={inputRef}
            returnKeyType={returnKeyType ?? (nextFieldRef ? 'next' : 'done')}
            secureTextEntry={secure && !revealed}
            style={[
              styles.input,
              textScale == null
                ? undefined
                : scaleTypeMetrics(styles.input, textScale),
            ]}
            value={value}
            onBlur={event => {
              setFocused(false);
              onBlur?.(event);
            }}
            onChangeText={onChangeText}
            onFocus={event => {
              setFocused(true);
              onFocus?.(event);
            }}
            onSubmitEditing={handleSubmit}
            testID={testID ? `${testID}-input` : undefined}
          />
          {secure ? (
            <Pressable
              accessibilityLabel={
                revealed
                  ? t(
                      'fullAuth.component_onboarding_paperauthsurface.hide_password'
                    )
                  : t(
                      'fullAuth.component_onboarding_paperauthsurface.show_password'
                    )
              }
              accessibilityRole="button"
              onPress={() => setRevealed(current => !current)}
              style={({ pressed }) => [
                styles.visibilityButton,
                pressed && styles.buttonPressed,
              ]}
              testID={testID ? `${testID}-visibility` : undefined}
            >
              {revealed ? (
                <EyeOffIcon size={20} color={paperAuthTokens.muted} />
              ) : (
                <EyeIcon size={20} color={paperAuthTokens.muted} />
              )}
            </Pressable>
          ) : null}
        </View>
        {errorText ? (
          <Text
            style={styles.fieldError}
            testID={testID ? `${testID}-error` : undefined}
          >
            {errorText}
          </Text>
        ) : helperText ? (
          <Text style={styles.fieldHelper}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

PaperAuthTextField.displayName = 'PaperAuthTextField';

export const PaperAuthNotice: React.FC<{
  title: string;
  message: string;
  tone?: 'error' | 'success' | 'warning';
  testID?: string;
}> = ({ title, message, tone = 'error', testID = 'paper-auth-notice' }) => {
  const { t } = useTranslation();
  const color =
    tone === 'success'
      ? paperAuthTokens.success
      : tone === 'warning'
        ? paperAuthTokens.warning
        : paperAuthTokens.danger;

  return (
    <View
      accessible
      accessibilityLabel={t(
        'fullAuth.component_onboarding_paperauthsurface.title_message',
        { title: title, message: message }
      )}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[
        styles.notice,
        { borderColor: `${color}66`, backgroundColor: `${color}14` },
      ]}
      testID={testID}
    >
      {tone === 'success' ? (
        <CheckCircleIcon color={color} size={18} />
      ) : (
        <AlertCircleIcon color={color} size={18} />
      )}
      <View style={styles.noticeCopy}>
        <Text style={[styles.noticeTitle, { color }]}>{title}</Text>
        <Text style={styles.noticeMessage}>{message}</Text>
      </View>
    </View>
  );
};

export const PaperOAuthCancelled: React.FC<{
  hasDraft: boolean;
  onChooseMethod: () => void;
  onKeepDraft: () => void;
  testID?: string;
}> = ({
  hasDraft,
  onChooseMethod,
  onKeepDraft,
  testID = 'paper-oauth-cancelled',
}) => {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.cancelledSafeArea}>
      <ScrollView
        contentContainerStyle={styles.cancelledPage}
        showsVerticalScrollIndicator={false}
        testID={testID}
      >
        <View style={styles.cancelledHeader}>
          <Pressable
            accessibilityLabel={t(
              'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method'
            )}
            accessibilityRole="button"
            onPress={onChooseMethod}
            style={({ pressed }) => [
              styles.cancelledBack,
              pressed && styles.buttonPressed,
            ]}
            testID={`${testID}-back`}
          >
            <ArrowLeftIcon color={paperAuthTokens.text} size={19} />
          </Pressable>
          <View style={styles.cancelledHeaderCopy}>
            <Text style={styles.cancelledHeaderTitle}>
              {t(
                'fullAuth.component_onboarding_paperauthsurface.you_re_still_signed_out'
              )}
            </Text>
          </View>
        </View>

        <View style={styles.cancelledBody}>
          <Text style={styles.cancelledExplanation}>
            {t(
              'fullAuth.component_onboarding_paperauthsurface.the_provider_sheet_was_closed_before_an_account_'
            )}
          </Text>

          {hasDraft ? (
            <View style={styles.cancelledDraftCard}>
              <View style={styles.cancelledDraftRow}>
                <View style={styles.cancelledLockSlot}>
                  <LockIcon color={paperAuthTokens.text} size={21} />
                </View>
                <View style={styles.cancelledDraftCopy}>
                  <Text style={styles.cancelledDraftTitle}>
                    {t(
                      'fullAuth.component_onboarding_paperauthsurface.your_local_promise_is_still_here'
                    )}
                  </Text>
                  <Text style={styles.cancelledDraftDetail}>
                    {t(
                      'fullAuth.component_onboarding_paperauthsurface.you_can_try_again_or_keep_working_without_signin'
                    )}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.cancelledActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onChooseMethod}
            style={({ pressed }) => [
              styles.cancelledPrimary,
              pressed && styles.buttonPressed,
            ]}
            testID={`${testID}-choose-method`}
          >
            <Text style={styles.cancelledPrimaryText}>
              {t(
                'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method'
              )}
            </Text>
          </Pressable>
          {hasDraft ? (
            <Pressable
              accessibilityRole="button"
              onPress={onKeepDraft}
              style={({ pressed }) => [
                styles.cancelledSecondary,
                pressed && styles.buttonPressed,
              ]}
              testID={`${testID}-keep-draft`}
            >
              <Text style={styles.cancelledSecondaryText}>
                {t(
                  'fullAuth.component_onboarding_paperauthsurface.keep_local_draft'
                )}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const PaperAuthTextLink: React.FC<{
  lead: string;
  action: string;
  onPress: () => void;
  testID?: string;
}> = ({ lead, action, onPress, testID }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.textLinkRow,
      pressed && styles.buttonPressed,
    ]}
    testID={testID}
  >
    <Text style={styles.textLinkLead}>{lead}</Text>
    <Text style={styles.textLinkAction}>{action}</Text>
  </Pressable>
);

export const PaperAuthLegal: React.FC<{
  testID?: string;
  textScale?: number;
}> = ({ testID = 'paper-auth-legal', textScale }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.legalBlock} testID={testID}>
      <Text style={styles.legalCopy} textScale={textScale}>
        {t(
          'fullAuth.component_onboarding_paperauthsurface.before_you_use_the_account_you_ll_review_and_acc'
        )}
      </Text>
      <View style={styles.legalLinks}>
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void Linking.openURL(APP_TERMS_URL).catch(() => {
              showToast.error(
                t(
                  'fullAuth.component_onboarding_paperauthsurface.terms_did_not_open'
                ),
                t(
                  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro'
                )
              );
            })
          }
          style={styles.legalLinkHit}
          testID={`${testID}-terms`}
        >
          <Text style={styles.legalLink} textScale={textScale}>
            {t('fullAuth.component_onboarding_paperauthsurface.terms_of_use')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void Linking.openURL(APP_COMMUNITY_STANDARDS_URL).catch(() => {
              showToast.error(
                t(
                  'fullAuth.component_onboarding_paperauthsurface.community_standards_did_not_open'
                ),
                t(
                  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar'
                )
              );
            })
          }
          style={styles.legalLinkHit}
          testID={`${testID}-community-standards`}
        >
          <Text style={styles.legalLink} textScale={textScale}>
            {t(
              'fullAuth.component_onboarding_paperauthsurface.community_standards'
            )}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void Linking.openURL(APP_PRIVACY_URL).catch(() => {
              showToast.error(
                t(
                  'fullAuth.component_onboarding_paperauthsurface.privacy_policy_did_not_open'
                ),
                t(
                  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b'
                )
              );
            })
          }
          style={styles.legalLinkHit}
          testID={`${testID}-privacy`}
        >
          <Text style={styles.legalLink} textScale={textScale}>
            {t('fullAuth.component_onboarding_paperauthsurface.privacy_policy')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export const PaperAuthMascot: React.FC<{
  size?: number;
  source?: ImageSourcePropType;
  testID?: string;
}> = ({
  size = 106,
  source = welcomeBackMascot,
  testID = 'paper-auth-mascot',
}) => {
  const { t } = useTranslation();
  return (
    <Image
      accessibilityLabel={t(
        'fullAuth.component_onboarding_paperauthsurface.menta_mascot'
      )}
      resizeMode="contain"
      source={source}
      style={{ height: size, width: size }}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: paperAuthTokens.canvas,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 18,
    paddingHorizontal: 24,
  },
  brandRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: mentaLayout.taskLane,
    paddingTop: 14,
    width: '100%',
  },
  wordmark: {
    color: paperAuthTokens.text,
    fontFamily: paperAuthFonts.interBold,
    fontSize: 17,
    letterSpacing: -0.34,
    lineHeight: 24,
  },
  cancelledSafeArea: {
    backgroundColor: paperAuthTokens.canvas,
    flex: 1,
  },
  cancelledPage: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: 20,
    maxWidth: mentaLayout.phoneFrameMax,
    paddingBottom: 22,
    paddingHorizontal: 24,
    paddingTop: 2,
    width: '100%',
  },
  cancelledHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 12,
  },
  cancelledBack: {
    alignItems: 'center',
    borderColor: paperAuthTokens.border,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    minWidth: mentaLayout.minimumTouchTarget,
  },
  cancelledHeaderCopy: {
    flex: 1,
  },
  cancelledHeaderTitle: {
    color: paperAuthTokens.text,
    fontFamily: paperAuthFonts.inter,
    fontSize: 16,
    lineHeight: 20,
  },
  cancelledBody: {
    flex: 1,
    gap: 20,
  },
  cancelledExplanation: {
    color: paperAuthTokens.muted,
    fontFamily: paperAuthFonts.inter,
    fontSize: 16,
    lineHeight: 20,
    maxWidth: 330,
  },
  cancelledDraftCard: {
    backgroundColor: paperAuthTokens.surface,
    borderColor: paperAuthTokens.border,
    borderRadius: 6,
    borderWidth: 1,
    padding: 18,
  },
  cancelledDraftRow: {
    alignItems: 'flex-start',
    borderBottomColor: paperAuthTokens.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  cancelledLockSlot: {
    alignItems: 'center',
    backgroundColor: paperAuthTokens.raised,
    borderRadius: 6,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  cancelledDraftCopy: {
    flex: 1,
    gap: 3,
  },
  cancelledDraftTitle: {
    color: paperAuthTokens.text,
    fontFamily: paperAuthFonts.inter,
    fontSize: 16,
    lineHeight: 20,
  },
  cancelledDraftDetail: {
    color: paperAuthTokens.muted,
    fontFamily: paperAuthFonts.inter,
    fontSize: 16,
    lineHeight: 20,
  },
  cancelledActions: {
    flexShrink: 0,
    gap: 10,
  },
  cancelledPrimary: {
    alignItems: 'center',
    backgroundColor: paperAuthTokens.action,
    borderBottomColor: '#7750B6',
    borderBottomWidth: 3,
    borderRadius: mentaRadii.large,
    justifyContent: 'center',
    minHeight: mentaLayout.primaryControlHeight,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[3],
  },
  cancelledPrimaryText: {
    color: paperAuthTokens.canvas,
    ...mentaTypography.control,
  },
  cancelledSecondary: {
    alignItems: 'center',
    borderColor: paperAuthTokens.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: mentaLayout.primaryControlHeight,
    paddingHorizontal: mentaSpacing[5],
  },
  cancelledSecondaryText: {
    color: paperAuthTokens.action,
    ...mentaTypography.control,
  },
  contextCard: {
    gap: 4,
    width: '100%',
  },
  contextCardCompact: {
    gap: 3,
  },
  contextLabel: {
    color: paperAuthTokens.muted,
    ...mentaTypography.caption,
  },
  contextValue: {
    color: paperAuthTokens.text,
    ...mentaTypography.bodySmallMedium,
  },
  contextValueCompact: {
    ...mentaTypography.bodySmallMedium,
  },
  contextDetail: {
    color: paperAuthTokens.muted,
    ...mentaTypography.caption,
  },
  headingBlock: {
    gap: 8,
    width: '100%',
  },
  headingLarge: {
    gap: 10,
    maxWidth: 330,
  },
  heading: {
    color: paperAuthTokens.text,
    ...mentaTypography.heading,
  },
  headingLargeText: {
    ...mentaTypography.display,
  },
  headingCheckText: {
    ...mentaTypography.heading,
  },
  headingSubtitle: {
    color: paperAuthTokens.muted,
    ...mentaTypography.body,
  },
  button: {
    alignItems: 'center',
    backgroundColor: paperAuthTokens.action,
    borderRadius: mentaRadii.large,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: mentaLayout.primaryControlHeight,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: '100%',
  },
  buttonPaper: {
    backgroundColor: paperAuthTokens.paper,
  },
  buttonGoogle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#747775',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  buttonMuted: {
    backgroundColor: paperAuthTokens.raised,
  },
  buttonDisabled: {
    opacity: 0.52,
  },
  buttonPressed: {
    opacity: 0.76,
  },
  buttonLoadingAction: {
    backgroundColor: paperAuthTokens.raised,
  },
  buttonProgress: {
    backgroundColor: paperAuthTokens.action,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  buttonIconSlot: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  buttonGoogleLeadingSlot: {
    left: 16,
    position: 'absolute',
  },
  buttonGoogleTrailingSlot: {
    position: 'absolute',
    right: 16,
  },
  buttonText: {
    color: paperAuthTokens.canvas,
    ...mentaTypography.control,
  },
  buttonPaperText: {
    color: paperAuthTokens.canvas,
  },
  buttonGoogleText: {
    color: '#1F1F1F',
    ...googleProviderLabelTypography,
  },
  buttonMutedText: {
    color: paperAuthTokens.muted,
  },
  fieldBlock: {
    gap: 5,
    width: '100%',
  },
  fieldLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 17,
  },
  fieldLabel: {
    color: paperAuthTokens.text,
    ...mentaTypography.bodySmallMedium,
  },
  fieldLabelAccessory: {
    alignItems: 'center',
    flexShrink: 0,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: paperAuthTokens.raised,
    borderRadius: 12,
    flexDirection: 'row',
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 8,
    width: '100%',
  },
  input: {
    color: paperAuthTokens.text,
    flex: 1,
    fontFamily: paperAuthFonts.inter,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 46,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  visibilityButton: {
    alignItems: 'center',
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  fieldError: {
    color: paperAuthTokens.danger,
    ...mentaTypography.caption,
  },
  fieldHelper: {
    color: paperAuthTokens.muted,
    ...mentaTypography.caption,
  },
  notice: {
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
  },
  noticeCopy: {
    flex: 1,
    gap: 2,
  },
  noticeTitle: {
    ...mentaTypography.bodySmallMedium,
  },
  noticeMessage: {
    color: paperAuthTokens.muted,
    ...mentaTypography.bodySmall,
  },
  textLinkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
    width: '100%',
  },
  textLinkLead: {
    color: paperAuthTokens.muted,
    ...mentaTypography.bodySmall,
  },
  textLinkAction: {
    color: paperAuthTokens.action,
    ...mentaTypography.bodySmallMedium,
  },
  legalBlock: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginTop: 'auto',
    maxWidth: mentaLayout.readingMeasure,
    paddingTop: 20,
    width: '100%',
  },
  legalCopy: {
    color: paperAuthTokens.muted,
    fontFamily: paperAuthFonts.inter,
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 320,
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  legalLinkHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 92,
  },
  legalLink: {
    color: paperAuthTokens.action,
    fontFamily: paperAuthFonts.interBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
