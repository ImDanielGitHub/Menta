import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModalCard from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { withReadableLeading } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTheme } from '@/constants/ThemeContext';
import type { CreationIntent } from '@/lib/navigation/create-entry';
import type { CommitmentTemplateId } from '@/lib/commitments/templates';
import type { PendingInvite } from '@/store/invite-store';
import { useTranslation } from '@/lib/localization';
import {
  ArrowRightIcon,
  AlertTriangleIcon,
  CalendarIcon,
  ChevronLeftIcon,
  QrCodeIcon,
  ShieldIcon,
  TargetIcon,
  UsersIcon,
} from '@/components/ui/icons';

type CreateHubModalProps = {
  visible: boolean;
  preferredIntent?: CreationIntent;
  pendingInvite?: PendingInvite | null;
  recommendedAction?: {
    choiceId:
      | 'solo'
      | 'accountability'
      | 'group'
      | 'group_challenge'
      | 'invite';
    title: string;
    description: string;
    ctaLabel: string;
    onPress: () => void;
    tag?: string;
  } | null;
  hasActiveGroup?: boolean;
  hasPromise?: boolean;
  notice?: {
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null;
  onClose: () => void;
  onCreateGroup: (templateId?: CommitmentTemplateId) => Promise<void> | void;
  onCreateGroupChallenge: (
    templateId?: CommitmentTemplateId
  ) => Promise<void> | void;
  onCreateSoloChallenge: (templateId?: CommitmentTemplateId) => void;
  onInviteToPromise: () => void;
  onJoinExistingGroup: () => void;
  onBrowseEvents: () => void;
};

export const CreateHubModal: React.FC<CreateHubModalProps> = ({
  visible,
  preferredIntent,
  pendingInvite,
  recommendedAction,
  hasActiveGroup = false,
  hasPromise = false,
  notice,
  onClose,
  onCreateGroup,
  onCreateGroupChallenge,
  onCreateSoloChallenge,
  onInviteToPromise,
  onJoinExistingGroup,
  onBrowseEvents,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();
  const { colors } = useTheme();
  const preferredChoice =
    preferredIntent === 'create_group'
      ? 'group'
      : preferredIntent === 'create_group_challenge'
        ? hasActiveGroup
          ? 'group_challenge'
          : 'group'
        : preferredIntent === 'create_solo_challenge'
          ? 'solo'
          : null;
  const firstChoice =
    preferredChoice ??
    (pendingInvite ? 'invite' : null) ??
    recommendedAction?.choiceId ??
    (hasActiveGroup ? 'group_challenge' : 'solo');
  const choicePress = (
    choiceId:
      | 'solo'
      | 'accountability'
      | 'group'
      | 'group_challenge'
      | 'invite',
    fallback: () => void
  ) =>
    recommendedAction?.choiceId === choiceId
      ? recommendedAction.onPress
      : fallback;
  const choices = [
    {
      id: 'accountability',
      title: t('navigation.create.accountability.title'),
      body: t('navigation.create.accountability.description'),
      icon: <UsersIcon size={20} color={colors.accent.primary} />,
      onPress: choicePress('accountability', onInviteToPromise),
    },
    {
      id: 'group_challenge',
      title: t('todayProof.creation.group_promise'),
      body: t('todayProof.creation.group_promise_detail'),
      icon: (
        <TargetIcon
          size={20}
          color={colors.accent.primary}
          testID="create-hub-choice-icon-group-challenge"
        />
      ),
      onPress: choicePress(
        'group_challenge',
        () => void onCreateGroupChallenge()
      ),
    },
    {
      id: 'group',
      title: t('todayProof.creation.create_group'),
      body: t('todayProof.creation.create_group_detail'),
      icon: <UsersIcon size={20} color={colors.accent.primary} />,
      onPress: choicePress('group', () => void onCreateGroup()),
    },
    {
      id: 'solo',
      title: t('todayProof.creation.solo_promise'),
      body: t('todayProof.creation.solo_promise_detail'),
      icon: <ShieldIcon size={20} color={colors.accent.primary} />,
      onPress: choicePress('solo', () => onCreateSoloChallenge()),
    },
    {
      id: 'invite',
      title: pendingInvite
        ? t('todayProof.creation.saved_invite')
        : t('todayProof.creation.join_invite'),
      body: pendingInvite
        ? t('todayProof.creation.saved_invite_detail', {
            code: pendingInvite.code,
          })
        : t('todayProof.creation.join_invite_detail'),
      icon: <QrCodeIcon size={20} color={colors.accent.primary} />,
      onPress: choicePress('invite', onJoinExistingGroup),
    },
    {
      id: 'events',
      title: t('todayProof.creation.browse_events'),
      body: t('todayProof.creation.browse_events_detail'),
      icon: <CalendarIcon size={20} color={colors.accent.primary} />,
      onPress: onBrowseEvents,
    },
  ]
    .filter(
      choice =>
        (choice.id !== 'group_challenge' || hasActiveGroup) &&
        (choice.id !== 'accountability' || hasPromise)
    )
    .sort((a, b) => {
      if (a.id === firstChoice) return -1;
      if (b.id === firstChoice) return 1;
      return 0;
    });

  return (
    <ModalCard
      visible={visible}
      onClose={onClose}
      surface="full_screen"
      animationType="slide"
      dismissOnBackdrop={false}
      accessibilityLabel={t('todayProof.creation.create_hub')}
      cardStyle={styles.card}
      testID="create-hub-modal"
    >
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <View
          style={[
            styles.topBar,
            { paddingHorizontal: phoneLayout.screenInset },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('todayProof.creation.close_hub')}
            testID="create-hub-close"
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && {
                backgroundColor: colors.accent.background,
                opacity: 0.86,
              },
            ]}
          >
            <ChevronLeftIcon size={18} color={PAPER.text} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.topBarLabel}>
            {t('todayProof.creation.header')}
          </Text>
        </View>

        <ScrollView
          testID="create-hub-scroll"
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: phoneLayout.screenInset },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              withReadableLeading(mentaTypography.heading, phoneLayout),
              phoneLayout.isCompactWidth ? styles.fullMeasure : null,
            ]}
          >
            {t('todayProof.creation.title')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              withReadableLeading(mentaTypography.body, phoneLayout),
              { marginTop: phoneLayout.headingToBodyGap },
            ]}
          >
            {t('todayProof.creation.subtitle')}
          </Text>

          {notice ? (
            <View style={styles.notice} accessibilityRole="alert">
              <AlertTriangleIcon size={18} color={PAPER.warning} />
              <View style={styles.noticeBody}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeMessage}>{notice.message}</Text>
                {notice.actionLabel && notice.onAction ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={notice.actionLabel}
                    onPress={notice.onAction}
                    style={({ pressed }) =>
                      pressed
                        ? {
                            backgroundColor: colors.accent.background,
                            opacity: 0.86,
                          }
                        : undefined
                    }
                  >
                    <Text style={styles.noticeAction}>
                      {notice.actionLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          <View
            accessibilityLabel={t('todayProof.creation.create_options')}
            style={styles.choiceList}
          >
            {choices.map((choice, index) => (
              <ChoiceRow
                key={choice.id}
                {...choice}
                showDivider={index < choices.length - 1}
                testID={`create-hub-choice-${choice.id}`}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </ModalCard>
  );
};

const PAPER = {
  canvas: mentaColors.canvas,
  border: mentaColors.border,
  text: mentaColors.text.primary,
  muted: mentaColors.text.secondary,
  warning: mentaColors.warning,
} as const;

const ChoiceRow: React.FC<{
  title: string;
  body: string;
  icon: React.ReactNode;
  onPress: () => void;
  showDivider: boolean;
  testID?: string;
}> = ({ title, body, icon, onPress, showDivider, testID }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.choiceRow,
        showDivider ? styles.choiceDivider : null,
        pressed && {
          backgroundColor: colors.accent.background,
          opacity: 0.86,
        },
      ]}
    >
      <View style={styles.choiceIcon}>{icon}</View>
      <View style={styles.choiceText}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceBody}>{body}</Text>
      </View>
      <ArrowRightIcon size={17} color={colors.text.muted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
    backgroundColor: PAPER.canvas,
  },
  topBar: {
    height: 54,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topBarLabel: {
    color: PAPER.text,
    ...mentaTypography.bodySmallMedium,
    marginLeft: 9,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 17,
    paddingBottom: 24,
  },
  title: {
    color: PAPER.text,
    ...mentaTypography.heading,
  },
  fullMeasure: {
    maxWidth: '100%',
  },
  subtitle: {
    color: PAPER.muted,
    ...mentaTypography.body,
    marginTop: 8,
  },
  choiceList: {
    borderBottomColor: PAPER.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: PAPER.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 24,
  },
  choiceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    minHeight: 82,
    paddingHorizontal: 2,
    paddingVertical: 14,
  },
  choiceDivider: {
    borderBottomColor: PAPER.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  choiceIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 28,
  },
  choiceText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  choiceTitle: {
    ...mentaTypography.bodySemibold,
    color: PAPER.text,
  },
  choiceBody: {
    ...mentaTypography.caption,
    color: PAPER.muted,
  },
  notice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PAPER.warning,
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.warningSoft,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
    marginTop: 14,
  },
  noticeBody: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    color: PAPER.text,
    ...mentaTypography.bodySmallMedium,
  },
  noticeMessage: {
    color: PAPER.muted,
    ...mentaTypography.caption,
  },
  noticeAction: {
    color: PAPER.text,
    ...mentaTypography.labelBold,
    marginTop: 3,
  },
});

export default CreateHubModal;
