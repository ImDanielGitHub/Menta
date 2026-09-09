import { useTranslation } from '@/lib/localization';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  PaperAuthButton,
  PaperAuthContextCard,
  PaperAuthFrame,
  PaperAuthHeading,
  PaperAuthMascot,
  PaperAuthNotice,
  PaperAuthTextField,
  PaperAuthTextLink,
  paperAuthTokens,
} from '@/components/onboarding/PaperAuthSurface';
import {
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

export interface PaperAuthResetFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  onBackToSignIn: () => void;
  loading?: boolean;
  errorMessage?: string;
  testID?: string;
}

export const PaperAuthResetForm: React.FC<PaperAuthResetFormProps> = ({
  email,
  onEmailChange,
  onSubmit,
  onBackToSignIn,
  loading = false,
  errorMessage,
  testID = 'paper-auth-reset-form',
}) => {
  const { t } = useTranslation();
  return (
    <PaperAuthFrame testID={testID}>
      <View style={styles.page} testID={`${testID}-task-lane`}>
        <PaperAuthContextCard
          compact
          label={t('fullAuth.component_onboarding_paperauthreset.reset_for')}
          testID={`${testID}-context`}
          value={
            email ||
            t('fullAuth.component_onboarding_paperauthreset.your_account_email')
          }
        />

        <PaperAuthHeading
          subtitle={
            loading
              ? t(
                  'fullAuth.component_onboarding_paperauthreset.we_re_sending_a_secure_link_to_the_address_below'
                )
              : t(
                  'fullAuth.component_onboarding_paperauthreset.we_ll_email_you_a_secure_link_your_saved_promise'
                )
          }
          testID={`${testID}-heading`}
          title={
            loading
              ? t(
                  'fullAuth.component_onboarding_paperauthreset.sending_your_reset_link'
                )
              : t(
                  'fullAuth.component_onboarding_paperauthreset.reset_your_password'
                )
          }
        />

        {errorMessage ? (
          <PaperAuthNotice
            message={errorMessage}
            testID={`${testID}-error`}
            title={t(
              'fullAuth.component_onboarding_paperauthreset.we_could_not_send_the_reset_link'
            )}
          />
        ) : null}

        <PaperAuthTextField
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!loading}
          keyboardType="email-address"
          label={t('fullAuth.component_onboarding_paperauthreset.email')}
          placeholder={t(
            'fullAuth.component_onboarding_paperauthreset.daniel_example_com'
          )}
          testID={`${testID}-email`}
          textContentType="emailAddress"
          value={email}
          onChangeText={onEmailChange}
          onSubmitEditing={onSubmit}
        />

        <View style={styles.actions}>
          <PaperAuthButton
            loading={loading}
            loadingProgress={0.56}
            loadingTitle={t('fullAuth.residual.paper_reset.sending_link')}
            testID={`${testID}-submit`}
            title={t(
              'fullAuth.component_onboarding_paperauthreset.send_reset_link'
            )}
            onPress={onSubmit}
          />
          <PaperAuthTextLink
            action={t('fullAuth.residual.paper_reset.back_to_sign_in')}
            lead={t('fullAuth.residual.paper_reset.remembered_it')}
            testID={`${testID}-back`}
            onPress={onBackToSignIn}
          />
        </View>
      </View>
    </PaperAuthFrame>
  );
};

export interface PaperAuthCheckEmailProps {
  email: string;
  onBackToSignIn: () => void;
  onSendAnother: () => void;
  loading?: boolean;
  resendSecondsRemaining?: number;
  resendAvailableAtLabel?: string;
  errorMessage?: string;
  testID?: string;
}

const maskEmail = (email: string) => {
  const [localPart, domain = ''] = email.split('@');
  if (!localPart || !domain) return email;

  const [domainName, ...domainParts] = domain.split('.');
  const tld = domainParts.join('.') || 'com';
  const maskedDomain = `${domainName?.charAt(0) ?? 'e'}•••.${tld}`;
  return `${localPart}@${maskedDomain}`;
};

export const PaperAuthCheckEmail: React.FC<PaperAuthCheckEmailProps> = ({
  email,
  onBackToSignIn,
  onSendAnother,
  loading = false,
  resendSecondsRemaining = 0,
  resendAvailableAtLabel,
  errorMessage,
  testID = 'paper-auth-check-email',
}) => {
  const { t } = useTranslation();
  const cooldownActive = resendSecondsRemaining > 0;
  const resendDisabled = loading || cooldownActive;
  const countdown = `${String(Math.floor(resendSecondsRemaining / 60)).padStart(
    2,
    '0'
  )}:${String(resendSecondsRemaining % 60).padStart(2, '0')}`;

  return (
    <PaperAuthFrame testID={testID}>
      <View style={styles.successPage} testID={`${testID}-task-lane`}>
        <View style={styles.successHero}>
          <View style={styles.successCopy}>
            <PaperAuthHeading
              size="check"
              subtitle={
                cooldownActive
                  ? t(
                      'fullAuth.component_onboarding_paperauthreset.use_the_link_we_just_sent_you_can_request_anothe'
                    )
                  : t(
                      'fullAuth.component_onboarding_paperauthreset.we_sent_a_secure_reset_link_your_saved_promise_i'
                    )
              }
              testID={`${testID}-heading`}
              title={
                cooldownActive
                  ? t(
                      'fullAuth.component_onboarding_paperauthreset.use_the_latest_link'
                    )
                  : t(
                      'fullAuth.component_onboarding_paperauthreset.check_your_email'
                    )
              }
            />
          </View>
          <PaperAuthMascot testID={`${testID}-mascot`} />
        </View>

        {errorMessage ? (
          <PaperAuthNotice
            message={errorMessage}
            testID={`${testID}-error`}
            title={t(
              'fullAuth.component_onboarding_paperauthreset.we_could_not_send_another_link'
            )}
          />
        ) : null}

        <View style={styles.emailCard} testID={`${testID}-email-card`}>
          <Text style={styles.emailCardLabel}>
            {t('fullAuth.component_onboarding_paperauthreset.email_sent_to')}
          </Text>
          <Text style={styles.emailCardAddress}>{maskEmail(email)}</Text>
          <Text style={styles.emailCardDetail}>
            {t(
              'fullAuth.component_onboarding_paperauthreset.link_valid_for_60_minutes'
            )}
          </Text>
          <Text style={styles.noChangeText}>
            {cooldownActive && resendAvailableAtLabel
              ? t('fullAuth.residual.paper_reset.another_link_available', {
                  label: resendAvailableAtLabel,
                })
              : t('fullAuth.residual.paper_reset.password_changes_after_link')}
          </Text>
        </View>

        <View style={styles.actions}>
          <PaperAuthButton
            testID={`${testID}-back`}
            title={t(
              'fullAuth.component_onboarding_paperauthreset.back_to_sign_in'
            )}
            onPress={onBackToSignIn}
          />
          <Pressable
            accessibilityLabel={
              cooldownActive
                ? t(
                    'fullAuth.component_onboarding_paperauthreset.send_another_link_in_countdown',
                    { countdown: countdown }
                  )
                : t(
                    'fullAuth.component_onboarding_paperauthreset.send_another_link'
                  )
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: resendDisabled, busy: loading }}
            disabled={resendDisabled}
            onPress={() => {
              if (!resendDisabled) onSendAnother();
            }}
            style={styles.sendAnotherHitArea}
            testID={`${testID}-send-another`}
          >
            <Text
              style={[
                styles.sendAnother,
                resendDisabled && styles.sendAnotherDisabled,
              ]}
            >
              {loading
                ? t('fullAuth.residual.paper_reset.sending_another_link')
                : cooldownActive
                  ? t('fullAuth.residual.paper_reset.send_another_link_in', {
                      countdown,
                    })
                  : t('fullAuth.residual.paper_reset.send_another_link')}
            </Text>
          </Pressable>
        </View>
      </View>
    </PaperAuthFrame>
  );
};

const styles = StyleSheet.create({
  page: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[4],
    maxWidth: mentaLayout.taskLane,
    paddingTop: mentaSpacing[5],
    width: '100%',
  },
  actions: {
    gap: mentaSpacing[2],
    marginTop: 'auto',
    paddingTop: mentaSpacing[2],
    width: '100%',
  },
  successPage: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[5],
    maxWidth: mentaLayout.taskLane,
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  successHero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
    width: '100%',
  },
  successCopy: {
    flex: 1,
    minWidth: 0,
  },
  emailCard: {
    backgroundColor: paperAuthTokens.paper,
    borderRadius: mentaRadii.large,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
    width: '100%',
  },
  emailCardLabel: {
    color: paperAuthTokens.mutedPaper,
    ...mentaTypography.bodySmallMedium,
  },
  emailCardAddress: {
    color: paperAuthTokens.canvas,
    ...mentaTypography.title,
  },
  emailCardDetail: {
    color: paperAuthTokens.mutedPaper,
    ...mentaTypography.bodySmall,
  },
  noChangeText: {
    color: paperAuthTokens.mutedPaper,
    ...mentaTypography.bodySmall,
  },
  sendAnother: {
    alignSelf: 'center',
    color: paperAuthTokens.muted,
    ...mentaTypography.bodySmallMedium,
    textAlign: 'center',
  },
  sendAnotherHitArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  sendAnotherDisabled: {
    opacity: 0.5,
  },
});
