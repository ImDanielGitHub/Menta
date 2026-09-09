import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useGroupStore } from '@/store/group-store';
import { describeJoinGroupCostNotice } from '@/lib/groups/join-group-copy';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { Avatar } from '@/components/ui/Avatar';
import { AppButton } from '@/components/ui/AppButton';
import { GlobeIcon, LockIcon, XIcon } from '@/components/ui/icons';
import ModalCard from '@/components/ui/modal/ModalCard';
import {
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';

export type PublicGroupPreview = {
  id: string;
  name: string;
  description?: string | null;
  member_count?: number | null;
  privacy?: 'public' | 'private' | 'secret' | string | null;
  current_streak?: number | null;
  challenge_count?: number | null;
  active_challenges_count?: number | null;
};

export type PublicGroupPreviewNotice = {
  title: string;
  message: string;
  tone: 'success' | 'error' | 'info';
};

type PublicGroupPreviewModalProps = {
  visible: boolean;
  group: PublicGroupPreview | null;
  onClose: () => void;
  onJoin: (groupId: string, expectedCost: number) => void;
  onOpenDetails: (groupId: string) => void;
  joining?: boolean;
  notice?: PublicGroupPreviewNotice | null;
};

const PublicGroupPreviewModal: React.FC<PublicGroupPreviewModalProps> = ({
  visible,
  group,
  onClose,
  onJoin,
  onOpenDetails,
  joining = false,
  notice,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ownerId = useAuthStore(state => state.user?.id);
  const getJoinQuote = useGroupStore(state => state.getJoinGroupQuote);
  const [quote, setQuote] = useState<{ ownerId: string; cost: number } | null>(
    null
  );
  const [quoteFailed, setQuoteFailed] = useState(false);
  useEffect(() => {
    let current = true;
    setQuote(null);
    setQuoteFailed(false);
    if (visible && ownerId) {
      void getJoinQuote(ownerId)
        .then(value => {
          if (current) setQuote({ ownerId, cost: value.cost });
        })
        .catch(() => {
          if (current) setQuoteFailed(true);
        });
    }
    return () => {
      current = false;
    };
  }, [getJoinQuote, ownerId, visible, group?.id, notice?.message]);
  const quotedCost = quote?.ownerId === ownerId ? quote?.cost : undefined;
  const normalizedPrivacy = String(group?.privacy || 'public').toLowerCase();
  const privacyLabel =
    normalizedPrivacy.charAt(0).toUpperCase() + normalizedPrivacy.slice(1);

  const privacyIcon =
    !normalizedPrivacy || normalizedPrivacy === 'public' ? (
      <GlobeIcon size={16} color={colors.text.secondary} />
    ) : (
      <LockIcon size={16} color={colors.text.secondary} />
    );

  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      try {
        AccessibilityInfo.announceForAccessibility?.(t('groups.preview.group'));
      } catch {}
    }
  }, [t, visible]);

  if (!group) return null;

  const handleRequestClose = () => {
    if (joining) return;
    onClose();
  };
  const memberCount = group.member_count || 0;
  const activePromiseCount =
    group.active_challenges_count ?? group.challenge_count ?? null;
  const memberLabel = t('groups.preview.member', { count: memberCount });
  const promiseLabel =
    activePromiseCount === null
      ? ''
      : t('groups.preview.promise', { count: activePromiseCount });

  return (
    <ModalCard
      visible={visible}
      onClose={handleRequestClose}
      maxWidth={390}
      dismissOnBackdrop={!joining}
      accessibilityLabel={t('groups.preview.details_label', {
        group: group.name,
      })}
      cardStyle={[
        styles.card,
        {
          backgroundColor: colors.background.surface,
          borderColor: colors.border.primary,
        },
      ]}
      testID="public-group-preview-modal"
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Avatar name={group.name} size={56} />
          <Pressable
            onPress={handleRequestClose}
            disabled={joining}
            accessibilityRole="button"
            accessibilityLabel={t('groups.preview.close')}
            accessibilityState={{ disabled: joining }}
            style={({ pressed }) => [
              styles.closeButton,
              { borderColor: colors.border.primary },
              joining ? styles.closeButtonDisabled : null,
              pressed && !joining
                ? { backgroundColor: colors.accent.background }
                : null,
            ]}
            testID="public-group-preview-close"
          >
            <XIcon size={18} color={colors.text.primary} />
          </Pressable>
        </View>

        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text.primary }]}
          numberOfLines={2}
        >
          {group.name}
        </Text>
        <View style={styles.metaRow}>
          {privacyIcon}
          <Text style={[styles.metaText, { color: colors.text.secondary }]}>
            {privacyLabel} {t('groups.preview.group')}
          </Text>
        </View>

        <Text
          style={[styles.description, { color: colors.text.secondary }]}
          numberOfLines={4}
        >
          {group.description || t('groups.preview.no_description')}
        </Text>

        {notice ? (
          <AppInlineNotice
            title={notice.title}
            description={notice.message}
            tone={notice.tone}
            style={styles.previewNotice}
            testID="public-group-preview-notice"
          />
        ) : null}

        <View
          style={[
            styles.contractList,
            { borderTopColor: colors.border.primary },
          ]}
        >
          <PreviewRow label={t('groups.preview.people')} value={memberLabel} />
          <PreviewRow
            label={t('groups.preview.active_promises')}
            value={
              activePromiseCount == null
                ? t('groups.preview.available_after_joining')
                : promiseLabel
            }
          />
        </View>

        <View style={styles.actionsRow}>
          <AppButton
            title={
              joining
                ? t('groups.preview.joining')
                : quotedCost === undefined
                  ? t('groups.preview.join')
                  : t('groups.join.confirm', { cost: quotedCost })
            }
            variant="primary"
            size="medium"
            onPress={() => {
              if (quotedCost !== undefined) onJoin(group.id, quotedCost);
            }}
            style={styles.action}
            testID="public-group-preview-join"
            accessibilityHint={
              joining
                ? t('groups.preview.joining')
                : t('groups.preview.join_hint')
            }
            loading={joining}
            disabled={joining || quotedCost === undefined}
          />
          <AppButton
            title={t('groups.preview.view_board')}
            variant="ghost"
            size="medium"
            onPress={() => onOpenDetails(group.id)}
            style={styles.action}
            testID="public-group-preview-view-board"
            accessibilityHint={t('groups.preview.view_board_hint')}
            disabled={joining}
          />
        </View>
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {quoteFailed
            ? t('groups.join.preview_unknown')
            : describeJoinGroupCostNotice(quotedCost ?? null, t)}
        </Text>
      </View>
    </ModalCard>
  );
};

const PreviewRow = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.contractRow, { borderBottomColor: colors.border.primary }]}
    >
      <Text style={[styles.contractLabel, { color: colors.text.primary }]}>
        {label}
      </Text>
      <Text style={[styles.contractValue, { color: colors.text.primary }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    padding: mentaSpacing[5],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: mentaSpacing[4],
  },
  closeButton: {
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  closeButtonDisabled: {
    opacity: 0.4,
  },
  title: {
    ...mentaTypography.heading,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[1],
    marginTop: mentaSpacing[1],
    marginBottom: mentaSpacing[2],
  },
  metaText: {
    ...mentaTypography.caption,
  },
  description: {
    ...mentaTypography.bodySmall,
  },
  previewNotice: {
    marginTop: mentaSpacing[4],
  },
  contractList: {
    marginTop: mentaSpacing[5],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  contractRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: mentaSpacing[3],
  },
  contractLabel: {
    flex: 1,
    ...mentaTypography.bodySmallMedium,
  },
  contractValue: {
    ...mentaTypography.bodySmallMedium,
    textAlign: 'right',
    maxWidth: 96,
  },
  actionsRow: {
    gap: mentaSpacing[2],
    marginTop: mentaSpacing[5],
  },
  action: {
    width: '100%',
  },
});

export default PublicGroupPreviewModal;
