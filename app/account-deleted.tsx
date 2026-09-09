import { useTranslation } from '@/lib/localization';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  SkeletonButton,
  SkeletonLoader,
} from '@/components/ui';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  clearAccountDeletionReceipt,
  readAccountDeletionReceipt,
  type AccountDeletionReceipt,
} from '@/lib/account-deletion-receipt';

const APPLE_SIGN_IN_MANAGEMENT_URL = 'https://support.apple.com/en-nz/102571';

export default function AccountDeletedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [receipt, setReceipt] = useState<AccountDeletionReceipt>();
  const [linkFailed, setLinkFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void readAccountDeletionReceipt()
      .then(storedReceipt => {
        if (!active) return;
        if (!storedReceipt) {
          router.replace('/login');
          return;
        }
        setReceipt(storedReceipt);
      })
      .catch(() => {
        if (active) router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [router]);

  const continueToSignIn = useCallback(async () => {
    await clearAccountDeletionReceipt().catch(() => undefined);
    router.replace('/login');
  }, [router]);

  const openAppleInstructions = useCallback(async () => {
    setLinkFailed(false);
    try {
      await Linking.openURL(APPLE_SIGN_IN_MANAGEMENT_URL);
    } catch {
      setLinkFailed(true);
    }
  }, []);

  if (receipt === undefined) {
    return (
      <AppScreen
        lane="focused"
        hasTabBar={false}
        scrollable
        contentContainerStyle={styles.screen}
        testID="account-deleted-loading"
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.frame} testID="account-deleted-frame">
          <View
            accessible
            accessibilityLabel={t(
              'fullAuth.account_deleted.checking_account_deletion'
            )}
            accessibilityRole="progressbar"
            style={styles.intro}
          >
            <SkeletonLoader announce={false} height={28} width="78%" />
            <SkeletonLoader announce={false} height={16} width="100%" />
            <SkeletonLoader announce={false} height={16} width="86%" />
          </View>
          <View style={styles.actions}>
            <SkeletonButton />
          </View>
        </View>
      </AppScreen>
    );
  }

  const manualAppleRevocation =
    receipt.appleAuthorization === 'manual_revocation_required';

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
      testID="account-deleted-receipt"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.frame} testID="account-deleted-frame">
        <View accessibilityRole="alert" style={styles.intro}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('fullAuth.account_deleted.your_account_was_deleted')}
          </Text>
          <Text style={styles.body}>
            {t(
              'fullAuth.account_deleted.your_menta_account_and_its_data_were_deleted_men'
            )}
          </Text>
          {receipt.appleAuthorization === 'revoked' ? (
            <Text style={styles.body}>
              {t(
                'fullAuth.account_deleted.sign_in_with_apple_access_was_also_removed'
              )}
            </Text>
          ) : null}
        </View>

        {manualAppleRevocation ? (
          <AppInlineNotice
            description={t(
              'fullAuth.account_deleted.if_you_used_sign_in_with_apple_remove_menta_from'
            )}
            testID="account-deleted-apple-manual"
            title={t('fullAuth.account_deleted.remove_apple_access')}
            tone="warning"
          />
        ) : null}

        {linkFailed ? (
          <AppInlineNotice
            description={t(
              'fullAuth.account_deleted.open_apple_support_and_search_for_manage_your_ap'
            )}
            testID="account-deleted-apple-link-failed"
            title={t(
              'fullAuth.account_deleted.apple_instructions_did_not_open'
            )}
            tone="warning"
          />
        ) : null}

        <View style={styles.actions}>
          {manualAppleRevocation ? (
            <AppButton
              fullWidth
              onPress={() => void openAppleInstructions()}
              testID="account-deleted-open-apple-instructions"
              title={t('fullAuth.account_deleted.see_apple_instructions')}
              variant="secondary"
            />
          ) : null}
          <AppButton
            fullWidth
            onPress={() => void continueToSignIn()}
            testID="account-deleted-continue"
            title={t('fullAuth.account_deleted.go_to_sign_in')}
            variant="accent"
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    width: '100%',
  },
  frame: {
    flexGrow: 1,
    gap: mentaSpacing[8],
    justifyContent: 'center',
    paddingBottom: mentaSpacing[12],
    paddingTop: mentaSpacing[10],
  },
  intro: { gap: mentaSpacing[3] },
  title: { color: mentaColors.text.primary, ...mentaTypography.heading },
  body: { color: mentaColors.text.secondary, ...mentaTypography.body },
  actions: { gap: mentaSpacing[3] },
});
