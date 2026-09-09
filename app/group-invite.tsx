import React from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { GroupInviteQRCode } from '@/components/group/GroupInviteQRCode';
import {
  AppButton,
  AppInlineNotice,
  AppListRow,
  AppScreen,
  AppTopBar,
  MentaMascot,
  SkeletonLoader,
} from '@/components/ui';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { AlertTriangleIcon, RefreshCcwIcon } from '@/components/ui/icons';
import { trackMetaAdsInviteFriend } from '@/lib/meta-ads';
import {
  buildInviteShareMessage,
  buildInviteShareUrl,
} from '@/lib/invite-links';
import {
  createConfirmedReceipt,
  emitConfirmedSuccess,
  emitHaptic,
} from '@/lib/motion/haptics';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useGroupStore } from '@/store/group-store';
import { useTranslation } from '@/lib/localization';

type InviteParams = {
  groupId?: string | string[];
  groupName?: string | string[];
  qaState?: string | string[];
};

type InvitePreview = {
  code: string;
  shareUrl: string;
};

type InviteState = 'ready' | 'confirm-replace' | 'replaced';

type InviteNotice = {
  title: string;
  description: string;
  tone: 'info' | 'success';
};

const singleParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

export const getInviteQrSize = (screenWidth: number): number =>
  Math.min(300, Math.max(244, Math.floor(screenWidth - mentaSpacing[12] * 2)));

export default function GroupInviteScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const phoneLayout = usePhoneLayout();
  const insetPadding = screenInsetPadding(phoneLayout);
  const params = useLocalSearchParams<InviteParams>();
  const groupId = singleParam(params.groupId);
  const paramGroupName = singleParam(params.groupName);
  const qaState = singleParam(params.qaState);
  const fetchGroupDetails = useGroupStore(state => state.fetchGroupDetails);
  const shareGroup = useGroupStore(state => state.shareGroup);
  const rotateGroupInviteCode = useGroupStore(
    state => state.rotateGroupInviteCode
  );

  const [groupName, setGroupName] = React.useState(
    paramGroupName?.trim() || 'your group'
  );
  const [preview, setPreview] = React.useState<InvitePreview | null>(null);
  const [screenState, setScreenState] = React.useState<InviteState>('ready');
  const [showLargeQr, setShowLargeQr] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isReplacing, setIsReplacing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<InviteNotice | null>(null);
  const replaceInFlightRef = React.useRef(false);
  const qrSize = getInviteQrSize(width);
  const sheetQrSize = Math.min(176, Math.max(148, width - 214));

  const loadInvite = React.useCallback(async () => {
    if (!groupId) {
      setError(t('groups.invite.missing_group'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [group, invite] = await Promise.all([
        fetchGroupDetails(groupId),
        shareGroup(groupId, paramGroupName?.trim() || 'your group'),
      ]);
      const resolvedName =
        group.name?.trim() || paramGroupName?.trim() || 'your group';
      setGroupName(resolvedName);
      setPreview(invite);
      if (__DEV__ && qaState === 'replaced') {
        setScreenState('replaced');
      }
    } catch {
      setError(t('groups.invite.load_error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchGroupDetails, groupId, paramGroupName, qaState, shareGroup, t]);

  React.useEffect(() => {
    void loadInvite();
  }, [loadInvite]);

  const returnToGroup = React.useCallback(() => {
    if (!groupId) {
      backOrReplace(router, '/(tabs)/groups');
      return;
    }
    router.replace({ pathname: '/groups/[id]', params: { id: groupId } });
  }, [groupId, router]);

  const handleBack = React.useCallback(() => {
    if (screenState === 'confirm-replace') {
      setError(null);
      setScreenState('ready');
      return;
    }
    returnToGroup();
  }, [returnToGroup, screenState]);

  const copyValue = React.useCallback(
    async (kind: 'link' | 'code') => {
      if (!preview) return;
      setError(null);
      try {
        await Clipboard.setStringAsync(
          kind === 'link' ? preview.shareUrl : preview.code
        );
        const description =
          kind === 'link'
            ? t('groups.invite.link_copied')
            : t('groups.invite.code_copied');
        setNotice({
          title: t('groups.invite.copied'),
          description,
          tone: 'success',
        });
        void emitHaptic({ type: 'selection' });
        AccessibilityInfo.announceForAccessibility?.(description);
        trackMetaAdsInviteFriend();
      } catch {
        setError(t('groups.invite.copy_error'));
      }
    },
    [preview, t]
  );

  const shareInvite = React.useCallback(async () => {
    if (!preview) return;
    setNotice(null);
    setError(null);
    try {
      await Share.share({
        title: t('groups.invite.share_title', { group: groupName }),
        message: buildInviteShareMessage({
          kind: 'group',
          code: preview.code,
          title: groupName,
        }),
      });
      trackMetaAdsInviteFriend();
      setNotice({
        title: t('groups.invite.share_returned'),
        description: t('groups.invite.share_closed'),
        tone: 'info',
      });
    } catch {
      setError(t('groups.invite.share_error'));
    }
  }, [groupName, preview, t]);

  const replaceInvite = React.useCallback(async () => {
    if (!groupId || !preview || replaceInFlightRef.current) return;
    replaceInFlightRef.current = true;
    setIsReplacing(true);
    setError(null);
    setNotice(null);
    try {
      const result = await rotateGroupInviteCode(groupId, preview.code);
      const nextPreview = {
        code: result.code,
        shareUrl: buildInviteShareUrl('group', result.code),
      };
      setPreview(nextPreview);
      setScreenState('replaced');
      setShowLargeQr(false);
      void emitConfirmedSuccess(
        createConfirmedReceipt(
          'generic',
          `group-invite-replaced:${groupId}:${result.code}`
        )
      );
      AccessibilityInfo.announceForAccessibility?.(
        result.previousCodeInvalidated
          ? t('groups.invite.replaced_accessibility')
          : t('groups.invite.new_ready')
      );
    } catch {
      setError(t('groups.invite.replace_error'));
    } finally {
      replaceInFlightRef.current = false;
      setIsReplacing(false);
    }
  }, [groupId, preview, rotateGroupInviteCode, t]);

  const footer =
    !isLoading && preview ? (
      <View style={[styles.footer, insetPadding]} testID="group-invite-footer">
        {screenState === 'confirm-replace' ? (
          <>
            <AppButton
              title={
                isReplacing
                  ? t('groups.invite.replace_loading')
                  : t('groups.invite.replace')
              }
              variant="destructive"
              size="large"
              fullWidth
              loading={isReplacing}
              preserveLabelPositionOnLoading
              disabled={isReplacing}
              haptic
              hapticIntent="warning"
              testID="replace-group-invite"
              onPress={() => void replaceInvite()}
            />
            <AppButton
              title={t('groups.invite.keep')}
              variant="ghost"
              fullWidth
              disabled={isReplacing}
              onPress={() => setScreenState('ready')}
            />
          </>
        ) : (
          <>
            <AppButton
              title={
                screenState === 'replaced'
                  ? t('groups.invite.new_share')
                  : t('groups.invite.share')
              }
              variant="accent"
              size="large"
              fullWidth
              onPress={() => void shareInvite()}
            />
            <AppButton
              title={t('groups.invite.back_group')}
              variant="ghost"
              fullWidth
              onPress={returnToGroup}
            />
          </>
        )}
      </View>
    ) : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        lane="full"
        hasTabBar={false}
        padding={false}
        style={styles.screen}
      >
        <View style={[styles.headerFrame, insetPadding]}>
          <AppTopBar
            title={t('groups.invite.title')}
            subtitle={groupName}
            onBack={handleBack}
            backLabel={
              screenState === 'confirm-replace'
                ? t('groups.invite.keep')
                : t('groups.invite.back_group')
            }
          />
        </View>

        {isLoading ? (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t('groups.invite.loading')}
            style={styles.body}
            testID="group-invite-loading"
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, insetPadding]}
              showsVerticalScrollIndicator={false}
            >
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.loadingIntro}
                testID="group-invite-loading-intro"
              >
                <SkeletonLoader announce={false} height={34} width="88%" />
                <SkeletonLoader announce={false} height={34} width="64%" />
                <SkeletonLoader announce={false} height={18} width="78%" />
              </View>

              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.loadingQr}
                testID="group-invite-loading-qr"
              >
                <SkeletonLoader
                  announce={false}
                  borderRadius={mentaRadii.large}
                  height={qrSize}
                  width="100%"
                  style={styles.loadingQrSurface}
                />
              </View>

              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.loadingCode}
                testID="group-invite-loading-code"
              >
                <SkeletonLoader announce={false} height={38} width={152} />
                <SkeletonLoader announce={false} height={17} width="82%" />
              </View>

              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.actionList}
                testID="group-invite-loading-actions"
              >
                {[148, 132, 142, 164].map(rowWidth => (
                  <View key={rowWidth} style={styles.loadingActionRow}>
                    <SkeletonLoader
                      announce={false}
                      height={17}
                      width={rowWidth}
                    />
                    <SkeletonLoader
                      announce={false}
                      borderRadius={mentaRadii.small}
                      height={18}
                      width={18}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            <View
              style={[styles.footer, insetPadding]}
              testID="group-invite-loading-footer"
            >
              <SkeletonLoader
                announce={false}
                borderRadius={mentaRadii.medium}
                height={mentaLayout.primaryControlHeight}
              />
              <SkeletonLoader
                announce={false}
                borderRadius={mentaRadii.medium}
                height={mentaLayout.minimumTouchTarget}
                width="72%"
                style={styles.loadingSecondary}
              />
            </View>
          </View>
        ) : error && !preview ? (
          <View
            style={[styles.centredState, insetPadding]}
            accessibilityLiveRegion="assertive"
          >
            <AlertTriangleIcon size={30} color={mentaColors.danger} />
            <Text style={styles.stateTitle}>
              {t('groups.invite.load_failed')}
            </Text>
            <Text style={styles.stateCopy}>{error}</Text>
            <View style={styles.stateActions}>
              <AppButton
                title={t('groups.invite.try_again')}
                variant="accent"
                size="large"
                fullWidth
                onPress={() => void loadInvite()}
              />
              <AppButton
                title={t('groups.invite.back_group')}
                variant="ghost"
                fullWidth
                onPress={returnToGroup}
              />
            </View>
          </View>
        ) : screenState === 'confirm-replace' && preview ? (
          <View style={styles.body}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.decisionContent, insetPadding]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.warningIcon}>
                <RefreshCcwIcon size={28} color={mentaColors.warning} />
              </View>
              <View style={styles.stateCopyBlock}>
                <Text style={styles.decisionTitle}>
                  {t('groups.invite.replace_question')}
                </Text>
                <Text style={styles.stateCopy}>
                  {t('groups.invite.replace_warning')}
                </Text>
              </View>
              <View style={styles.codeReceipt}>
                <View>
                  <Text style={styles.receiptLabel}>
                    {t('groups.invite.current_code')}
                  </Text>
                  <Text style={styles.receiptCode}>{preview.code}</Text>
                </View>
                <Text style={styles.receiptWarning}>
                  {t('groups.invite.stops_working')}
                </Text>
              </View>
              {error ? (
                <AppInlineNotice
                  title={t('groups.invite.not_replaced')}
                  description={error}
                  tone="error"
                />
              ) : null}
            </ScrollView>
            {footer}
          </View>
        ) : screenState === 'replaced' && preview ? (
          <View style={styles.body} accessibilityLiveRegion="polite">
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.receiptContent, insetPadding]}
              showsVerticalScrollIndicator={false}
            >
              <MentaMascot
                state="group-nudge"
                size="lg"
                style={styles.receiptMascot}
              />
              <View style={styles.stateCopyBlock}>
                <Text style={styles.decisionTitle}>
                  {t('groups.invite.new_ready')}
                </Text>
                <Text style={styles.stateCopy}>
                  {t('groups.invite.replaced_detail')}
                </Text>
              </View>
              <View style={styles.codeReceipt}>
                <View>
                  <Text style={styles.receiptLabel}>
                    {t('groups.invite.active_code')}
                  </Text>
                  <Text style={styles.receiptCode}>{preview.code}</Text>
                </View>
                <Text style={styles.receiptSuccess}>
                  {t('groups.invite.active')}
                </Text>
              </View>
              {notice ? (
                <AppInlineNotice
                  title={notice.title}
                  description={notice.description}
                  tone={notice.tone}
                />
              ) : null}
            </ScrollView>
            {footer}
          </View>
        ) : preview ? (
          <View style={styles.body}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, insetPadding]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.introCopy}>
                <Text style={styles.pageTitle}>
                  {t('groups.invite.invite_to', { group: groupName })}
                </Text>
                <Text style={styles.bodyCopy}>{t('groups.invite.intro')}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('groups.invite.show_qr_full', {
                  code: preview.code,
                })}
                onPress={() => setShowLargeQr(true)}
                style={({ pressed }) => [
                  styles.qrBlock,
                  pressed ? styles.pressed : null,
                ]}
                testID="group-invite-qr-block"
              >
                <GroupInviteQRCode
                  inviteCode={preview.code}
                  size={qrSize}
                  showCode={false}
                  bare
                />
              </Pressable>

              <View style={styles.codeLane}>
                <Text selectable style={styles.codeHeadline}>
                  {preview.code}
                </Text>
                <Text style={styles.codeMeta}>
                  {t('groups.invite.active_detail')}
                </Text>
              </View>

              <View style={styles.actionList}>
                <AppListRow
                  title={t('groups.invite.show_qr')}
                  subtitle={t('groups.invite.show_qr_detail')}
                  onPress={() => setShowLargeQr(true)}
                />
                <AppListRow
                  title={t('groups.invite.copy_link')}
                  onPress={() => void copyValue('link')}
                />
                <AppListRow
                  title={t('groups.invite.copy_code')}
                  onPress={() => void copyValue('code')}
                />
                <AppListRow
                  title={t('groups.invite.replace')}
                  subtitle={t('groups.invite.replace_detail')}
                  destructive
                  showDivider={false}
                  onPress={() => {
                    setError(null);
                    setNotice(null);
                    setScreenState('confirm-replace');
                  }}
                />
              </View>

              {notice ? (
                <AppInlineNotice
                  title={notice.title}
                  description={notice.description}
                  tone={notice.tone}
                />
              ) : null}
              {error ? (
                <AppInlineNotice
                  title={t('groups.invite.action_failed')}
                  description={error}
                  tone="error"
                />
              ) : null}
            </ScrollView>
            {footer}
          </View>
        ) : null}

        <SimpleBottomSheet
          visible={showLargeQr && Boolean(preview)}
          onClose={() => setShowLargeQr(false)}
          testID="group-invite-qr-sheet"
          scrollableBody={
            preview ? (
              <View style={styles.qrSheetBody}>
                <View style={styles.qrSheetHeading}>
                  <Text style={styles.receiptLabel}>
                    {t('groups.invite.qr_title')}
                  </Text>
                  <Text style={styles.qrSheetTitle}>
                    {t('groups.invite.qr_heading')}
                  </Text>
                </View>
                <View style={styles.qrSheetArtefact}>
                  <GroupInviteQRCode
                    inviteCode={preview.code}
                    size={sheetQrSize}
                    showCode={false}
                    bare
                  />
                  <View style={styles.qrSheetCopy}>
                    <Text style={styles.qrSheetGroup}>{groupName}</Text>
                    <Text style={styles.bodyCopy}>
                      {t('groups.invite.qr_detail')}
                    </Text>
                    <Text
                      selectable
                      style={[
                        styles.qrSheetCode,
                        { color: colors.accent.primary },
                      ]}
                    >
                      {preview.code}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null
          }
          footer={
            preview ? (
              <>
                <AppButton
                  title={t('groups.invite.share_qr')}
                  onPress={() => void shareInvite()}
                  fullWidth
                  size="large"
                  variant="accent"
                  testID="share-group-invite-qr"
                />
                <AppButton
                  title={t('groups.invite.copy_link')}
                  onPress={() => void copyValue('link')}
                  fullWidth
                  variant="ghost"
                />
              </>
            ) : null
          }
        />
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: mentaColors.canvas,
  },
  headerFrame: {
    alignSelf: 'center',
    maxWidth: mentaLayout.workingFrameMax,
    paddingHorizontal: mentaSpacing[6],
    paddingVertical: mentaSpacing[3],
    width: '100%',
  },
  body: {
    flex: 1,
  },
  scroll: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: mentaLayout.workingFrameMax,
    width: '100%',
  },
  scrollContent: {
    gap: mentaSpacing[5],
    paddingBottom: mentaSpacing[6],
    paddingHorizontal: mentaSpacing[6],
    paddingTop: mentaSpacing[3],
  },
  introCopy: {
    gap: mentaSpacing[2],
  },
  pageTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  bodyCopy: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  qrBlock: {
    alignItems: 'center',
    paddingVertical: mentaSpacing[2],
  },
  codeLane: {
    alignItems: 'center',
    gap: mentaSpacing[2],
  },
  codeHeadline: {
    ...mentaTypography.journeyTitle,
    color: mentaColors.text.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  codeMeta: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
    textAlign: 'center',
  },
  actionList: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    alignSelf: 'center',
    backgroundColor: mentaColors.canvas,
    gap: mentaSpacing[1],
    maxWidth: mentaLayout.workingFrameMax,
    paddingBottom: mentaSpacing[3],
    paddingHorizontal: mentaSpacing[6],
    paddingTop: mentaSpacing[3],
    width: '100%',
  },
  loadingIntro: {
    gap: mentaSpacing[2],
  },
  loadingQr: {
    alignItems: 'center',
    paddingVertical: mentaSpacing[2],
  },
  loadingQrSurface: {
    alignSelf: 'center',
    maxWidth: 300,
  },
  loadingCode: {
    alignItems: 'center',
    gap: mentaSpacing[2],
  },
  loadingActionRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 68,
  },
  loadingSecondary: {
    alignSelf: 'center',
  },
  centredState: {
    alignItems: 'center',
    alignSelf: 'center',
    flex: 1,
    gap: mentaSpacing[3],
    justifyContent: 'center',
    maxWidth: mentaLayout.focusedLane,
    paddingHorizontal: mentaSpacing[6],
    width: '100%',
  },
  stateTitle: {
    ...mentaTypography.journeyTitle,
    color: mentaColors.text.primary,
    textAlign: 'center',
  },
  stateCopy: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  stateActions: {
    gap: mentaSpacing[1],
    marginTop: mentaSpacing[3],
    width: '100%',
  },
  decisionContent: {
    flexGrow: 1,
    gap: mentaSpacing[5],
    justifyContent: 'center',
    paddingBottom: mentaSpacing[8],
    paddingHorizontal: mentaSpacing[6],
    paddingTop: mentaSpacing[6],
  },
  receiptContent: {
    flexGrow: 1,
    gap: mentaSpacing[5],
    justifyContent: 'center',
    paddingBottom: mentaSpacing[8],
    paddingHorizontal: mentaSpacing[6],
    paddingTop: mentaSpacing[6],
  },
  warningIcon: {
    alignItems: 'center',
    backgroundColor: mentaColors.warningSoft,
    borderColor: mentaColors.warningBorder,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  stateCopyBlock: {
    gap: mentaSpacing[2],
  },
  decisionTitle: {
    ...mentaTypography.display,
    color: mentaColors.text.primary,
  },
  codeReceipt: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[4],
    justifyContent: 'space-between',
    paddingVertical: mentaSpacing[4],
  },
  receiptLabel: {
    ...mentaTypography.captionMedium,
    color: mentaColors.text.secondary,
  },
  receiptCode: {
    ...mentaTypography.journeyTitle,
    color: mentaColors.text.primary,
    letterSpacing: 1.5,
    marginTop: mentaSpacing[1],
  },
  receiptWarning: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.warning,
    flexShrink: 1,
    textAlign: 'right',
  },
  receiptSuccess: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.success,
  },
  receiptMascot: {
    alignSelf: 'center',
  },
  qrSheetBody: {
    gap: mentaSpacing[5],
  },
  qrSheetHeading: {
    gap: mentaSpacing[1],
  },
  qrSheetTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  qrSheetArtefact: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
  },
  qrSheetCopy: {
    flex: 1,
    gap: mentaSpacing[2],
    minWidth: 0,
  },
  qrSheetGroup: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  qrSheetCode: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.action,
    letterSpacing: 1.2,
  },
  pressed: {
    opacity: 0.72,
  },
});
