import { useMentaPalette } from '@/constants/use-menta-palette';
import React, { useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { MentaNarrator } from '@/components/onboarding/MentaNarrator';
import { reportMentaCheck } from '@/lib/menta-check/api';
import { useTranslation } from '@/lib/localization';
import { mentaTypography } from '@/constants/MentaDesignSystem';

export function MentaGroupFeedback({ submissionId }: { submissionId: string }) {
  const mentaColors = useMentaPalette();

  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'saved' | 'failed' | null>(null);
  const report = async () => {
    if (busy || result === 'saved') return;
    setBusy(true);
    try {
      const response = await reportMentaCheck(submissionId, 'group_question');
      setResult(response.success ? 'saved' : 'failed');
    } catch {
      setResult('failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <AppButton
        variant="text"
        title={t('mentaCheck.group.doesntLookRight')}
        onPress={() => setVisible(true)}
      />
      <SimpleBottomSheet
        visible={visible}
        onClose={() => {
          if (!busy) setVisible(false);
        }}
        scrollableBody
      >
        <View style={{ gap: 20, paddingVertical: 16 }}>
          <MentaNarrator
            state="menta-check"
            message={t('mentaCheck.group.questionTitle')}
          />
          <Text
            style={{
              ...mentaTypography.body,
              color: mentaColors.text.secondary,
            }}
          >
            {t('mentaCheck.group.questionFootnote')}
          </Text>
          <Text
            style={{
              ...mentaTypography.body,
              color: mentaColors.text.secondary,
            }}
          >
            {t('mentaCheck.flag.optionBody')}
          </Text>
          <AppButton
            title={t('mentaCheck.group.questionOptionTitle')}
            loading={busy}
            disabled={result === 'saved'}
            onPress={() => {
              void report();
            }}
          />
          {result ? (
            <Text
              accessibilityRole="alert"
              style={{
                ...mentaTypography.body,
                color: mentaColors.text.primary,
              }}
            >
              {t(
                result === 'saved'
                  ? 'mentaCheck.group.questionDone'
                  : 'mentaCheck.error.generic'
              )}
            </Text>
          ) : null}
        </View>
      </SimpleBottomSheet>
    </>
  );
}
