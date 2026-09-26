import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '@/components/ui/icons';
import { MentaMascot } from '@/components/ui/MentaMascot';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';
import { mentaFonts } from '@/lib/menta-fonts';

const CARD_INK = '#12081F';
const CARD_INK_SOFT = '#2A1A4A';

/** Paper 19 / I01 + I03: the invite as a pass someone would want to open. */
export function InvitePassCard({
  title,
  fromLine,
  initial,
}: {
  title: string;
  fromLine: string;
  initial: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${title} ${fromLine}`}
      style={[styles.pass, { backgroundColor: colors.accent.primary }]}
      testID="invite-pass-card"
    >
      <View style={styles.passWash} />
      <Text style={styles.passTitle}>{title}</Text>
      <View style={styles.passFrom}>
        <View style={styles.passInitial}>
          <Text style={styles.passInitialText}>{initial}</Text>
        </View>
        <Text numberOfLines={1} style={styles.passFromText}>
          {fromLine}
        </Text>
      </View>
      <MentaMascot
        size="hero"
        state="referral-invitation"
        style={styles.passMascot}
      />
    </View>
  );
}

/** A plain, scannable list: each line is one thing that is true. */
export function InviteChecklist({
  items,
}: {
  items: readonly { text: string; done?: boolean; pending?: boolean }[];
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.list}>
      {items.map(item => (
        <View key={item.text} style={styles.listRow}>
          <View
            style={[
              styles.listMark,
              item.pending
                ? styles.listMarkPending
                : item.done
                  ? styles.listMarkDone
                  : { backgroundColor: colors.accent.background },
            ]}
          >
            {item.pending ? null : (
              <CheckIcon
                color={item.done ? mentaColors.success : colors.accent.primary}
                size={12}
              />
            )}
          </View>
          <Text
            style={[
              styles.listText,
              item.pending ? styles.listTextPending : null,
            ]}
          >
            {item.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Paper 19 / I02: you, the invite in transit, and the empty checker seat. */
export function InviteSentPair({ initial }: { initial: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.pair} testID="invite-sent-pair">
      <View style={styles.pairPerson}>
        <View
          style={[styles.pairAvatar, { borderColor: colors.accent.primary }]}
        >
          <Text style={styles.pairInitial}>{initial}</Text>
        </View>
        <Text style={styles.pairLabel}>{t('groups.share.you')}</Text>
      </View>
      <MentaMascot
        size="lg"
        state="referral-invitation"
        style={styles.pairMascot}
      />
      <View style={styles.pairPerson}>
        <View style={[styles.pairAvatar, styles.pairAvatarEmpty]} />
        <Text style={[styles.pairLabel, styles.pairLabelMuted]}>
          {t('groups.share.checker')}
        </Text>
      </View>
    </View>
  );
}

export const inviteHeadingStyle = {
  ...mentaTypography.heading,
  color: mentaColors.text.primary,
  fontFamily: mentaFonts.newsreader.semibold,
};

const styles = StyleSheet.create({
  pass: {
    borderRadius: 24,
    gap: mentaSpacing[10],
    minHeight: 236,
    overflow: 'hidden',
    padding: mentaSpacing[5],
    justifyContent: 'space-between',
  },
  passWash: {
    backgroundColor: '#FFFFFF',
    borderRadius: mentaRadii.round,
    height: 300,
    left: -110,
    opacity: 0.18,
    position: 'absolute',
    top: -170,
    width: 300,
  },
  passTitle: {
    color: CARD_INK,
    fontFamily: mentaFonts.newsreader.semibold,
    fontSize: 34,
    letterSpacing: -0.7,
    lineHeight: 38,
    maxWidth: 190,
  },
  passFrom: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
    maxWidth: '62%',
  },
  passInitial: {
    alignItems: 'center',
    backgroundColor: CARD_INK,
    borderRadius: mentaRadii.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  passInitialText: {
    color: '#E9DDFF',
    fontFamily: mentaFonts.newsreader.semibold,
    fontSize: 16,
  },
  passFromText: {
    color: CARD_INK_SOFT,
    flexShrink: 1,
    fontFamily: mentaFonts.inter.medium,
    fontSize: 15,
  },
  passMascot: {
    position: 'absolute',
    right: -10,
    top: 18,
  },
  list: {
    gap: mentaSpacing[4],
  },
  listRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  listMark: {
    alignItems: 'center',
    borderRadius: mentaRadii.round,
    height: 24,
    justifyContent: 'center',
    marginTop: 1,
    width: 24,
  },
  listMarkDone: {
    backgroundColor: '#15332A',
  },
  listMarkPending: {
    borderColor: '#57564F',
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  listText: {
    ...mentaTypography.lead,
    color: '#D9D8D1',
    flex: 1,
  },
  listTextPending: {
    color: mentaColors.text.muted,
  },
  pair: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: mentaSpacing[10],
  },
  pairPerson: {
    alignItems: 'center',
    gap: mentaSpacing[2],
    width: 108,
  },
  pairAvatar: {
    alignItems: 'center',
    backgroundColor: '#2A2340',
    borderRadius: mentaRadii.round,
    borderWidth: 2,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  pairAvatarEmpty: {
    backgroundColor: 'transparent',
    borderColor: mentaColors.text.muted,
    borderStyle: 'dashed',
  },
  pairInitial: {
    color: '#E9DDFF',
    fontFamily: mentaFonts.newsreader.semibold,
    fontSize: 36,
  },
  pairLabel: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  pairLabelMuted: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.medium,
  },
  pairMascot: {
    marginBottom: mentaSpacing[6],
  },
});
