import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  APP_COMMUNITY_STANDARDS_URL,
  APP_PRIVACY_URL,
  APP_TERMS_URL,
} from '@/constants/LegalLinks';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  ExternalLinkIcon,
  FileTextIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/ui/icons';
import type { CurrentLegalDocuments } from '@/lib/legal-acceptance';
import { useTranslation } from '@/lib/localization';

type LegalDocumentLinksProps = {
  documents?: CurrentLegalDocuments | null;
  textScale?: number;
  onOpen?: (document: 'terms' | 'community_standards' | 'privacy') => void;
  onOpenError?: (label: string) => void;
  presentation?: 'plain' | 'onboarding' | 'consent';
  testID?: string;
};

const scaleTypeMetric = (value: number, scale: number): number =>
  Math.round(value * scale * 10) / 10;

const documentRows = [
  {
    key: 'terms',
    fallbackUrl: APP_TERMS_URL,
    Icon: FileTextIcon,
  },
  {
    key: 'community_standards',
    fallbackUrl: APP_COMMUNITY_STANDARDS_URL,
    Icon: UsersIcon,
  },
  {
    key: 'privacy',
    fallbackUrl: APP_PRIVACY_URL,
    Icon: ShieldIcon,
  },
] as const;

export const LegalDocumentLinks = ({
  documents,
  textScale,
  onOpen,
  onOpenError,
  presentation = 'plain',
  testID = 'legal-document-links',
}: LegalDocumentLinksProps) => {
  const isOnboarding = presentation === 'onboarding';
  const isConsent = presentation === 'consent';
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.list,
        isOnboarding && styles.onboardingList,
        isConsent && styles.consentList,
      ]}
      testID={testID}
    >
      {documentRows.map((row, index) => {
        const document = documents?.[row.key];
        const url = document?.url ?? row.fallbackUrl;
        const RowIcon = row.Icon;
        const label =
          row.key === 'terms'
            ? t('shared.legal.terms')
            : row.key === 'community_standards'
              ? t('shared.legal.communityStandards')
              : t('shared.legal.privacy');
        const description =
          row.key === 'terms'
            ? t('shared.legal.termsDescription')
            : row.key === 'community_standards'
              ? t('shared.legal.communityStandardsDescription')
              : t('shared.legal.privacyDescription');
        const versionLabel = document
          ? t('shared.legal.version', { version: document.version })
          : t('shared.legal.readDocument');
        return (
          <Pressable
            accessibilityHint={t('shared.legal.opensInBrowser')}
            accessibilityLabel={
              isOnboarding || isConsent
                ? t('shared.accessibility.choiceSummary', {
                    title: label,
                    description,
                  })
                : t('shared.accessibility.choiceSummary', {
                    title: label,
                    description: versionLabel,
                  })
            }
            accessibilityRole="link"
            key={row.key}
            onPress={() => {
              onOpen?.(row.key);
              void Promise.resolve(Linking.openURL(url)).catch(() =>
                onOpenError?.(label)
              );
            }}
            style={({ pressed }) => [
              styles.row,
              isOnboarding && styles.onboardingRow,
              isConsent && styles.consentRow,
              index < documentRows.length - 1 && styles.divider,
              index < documentRows.length - 1 &&
                isConsent &&
                styles.consentDivider,
              pressed && styles.pressed,
            ]}
            testID={`${testID}-${row.key}`}
          >
            {isOnboarding ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.iconLane}
              >
                <RowIcon color={mentaColors.action} size={22} />
              </View>
            ) : null}
            <View style={styles.copy}>
              <Text
                allowFontScaling={textScale == null}
                style={[
                  styles.label,
                  isOnboarding && styles.onboardingLabel,
                  isConsent && styles.consentLabel,
                  textScale == null
                    ? undefined
                    : {
                        fontSize: scaleTypeMetric(
                          mentaTypography.bodySemibold.fontSize,
                          textScale
                        ),
                        lineHeight: scaleTypeMetric(
                          mentaTypography.bodySemibold.lineHeight,
                          textScale
                        ),
                      },
                ]}
              >
                {label}
              </Text>
              {isOnboarding ? (
                <Text
                  allowFontScaling={textScale == null}
                  style={[
                    styles.description,
                    textScale == null
                      ? undefined
                      : {
                          fontSize: scaleTypeMetric(
                            mentaTypography.caption.fontSize,
                            textScale
                          ),
                          lineHeight: scaleTypeMetric(
                            mentaTypography.caption.lineHeight,
                            textScale
                          ),
                        },
                  ]}
                >
                  {description}
                </Text>
              ) : null}
            </View>
            {isOnboarding || isConsent ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.trailingIcon}
              >
                <ExternalLinkIcon
                  color={
                    isConsent
                      ? mentaColors.actionOnPaper
                      : mentaColors.text.secondary
                  }
                  size={18}
                />
              </View>
            ) : (
              <Text
                allowFontScaling={textScale == null}
                style={[
                  styles.version,
                  textScale == null
                    ? undefined
                    : {
                        fontSize: scaleTypeMetric(
                          mentaTypography.micro.fontSize,
                          textScale
                        ),
                        lineHeight: scaleTypeMetric(
                          mentaTypography.micro.lineHeight,
                          textScale
                        ),
                      },
                ]}
              >
                {versionLabel}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    borderBottomColor: mentaColors.border,
    borderTopColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  onboardingList: {
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 0,
  },
  consentList: {
    borderBottomColor: mentaColors.borderPaper,
    borderTopColor: mentaColors.borderPaper,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: mentaLayout.minimumTouchTarget,
    paddingVertical: mentaSpacing[2],
  },
  onboardingRow: {
    gap: mentaSpacing[2],
    minHeight: 58,
    paddingHorizontal: mentaSpacing[1],
    paddingVertical: mentaSpacing[2],
  },
  consentRow: {
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: mentaSpacing[2],
  },
  divider: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  consentDivider: {
    borderBottomColor: mentaColors.borderPaper,
  },
  label: {
    color: mentaColors.action,
    flex: 1,
    ...mentaTypography.bodyMedium,
  },
  onboardingLabel: {
    color: mentaColors.text.primary,
    flex: 0,
    ...mentaTypography.bodySemibold,
  },
  consentLabel: {
    color: mentaColors.text.onPaper,
    flex: 1,
    ...mentaTypography.bodySemibold,
  },
  copy: { flex: 1, gap: 2 },
  description: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  iconLane: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    width: 30,
  },
  trailingIcon: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    width: 20,
  },
  version: {
    color: mentaColors.text.secondary,
    marginLeft: mentaSpacing[3],
    maxWidth: 130,
    textAlign: 'right',
    ...mentaTypography.micro,
  },
  pressed: { opacity: 0.72 },
});
