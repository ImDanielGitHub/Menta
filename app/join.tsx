import {
  type MentaPalette,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';

import { parseInviteLink, PRIMARY_INVITE_HOST } from '@/lib/invite-links';
import {
  getJoinRedirectMissingCodeCopy,
  resolveJoinRedirectDestination,
} from '@/lib/invites/join-redirect-copy';
import { useTranslation } from '@/lib/localization';

export default function JoinRedirectScreen() {
  const { styles } = useMentaStyles(createPaletteStyles);

  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    challenge?: string;
    code?: string;
    invite?: string;
    type?: string;
  }>();
  const inviteQuery = useMemo(() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const paramValue = Array.isArray(value) ? value[0] : value;
      if (paramValue) query.set(key, paramValue.toString());
    }
    return query.toString();
  }, [params]);
  const invite = parseInviteLink(
    `https://${PRIMARY_INVITE_HOST}/join?${inviteQuery}`,
    'group'
  );
  const missingCodeCopy = getJoinRedirectMissingCodeCopy(
    resolveJoinRedirectDestination(params),
    t
  );

  // A valid link is transport, not a separate product screen. Redirect also
  // handles a native Back return without stranding a cancelled timeout bridge.
  if (invite?.code) {
    return (
      <Redirect
        href={{
          pathname:
            invite.kind === 'challenge' ? '/join-promise' : '/join-group',
          params: { code: invite.code },
        }}
      />
    );
  }

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
      testID="join-link-screen"
    >
      <AppTopBar title={t('groups.redirect.title')} titleIsHeading={false} />
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {missingCodeCopy.title}
        </Text>
        <Text style={styles.subtitle}>{missingCodeCopy.subtitle}</Text>
      </View>
      <AppInlineNotice
        title={missingCodeCopy.noticeTitle}
        description={missingCodeCopy.noticeDetail}
        tone="warning"
        testID="join-link-status-notice"
      />
      {missingCodeCopy.canEnterGroupCode ? (
        <AppButton
          title={t('groups.redirect.enter_group_code')}
          onPress={() => router.replace('/join-group')}
          fullWidth
        />
      ) : null}
      <AppButton
        title={t('groups.redirect.without_invite')}
        variant="outline"
        onPress={() => router.replace('/')}
        fullWidth
      />
    </AppScreen>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    screen: { gap: mentaSpacing[4], paddingTop: mentaSpacing[2] },
    heading: { gap: mentaSpacing[2] },
    title: { ...mentaTypography.heading, color: mentaColors.text.primary },
    subtitle: { ...mentaTypography.body, color: mentaColors.text.secondary },
  });
  return { styles };
};
