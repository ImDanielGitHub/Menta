import {
  type MentaPalette,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { AppButton } from '@/components/ui/AppButton';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { MentaNarrator } from '@/components/onboarding/MentaNarrator';
import { SignedImage } from '@/components/ui/SignedImage';
import {
  TodayPromiseReceipt,
  type TodayPromiseReceiptData,
} from '@/components/today/TodayPromiseReceipt';

import { useTranslation } from '@/lib/localization';
import { mentaSpeechFor, mentaStatusFor } from '@/lib/menta-check/copy';
import {
  askFriendForMentaProof,
  countMentaProofAnyway,
  newMentaEventId,
  reportMentaCheck,
} from '@/lib/menta-check/api';
import type { MentaTodayItem } from '@/lib/menta-check/types';
import { useMentaCheckOverview } from '@/hooks/use-menta-check';
import { withTimeout } from '@/utils/api';
import { useAuthStore } from '@/store/auth-store';

export function MentaToday({
  item,
  onChanged,
  promiseReceipt,
}: {
  item: MentaTodayItem;
  onChanged: () => void;
  promiseReceipt?: TodayPromiseReceiptData | null;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t, locale } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const overview = useMentaCheckOverview();
  const [sheet, setSheet] = useState(false);
  const owner = useAuthStore(state => state.user?.id);
  const actionScope = useRef({
    owner,
    challengeId: item.challengeId,
    submissionId: item.submissionId,
    eventId: newMentaEventId(),
    active: false,
    generation: 0,
  });
  if (
    actionScope.current.owner !== owner ||
    actionScope.current.challengeId !== item.challengeId ||
    actionScope.current.submissionId !== item.submissionId
  )
    actionScope.current = {
      owner,
      challengeId: item.challengeId,
      submissionId: item.submissionId,
      eventId: newMentaEventId(),
      active: false,
      generation: 0,
    };
  const [busyScope, setBusyScope] = useState<typeof actionScope.current | null>(
    null
  );
  const busy = busyScope === actionScope.current;
  const runningScope = useRef<typeof actionScope.current | null>(null);
  const focusedActionScope = actionScope.current;
  useFocusEffect(
    React.useCallback(() => {
      const scope = focusedActionScope;
      scope.active = true;
      scope.generation += 1;
      setBusyScope(null);
      setMessage(null);
      return () => {
        scope.active = false;
        scope.generation += 1;
      };
    }, [focusedActionScope])
  );
  const [message, setMessage] = useState<string | null>(null);
  const speech = mentaSpeechFor(item, t);
  const status = mentaStatusFor(item, t);
  const openProof = () =>
    router.push({
      pathname: '/challenges/[id]',
      params: {
        id: item.challengeId,
        ...(item.submissionId
          ? { view: 'proof', proofId: item.submissionId }
          : {}),
      },
    });
  if (!speech) return null;
  const deadline = item.graceUntil
    ? new Date(item.graceUntil).toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;
  const act = async (action: 'count' | 'friend' | 'report') => {
    const scope = actionScope.current;
    const generation = scope.generation;
    if (
      !scope.owner ||
      !scope.active ||
      runningScope.current === scope ||
      !scope.submissionId
    )
      return;
    const current = () =>
      scope.active &&
      scope.generation === generation &&
      actionScope.current === scope &&
      scope.owner === useAuthStore.getState().user?.id;
    runningScope.current = scope;
    setBusyScope(scope);
    setMessage(null);
    try {
      const result = await withTimeout(
        action === 'count'
          ? countMentaProofAnyway(scope.submissionId, scope.eventId)
          : action === 'friend'
            ? askFriendForMentaProof(scope.submissionId, scope.eventId)
            : reportMentaCheck(
                scope.submissionId,
                item.state === 'not_yet' ? 'false_negative' : 'false_positive'
              ),
        15_000,
        'Proof action'
      );
      if (!current()) return;
      if (!result.success) {
        setMessage(
          result.code === 'WEEKLY_LIMIT'
            ? t('mentaCheck.error.weeklyLimit')
            : result.code === 'INSUFFICIENT_BALANCE'
              ? t('mentaCheck.override.short', {
                  amount: result.cost ?? overview.data?.overrideCost ?? 15,
                })
              : t('mentaCheck.error.generic')
        );
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ['menta-check', scope.owner],
      });
      if (!current()) return;
      await queryClient.invalidateQueries({
        queryKey: ['momenta', scope.owner],
      });
      if (!current()) return;
      onChanged();
      if (action === 'report') setMessage(t('mentaCheck.override.thanks'));
      else setSheet(false);
      if (action === 'friend')
        router.push({
          pathname: '/promise-accountability',
          params: { challengeId: item.challengeId, source: 'promise' },
        });
    } catch {
      if (current()) setMessage(t('mentaCheck.error.generic'));
    } finally {
      if (runningScope.current === scope) runningScope.current = null;
      if (current()) setBusyScope(null);
    }
  };
  return (
    <View style={styles.content} testID="menta-today">
      <MentaNarrator
        state={speech.mascot}
        message={speech.title}
        detail={speech.detail}
      />
      <View style={styles.receipt}>
        {item.mediaUrl && item.mediaType === 'photo' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('mentaCheck.today.view')}: ${t('mentaCheck.today.yourPhoto')}`}
            onPress={openProof}
            style={styles.photoButton}
          >
            <SignedImage
              uri={item.mediaUrl}
              variant="full"
              contentFit="contain"
              style={styles.photo}
              alt={t('mentaCheck.today.yourPhoto')}
            />
          </Pressable>
        ) : null}
        <View style={styles.receiptDetails}>
          <View style={styles.receiptCopy}>
            <Text style={styles.title}>
              {t(
                item.mediaType === 'photo'
                  ? 'mentaCheck.today.yourPhoto'
                  : item.mediaType === 'video'
                    ? 'todayProof.promise.video_proof'
                    : 'todayProof.promise.text_proof'
              )}
            </Text>
            <Text style={styles.body}>
              {status?.label}
              {status?.detail ? ` · ${status.detail}` : ''}
            </Text>
          </View>
          <AppButton
            variant="text"
            title={t('mentaCheck.today.view')}
            onPress={openProof}
          />
        </View>
      </View>
      {item.state === 'not_yet' ? (
        <>
          <AppButton
            fullWidth
            title={t(
              item.proofKind === 'text'
                ? 'mentaCheck.today.sendAnotherNote'
                : item.proofKind === 'video'
                  ? 'mentaCheck.today.sendAnotherVideo'
                  : 'mentaCheck.today.sendAnotherPhoto'
            )}
            onPress={() =>
              router.push({
                pathname: '/verification',
                params: {
                  challengeId: item.challengeId,
                  verificationType: item.proofKind,
                  replacesSubmissionId: item.submissionId ?? '',
                  localDay: item.localDay,
                },
              })
            }
          />
          {deadline ? (
            <Text style={styles.body}>
              {t('mentaCheck.today.deadline', { time: deadline })}
            </Text>
          ) : null}
          <AppButton
            variant="text"
            title={t('mentaCheck.today.iDidIt')}
            onPress={() => {
              setMessage(null);
              setSheet(true);
            }}
          />
        </>
      ) : item.status === 'approved' &&
        item.reviewSource !== 'self_override' &&
        !item.flagged ? (
        <AppButton
          variant="text"
          title={t('mentaCheck.status.notRight')}
          onPress={() => {
            setMessage(null);
            setSheet(true);
          }}
        />
      ) : null}
      {promiseReceipt ? <TodayPromiseReceipt receipt={promiseReceipt} /> : null}
      <SimpleBottomSheet
        visible={sheet}
        onClose={() => {
          if (!busy) setSheet(false);
        }}
        scrollableBody
      >
        <View style={styles.content}>
          <MentaNarrator
            state={
              item.state === 'not_yet' ? 'today-correction' : 'menta-check'
            }
            message={t(
              item.state === 'not_yet'
                ? 'mentaCheck.override.title'
                : 'mentaCheck.flag.title'
            )}
          />
          {item.state === 'not_yet' ? (
            <>
              <AppButton
                variant="secondary"
                disabled={busy}
                title={t('mentaCheck.override.askTitle')}
                onPress={() => {
                  void act('friend');
                }}
              />
              <Text style={styles.body}>
                {t('mentaCheck.override.countBody', {
                  count: item.overridesLeft,
                })}
              </Text>
              <AppButton
                disabled={busy || item.overridesLeft <= 0 || !overview.data}
                title={`${t('mentaCheck.override.countTitle')} · ${overview.data?.overrideCost ?? 15} Momenta`}
                onPress={() => {
                  void act('count');
                }}
              />
            </>
          ) : (
            <Text style={styles.body}>{t('mentaCheck.flag.optionBody')}</Text>
          )}
          <AppButton
            variant="text"
            disabled={busy}
            title={t(
              item.state === 'not_yet'
                ? 'mentaCheck.override.tellTitle'
                : 'mentaCheck.flag.optionTitle'
            )}
            onPress={() => {
              void act('report');
            }}
          />
          {message ? (
            <Text accessibilityRole="alert" style={styles.body}>
              {message}
            </Text>
          ) : null}
        </View>
      </SimpleBottomSheet>
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    content: { gap: mentaSpacing[4], paddingVertical: mentaSpacing[4] },
    receipt: {
      borderRadius: 16,
      backgroundColor: mentaColors.surface,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: mentaColors.border,
    },
    photoButton: { width: '100%' },
    photo: {
      width: '100%',
      aspectRatio: 4 / 3,
      backgroundColor: mentaColors.canvas,
    },
    receiptDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: mentaSpacing[4],
      gap: mentaSpacing[3],
    },
    receiptCopy: { flex: 1, gap: mentaSpacing[1] },
    title: { ...mentaTypography.bodyMedium, color: mentaColors.text.primary },
    body: { ...mentaTypography.body, color: mentaColors.text.secondary },
  });
  return { styles };
};
