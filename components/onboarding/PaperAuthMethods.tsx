import { useTranslation } from '@/lib/localization';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { AppleIcon, MailIcon } from '@/components/ui/icons';
import { GoogleGlyph } from '@/components/ui/google-glyph';
import {
  PaperAuthButton,
  PaperAuthFrame,
  PaperAuthHeading,
  PaperAuthLegal,
  PaperAuthNotice,
  PaperAuthPromiseCard,
  paperAuthFonts,
  paperAuthTokens,
} from '@/components/onboarding/PaperAuthSurface';
import type { OnboardingDraft } from '@/lib/onboarding-draft';
import { mentaLayout } from '@/constants/MentaDesignSystem';

export interface PaperAuthMethodsProps {
  draft: OnboardingDraft | null;
  onApple: () => void;
  onGoogle: () => void;
  onEmail: () => void;
  onReplayIntro?: () => void;
  appleLoading?: boolean;
  googleLoading?: boolean;
  errorMessage?: string;
  testID?: string;
}

export const PaperAuthMethods: React.FC<PaperAuthMethodsProps> = ({
  draft,
  onApple,
  onGoogle,
  onEmail,
  onReplayIntro,
  appleLoading = false,
  googleLoading = false,
  errorMessage,
  testID = 'paper-auth-methods',
}) => {
  const { t } = useTranslation();
  const providerBusy = appleLoading || googleLoading;
  const hasDraft = Boolean(draft?.promise.trim());

  return (
    <PaperAuthFrame testID={testID}>
      <View style={styles.page} testID={`${testID}-task-lane`}>
        <PaperAuthPromiseCard draft={draft} />

        <PaperAuthHeading
          size="large"
          subtitle={
            hasDraft
              ? t(
                  'fullAuth.component_onboarding_paperauthmethods.choose_how_to_sign_in_your_promise_stays_on_this'
                )
              : t(
                  'fullAuth.component_onboarding_paperauthmethods.choose_how_you_want_to_sign_in'
                )
          }
          testID={`${testID}-heading`}
          title={
            hasDraft
              ? t(
                  'fullAuth.component_onboarding_paperauthmethods.save_your_promise'
                )
              : t(
                  'fullAuth.component_onboarding_paperauthmethods.sign_in_to_menta'
                )
          }
        />

        {errorMessage ? (
          <PaperAuthNotice
            message={errorMessage}
            testID={`${testID}-error`}
            title={t(
              'fullAuth.component_onboarding_paperauthmethods.we_could_not_sign_you_in'
            )}
          />
        ) : null}

        <View style={styles.actions}>
          <PaperAuthButton
            disabled={googleLoading}
            icon={<AppleIcon color={paperAuthTokens.canvas} size={18} />}
            loading={appleLoading}
            testID={`${testID}-apple`}
            title={t(
              'fullAuth.component_onboarding_paperauthmethods.continue_with_apple'
            )}
            variant="paper"
            onPress={onApple}
          />
          <PaperAuthButton
            disabled={appleLoading}
            icon={<GoogleGlyph size={20} />}
            loading={googleLoading}
            testID={`${testID}-google`}
            title={t(
              'fullAuth.component_onboarding_paperauthmethods.continue_with_google'
            )}
            variant="google"
            onPress={onGoogle}
          />
          <PaperAuthButton
            disabled={providerBusy}
            icon={<MailIcon color={paperAuthTokens.muted} size={18} />}
            testID={`${testID}-email`}
            title={t(
              'fullAuth.component_onboarding_paperauthmethods.continue_with_email'
            )}
            variant="muted"
            onPress={onEmail}
          />
          {onReplayIntro ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(
                'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works'
              )}
              hitSlop={10}
              onPress={onReplayIntro}
              style={styles.introAction}
              testID={`${testID}-replay-intro`}
            >
              <Text style={styles.introActionText}>
                {t(
                  'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works'
                )}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <PaperAuthLegal />
    </PaperAuthFrame>
  );
};

const styles = StyleSheet.create({
  page: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: 20,
    maxWidth: mentaLayout.taskLane,
    paddingTop: 28,
    width: '100%',
  },
  actions: {
    gap: 12,
    paddingTop: 18,
    width: '100%',
  },
  introAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  introActionText: {
    color: paperAuthTokens.muted,
    fontFamily: paperAuthFonts.interMedium,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
});
