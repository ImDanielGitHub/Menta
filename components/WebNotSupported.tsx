import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SmartphoneIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization/use-translation';

/**
 * The web entrypoint deliberately has no store link or download control.
 * Until a real, verified store route exists, it must leave invite and draft
 * state untouched rather than claiming an unavailable handoff succeeded.
 */
export const WebNotSupported: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content} testID="web-mobile-unavailable">
        <View style={styles.header}>
          <View style={styles.iconSlot}>
            <SmartphoneIcon color={mentaColors.text.primary} size={21} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{t('shared.web.eyebrow')}</Text>
            <Text style={styles.headerTitle}>{t('shared.web.title')}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.explanation}>{t('shared.web.explanation')}</Text>

          <View style={styles.rows}>
            <WebStateRow
              detail={t('shared.web.waiting')}
              title={t('shared.web.nothingChanged')}
            />
            <WebStateRow
              detail={t('shared.web.openOriginal')}
              title={t('shared.web.continue')}
              tone="warning"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const WebStateRow = ({
  detail,
  title,
  tone = 'neutral',
}: {
  detail: string;
  title: string;
  tone?: 'neutral' | 'warning';
}) => (
  <View style={styles.row}>
    <View
      style={[styles.rowIcon, tone === 'warning' && styles.rowIconWarning]}
    />
    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowDetail}>{detail}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: mentaColors.canvas,
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: mentaLayout.taskLane,
    paddingHorizontal: mentaSpacing[6],
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  iconSlot: {
    alignItems: 'center',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.small,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: mentaColors.text.secondary,
    ...mentaTypography.label,
  },
  headerTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodyMedium,
  },
  body: {
    flex: 1,
    gap: mentaSpacing[5],
    paddingTop: mentaSpacing[5],
  },
  explanation: {
    color: mentaColors.text.secondary,
    maxWidth: 330,
    ...mentaTypography.body,
  },
  rows: {
    gap: 0,
  },
  row: {
    alignItems: 'flex-start',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    paddingVertical: 14,
  },
  rowIcon: {
    backgroundColor: mentaColors.raised,
    borderRadius: mentaRadii.small,
    height: 34,
    width: 34,
  },
  rowIconWarning: {
    backgroundColor: mentaColors.warningSoft,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodyMedium,
  },
  rowDetail: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
});
