import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { AppButton } from '@/components/ui/AppButton';
import { AlertTriangleIcon, RefreshCwIcon } from '@/components/ui/icons';
import { useTranslation } from '@/lib/localization/use-translation';
import { emitHaptic } from '@/lib/motion/haptics';

export type DestructiveSheetStatus =
  'confirm' | 'loading' | 'failed' | 'unknown';

type Props = {
  visible: boolean;
  title: string;
  confirmLabel?: string;
  nameToType: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  status?: DestructiveSheetStatus;
  onRetry?: () => void;
  onContactSupport?: () => void;
  testID?: string;
};

export const ConfirmDestructiveSheet: React.FC<Props> = ({
  visible,
  title,
  confirmLabel,
  nameToType,
  description,
  onClose,
  onConfirm,
  loading,
  status = 'confirm',
  onRetry,
  onContactSupport,
  testID = 'confirm-destructive-sheet',
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const { colors } = theme;
  const [input, setInput] = useState('');
  const resolvedStatus: DestructiveSheetStatus = loading ? 'loading' : status;
  const isLoading = resolvedStatus === 'loading';
  const isResultState =
    resolvedStatus === 'failed' || resolvedStatus === 'unknown';

  useEffect(() => {
    if (visible && resolvedStatus === 'confirm') {
      setInput('');
    }
  }, [visible, nameToType, resolvedStatus]);

  const normalizedValues = useMemo(() => {
    const normalize = (value: string) =>
      value.trim().replace(/\s+/g, ' ').toLowerCase();
    return {
      input: normalize(input),
      target: normalize(nameToType),
    };
  }, [input, nameToType]);

  const canConfirm =
    !isLoading &&
    resolvedStatus === 'confirm' &&
    normalizedValues.input === normalizedValues.target;

  const handleConfirm = () => {
    if (!canConfirm) return;
    void emitHaptic({ type: 'destructive-commit' });
    void onConfirm();
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const resultCopy =
    resolvedStatus === 'unknown'
      ? {
          heading: t('shared.confirm.unknown.heading'),
          body: t('shared.confirm.unknown.body'),
          notice: t('shared.confirm.unknown.notice'),
        }
      : {
          heading: t('shared.confirm.failed.heading'),
          body: t('shared.confirm.failed.body'),
          notice: t('shared.confirm.failed.notice'),
        };

  return (
    <SimpleBottomSheet
      visible={visible}
      onClose={handleClose}
      maxHeight={Math.floor(height * 0.88)}
      dismissOnBackdrop={!isLoading}
      testID={testID}
      scrollableBody={
        <>
          {isResultState ? (
            <View style={styles.stack}>
              <View
                accessible
                accessibilityRole="alert"
                style={styles.stateCopy}
              >
                <View style={styles.resultHeading}>
                  <AlertTriangleIcon size={20} color={colors.status.error} />
                  <Text
                    accessibilityRole="header"
                    style={[styles.heading, { color: colors.text.primary }]}
                  >
                    {resultCopy.heading}
                  </Text>
                </View>
                <Text style={[styles.body, { color: colors.text.secondary }]}>
                  {resultCopy.body}
                </Text>
              </View>
              <Text style={[styles.notice, { color: colors.text.secondary }]}>
                {resultCopy.notice}
              </Text>

              {onRetry ? (
                <AppButton
                  title={t('shared.action.checkAgain')}
                  onPress={onRetry}
                  haptic={false}
                  variant="primary"
                  size="large"
                  fullWidth
                  icon={<RefreshCwIcon size={16} color={colors.text.inverse} />}
                  testID={`${testID}-retry`}
                />
              ) : null}
              {onContactSupport ? (
                <AppButton
                  title={t('shared.action.contactSupport')}
                  onPress={onContactSupport}
                  variant="ghost"
                  size="large"
                  fullWidth
                  testID={`${testID}-support`}
                />
              ) : null}
              <AppButton
                title={t('shared.action.close')}
                onPress={handleClose}
                variant="ghost"
                size="large"
                fullWidth
                testID={`${testID}-close`}
              />
            </View>
          ) : (
            <View style={styles.stack}>
              <View
                accessible
                accessibilityRole="alert"
                style={styles.stateCopy}
              >
                <Text
                  accessibilityRole="header"
                  style={[styles.heading, { color: colors.text.primary }]}
                >
                  {title}
                </Text>
                {description ? (
                  <Text style={[styles.body, { color: colors.text.secondary }]}>
                    {description}
                  </Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text
                  style={[styles.fieldLabel, { color: colors.text.primary }]}
                >
                  {t('shared.confirm.typeToConfirm', { name: nameToType })}
                </Text>
                <TextInput
                  accessibilityLabel={t(
                    'shared.confirm.typeToConfirmAccessibility',
                    {
                      name: nameToType,
                    }
                  )}
                  value={input}
                  onChangeText={setInput}
                  placeholder={nameToType}
                  placeholderTextColor={colors.text.tertiary}
                  editable={!isLoading}
                  style={[
                    styles.input,
                    {
                      color: colors.text.primary,
                      backgroundColor: colors.background.secondary,
                      borderColor: canConfirm
                        ? colors.status.error
                        : colors.border.primary,
                    },
                  ]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={canConfirm ? handleConfirm : undefined}
                  testID={`${testID}-input`}
                />
              </View>

              <View style={styles.actions}>
                <AppButton
                  title={
                    isLoading
                      ? t('shared.confirm.deleting')
                      : (confirmLabel ?? t('shared.action.confirm'))
                  }
                  onPress={handleConfirm}
                  variant="destructive"
                  size="large"
                  fullWidth
                  disabled={!canConfirm}
                  loading={isLoading}
                  testID={`${testID}-confirm`}
                />
                <AppButton
                  title={t('shared.action.cancel')}
                  onPress={handleClose}
                  variant="ghost"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  testID={`${testID}-cancel`}
                />
              </View>
            </View>
          )}
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: mentaSpacing[5],
  },
  stateCopy: {
    gap: mentaSpacing[2],
  },
  resultHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[2],
  },
  heading: {
    ...mentaTypography.title,
    flexShrink: 1,
  },
  body: {
    ...mentaTypography.body,
  },
  notice: {
    ...mentaTypography.bodySmall,
  },
  field: {
    gap: mentaSpacing[2],
  },
  fieldLabel: {
    ...mentaTypography.bodySmallMedium,
  },
  input: {
    ...mentaTypography.body,
    minHeight: mentaLayout.primaryControlHeight,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
    borderRadius: mentaRadii.medium,
    borderWidth: 1,
  },
  actions: {
    gap: mentaSpacing[2],
  },
});

export default ConfirmDestructiveSheet;
