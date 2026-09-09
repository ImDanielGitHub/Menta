import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { AppButton } from '@/components/ui/AppButton';
import { AlertTriangleIcon, RefreshCwIcon } from '@/components/ui/icons';
import { useTranslation } from '@/lib/localization/use-translation';
import { emitHaptic } from '@/lib/motion/haptics';

export type DestructiveSheetStatus =
  | 'confirm'
  | 'loading'
  | 'failed'
  | 'unknown';

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
  const { colors, borderRadius, spacing, typography } = theme;
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
            <View style={{ gap: spacing.md }}>
              <View
                accessible
                accessibilityRole="alert"
                style={[styles.stateCopy, { gap: spacing.sm }]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <AlertTriangleIcon size={18} color={colors.status.error} />
                  <Text
                    accessibilityRole="header"
                    style={{
                      color: colors.text.primary,
                      fontSize: typography.sizes.lg,
                      fontWeight: '700',
                    }}
                  >
                    {resultCopy.heading}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontSize: typography.sizes.sm,
                    lineHeight: typography.lineHeights.relaxed,
                  }}
                >
                  {resultCopy.body}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: typography.sizes.xs,
                  lineHeight: 18,
                }}
              >
                {resultCopy.notice}
              </Text>

              {onRetry ? (
                <AppButton
                  title={t('shared.action.checkAgain')}
                  onPress={onRetry}
                  haptic={false}
                  variant="primary"
                  size="large"
                  icon={<RefreshCwIcon size={16} color={colors.text.inverse} />}
                  testID={`${testID}-retry`}
                />
              ) : null}
              {onContactSupport ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('shared.action.contactSupport')}
                  onPress={onContactSupport}
                  testID={`${testID}-support`}
                  style={{
                    minHeight: 44,
                    justifyContent: 'center',
                    paddingVertical: spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text.secondary,
                      textAlign: 'center',
                      fontSize: typography.sizes.sm,
                      fontWeight: '600',
                    }}
                  >
                    {t('shared.action.contactSupport')}
                  </Text>
                </Pressable>
              ) : null}
              <AppButton
                title={t('shared.action.close')}
                onPress={handleClose}
                variant="ghost"
                size="large"
                testID={`${testID}-close`}
              />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <View
                accessible
                accessibilityRole="alert"
                style={[styles.stateCopy, { gap: spacing.sm }]}
              >
                <View
                  style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: spacing.sm,
                  }}
                >
                  <AlertTriangleIcon size={18} color={colors.status.error} />
                  <Text
                    accessibilityRole="header"
                    style={{
                      color: colors.status.error,
                      fontSize: typography.sizes.lg,
                      fontWeight: '700',
                    }}
                  >
                    {title}
                  </Text>
                </View>
                {description ? (
                  <Text
                    style={{
                      color: colors.text.secondary,
                      fontSize: typography.sizes.sm,
                      lineHeight: typography.lineHeights.relaxed,
                    }}
                  >
                    {description}
                  </Text>
                ) : null}
              </View>

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: typography.sizes.sm,
                    fontWeight: '500',
                  }}
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
                      borderRadius: borderRadius.md,
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

              <View style={{ gap: 8 }}>
                <AppButton
                  title={
                    isLoading
                      ? t('shared.confirm.deleting')
                      : (confirmLabel ?? t('shared.action.confirm'))
                  }
                  onPress={handleConfirm}
                  variant="destructive"
                  size="large"
                  disabled={!canConfirm}
                  loading={isLoading}
                  testID={`${testID}-confirm`}
                />
                <AppButton
                  title={t('shared.action.cancel')}
                  onPress={handleClose}
                  variant="ghost"
                  size="large"
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
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
  },
  stateCopy: {
    paddingHorizontal: 2,
  },
});

export default ConfirmDestructiveSheet;
