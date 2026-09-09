import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { getLocales } from 'expo-localization';
import { Stack, useRouter } from 'expo-router';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { CheckIcon, GlobeIcon } from '@/components/ui/icons';
import { SettingsSectionLabel } from '@/components/settings/SettingsDirectRow';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTheme } from '@/constants/ThemeContext';
import {
  formatLanguageOption,
  getLanguageOption,
  hasLanguageOptionFor,
  LANGUAGE_OPTIONS,
  type AppLocalePreference,
  type LanguageOption,
} from '@/lib/localization/language-options';
import { resolveCatalogueLocale } from '@/lib/localization/translate';
import { useTranslation } from '@/lib/localization/use-translation';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { trackProductEvent } from '@/lib/posthog';
import { useLocaleStore } from '@/store/locale-store';

type LanguageRowProps = {
  accessibilityLabel: string;
  flag?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  selected: boolean;
  subtitle?: string;
  testID: string;
  title: string;
};

const LanguageRow = ({
  accessibilityLabel,
  flag,
  icon,
  onPress,
  selected,
  subtitle,
  testID,
  title,
}: LanguageRowProps) => {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const allowFullWrap = fontScale >= 1.3;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        { borderBottomColor: colors.border.primary },
        pressed && { backgroundColor: colors.accent.background },
      ]}
      testID={testID}
    >
      <View style={styles.flagLane}>
        {flag ? (
          <Text accessible={false} style={styles.flag}>
            {flag}
          </Text>
        ) : (
          icon
        )}
      </View>
      <View style={styles.optionCopy}>
        <Text
          numberOfLines={allowFullWrap ? undefined : 2}
          style={[styles.optionTitle, { color: colors.text.primary }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={allowFullWrap ? undefined : 2}
            style={[styles.optionSubtitle, { color: colors.text.secondary }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.selection,
          {
            borderColor: selected ? mentaColors.action : colors.border.primary,
            backgroundColor: selected ? mentaColors.action : 'transparent',
          },
        ]}
      >
        {selected ? (
          <CheckIcon size={14} color={mentaColors.text.onPaper} />
        ) : null}
      </View>
    </Pressable>
  );
};

const languageAccessibilityLabel = (option: LanguageOption): string =>
  `${option.nativeName}. ${option.regionalName}`;

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const phoneLayout = usePhoneLayout();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const preference = useLocaleStore(state => state.preference);
  const setPreference = useLocaleStore(state => state.setPreference);
  const deviceLocale = getLocales()[0]?.languageTag ?? 'en-NZ';
  const effectiveDeviceLocale = resolveCatalogueLocale(deviceLocale);
  const effectiveDeviceLanguage = getLanguageOption(effectiveDeviceLocale);
  const supportsDeviceLanguage = hasLanguageOptionFor(deviceLocale);
  const systemSubtitle = supportsDeviceLanguage
    ? formatLanguageOption(effectiveDeviceLanguage)
    : t('settings.language.system.unavailable', {
        device: deviceLocale,
        language: formatLanguageOption(effectiveDeviceLanguage),
      });

  const chooseLanguage = (nextPreference: AppLocalePreference) => {
    const language = nextPreference.toLowerCase().replace('-', '_') as
      | 'system'
      | 'en_nz'
      | 'de_de'
      | 'es_es'
      | 'es_mx'
      | 'fr_fr'
      | 'fr_ca'
      | 'pt_br'
      | 'pt_pt';
    trackProductEvent('Language Selected', {
      changed: preference !== nextPreference,
      language,
    });
    setPreference(nextPreference);
  };

  const contentStyle = useMemo(
    () => ({
      paddingHorizontal: phoneLayout.screenInset,
    }),
    [phoneLayout.screenInset]
  );

  return (
    <View
      style={[styles.route, { backgroundColor: colors.background.primary }]}
    >
      <AppScreen
        contentContainerStyle={[styles.content, contentStyle]}
        hasTabBar={false}
        lane="working"
        padding={false}
        scrollable
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <AppTopBar
            backLabel={t('settings.language.back')}
            onBack={() => backOrReplace(router, '/settings')}
          />
          <Text accessibilityRole="header" style={styles.screenTitle}>
            {t('settings.language.screen.title')}
          </Text>
          <Text style={[styles.introduction, { color: colors.text.secondary }]}>
            {t('settings.language.screen.body')}
          </Text>
        </View>

        <SettingsSectionLabel>
          {t('settings.language.screen.options')}
        </SettingsSectionLabel>
        <View accessibilityRole="radiogroup">
          <LanguageRow
            accessibilityLabel={t(
              'fullAuth.language_settings.system_accessibility',
              {
                systemSubtitle,
              }
            )}
            icon={<GlobeIcon size={21} color={colors.text.secondary} />}
            onPress={() => chooseLanguage('system')}
            selected={preference === 'system'}
            subtitle={systemSubtitle}
            testID="language-option-system"
            title={t('settings.language.system.title')}
          />
          {LANGUAGE_OPTIONS.map(option => (
            <LanguageRow
              accessibilityLabel={languageAccessibilityLabel(option)}
              flag={option.flag}
              key={option.locale}
              onPress={() => chooseLanguage(option.locale)}
              selected={preference === option.locale}
              subtitle={option.regionalName}
              testID={`language-option-${option.locale}`}
              title={option.nativeName}
            />
          ))}
        </View>
      </AppScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  route: {
    flex: 1,
  },
  content: {
    paddingBottom: mentaSpacing[12],
    paddingTop: mentaSpacing[6],
  },
  header: {
    gap: mentaSpacing[3],
    marginBottom: mentaSpacing[2],
  },
  screenTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.journeyTitle,
  },
  introduction: {
    ...mentaTypography.body,
    maxWidth: mentaLayout.readingMeasure,
  },
  optionRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 68,
    paddingVertical: mentaSpacing[3],
  },
  flagLane: {
    alignItems: 'center',
    justifyContent: 'center',
    width: mentaLayout.iconLane,
  },
  flag: {
    fontSize: 22,
    lineHeight: 28,
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    paddingLeft: mentaSpacing[3],
    paddingRight: mentaSpacing[3],
  },
  optionTitle: {
    ...mentaTypography.bodyMedium,
  },
  optionSubtitle: {
    ...mentaTypography.caption,
    marginTop: 1,
  },
  selection: {
    alignItems: 'center',
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});
