import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  IPadTwoPaneWorkspace,
  useIPadPortraitWorkspace,
} from '@/components/ipad/ipad-workspace';
import { StreakWidgetPreview } from '@/components/widgets/StreakWidgetPreview';
import { WidgetHomeScene } from '@/components/widgets/WidgetHomeScene';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { makeStreakWidgetSnapshot } from '@/lib/widgets/widget-model';
import {
  refreshHomeWidget,
  saveHomeWidgetPreferences,
  useHomeWidgetStore,
} from '@/store/home-widget-store';

export default function HomeWidgetScreen() {
  const state = useHomeWidgetStore();
  const { locale, t } = useTranslation();
  const router = useRouter();
  const wide = useIPadPortraitWorkspace();
  const [instructions, setInstructions] = useState(false);
  const [choosing, setChoosing] = useState(false);
  useEffect(() => {
    if (state.ready) void refreshHomeWidget(true);
  }, [state.ready, state.ownerId]);
  const selected =
    state.promises.find(
      promise => promise.id === state.preferences.promiseId
    ) ?? (!state.preferences.promiseId ? state.promises[0] : undefined);
  const preview =
    selected && state.snapshot.state === 'choose'
      ? makeStreakWidgetSnapshot({
          promise: selected,
          showText: state.preferences.showText,
          locale,
        })
      : state.snapshot;
  const back = () =>
    instructions
      ? setInstructions(false)
      : backOrReplace(router, '/(tabs)/profile');
  const showInstructions = async () => {
    if (
      selected &&
      (await saveHomeWidgetPreferences({
        promiseId: selected.id,
        dismissed: true,
      }))
    )
      setInstructions(true);
  };
  const illustration = instructions ? (
    // Paper 19 / W01: the widget on a Home Screen, then three plain steps.
    <View style={styles.illustration}>
      <WidgetHomeScene snapshot={preview} />
      <Text
        accessibilityRole="header"
        style={[styles.heading, styles.headingLeft]}
      >
        {t('widgets.instructions')}
      </Text>
    </View>
  ) : (
    <View style={styles.illustration}>
      <MentaMascot state="widget-guide" size="xl" />
      <Text accessibilityRole="header" style={styles.heading}>
        {t('widgets.heading')}
      </Text>
      <Text style={styles.subtitle}>{t('widgets.subtitle')}</Text>
      {state.loading && !state.promises.length ? (
        <SkeletonLoader
          height={wide ? 350 : 170}
          borderRadius={24}
          accessibilityLabel={t('widgets.loading')}
        />
      ) : (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>{t('widgets.preview')}</Text>
          <StreakWidgetPreview snapshot={preview} large={wide} />
        </View>
      )}
    </View>
  );
  const controls = (
    <View style={styles.controls}>
      {state.error ? (
        <AppInlineNotice
          tone="warning"
          title={t('widgets.title')}
          description={t(
            state.error === 'save' ? 'widgets.saveError' : 'widgets.error'
          )}
          actionLabel={t('widgets.retry')}
          onAction={() => {
            void refreshHomeWidget(true);
          }}
        />
      ) : null}
      {instructions ? (
        <>
          {(['step1', 'step2', 'step3'] as const).map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <View style={styles.stepCopy}>
                <Text style={styles.controlTitle}>{t(`widgets.${step}`)}</Text>
                <Text style={styles.body}>{t(`widgets.${step}Detail`)}</Text>
              </View>
            </View>
          ))}
          <AppButton
            fullWidth
            size="large"
            variant="accent"
            title={t('widgets.gotIt')}
            onPress={() => backOrReplace(router, '/(tabs)/profile')}
          />
          <AppButton
            fullWidth
            variant="ghost"
            title={t('widgets.notNow')}
            onPress={() => backOrReplace(router, '/(tabs)/profile')}
          />
        </>
      ) : (
        <>
          <AppButton
            fullWidth
            variant="outline"
            title={`${t('widgets.promise')}: ${selected?.title ?? t('widgets.choose')}`}
            onPress={() => setChoosing(value => !value)}
            disabled={!state.promises.length || state.saving}
          />
          {choosing ? (
            <View style={styles.choices}>
              {state.promises.map(promise => (
                <AppButton
                  key={promise.id}
                  fullWidth
                  variant={selected?.id === promise.id ? 'accent' : 'outline'}
                  title={promise.title}
                  disabled={state.saving}
                  onPress={() => {
                    void saveHomeWidgetPreferences({
                      promiseId: promise.id,
                    }).then(saved => {
                      if (saved) setChoosing(false);
                    });
                  }}
                />
              ))}
            </View>
          ) : null}
          <View style={styles.privacy}>
            <View style={styles.toggleRow}>
              <Text style={styles.controlTitle}>{t('widgets.showText')}</Text>
              <Switch
                accessibilityLabel={t('widgets.showText')}
                value={state.preferences.showText}
                disabled={state.saving || !selected}
                trackColor={{
                  false: mentaColors.border,
                  true: mentaColors.action,
                }}
                onValueChange={showText => {
                  void saveHomeWidgetPreferences({
                    showText,
                    ...(selected ? { promiseId: selected.id } : {}),
                  });
                }}
              />
            </View>
            <Text style={styles.body}>
              {t(
                state.preferences.showText
                  ? 'widgets.publicDetail'
                  : 'widgets.privateDetail'
              )}
            </Text>
          </View>
          <AppButton
            fullWidth
            size="large"
            variant="accent"
            title={t('widgets.howToAdd')}
            disabled={!selected || state.loading || state.saving}
            onPress={() => {
              void showInstructions();
            }}
          />
          {!state.promises.length && !state.loading ? (
            <AppButton
              title={t('widgets.state.empty.action')}
              onPress={() => router.push('/create-challenge?mode=solo')}
              fullWidth
            />
          ) : null}
          <AppButton
            fullWidth
            variant="ghost"
            title={t('widgets.notNow')}
            onPress={() => backOrReplace(router, '/(tabs)/profile')}
          />
        </>
      )}
    </View>
  );
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        lane="working"
        scrollable
        hasTabBar={false}
        contentContainerStyle={styles.screen}
        testID="home-widget-screen"
      >
        <AppTopBar title={t('widgets.title')} onBack={back} />
        {!state.available ? (
          <AppInlineNotice
            title={t('widgets.title')}
            description={t('widgets.unavailable')}
            tone="info"
          />
        ) : (
          <IPadTwoPaneWorkspace
            enabled={wide}
            primaryStyle={styles.pane}
            secondaryStyle={styles.pane}
            primary={
              wide ? (
                illustration
              ) : (
                <>
                  {illustration}
                  {controls}
                </>
              )
            }
            secondary={controls}
          />
        )}
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { gap: mentaSpacing[6], paddingBottom: mentaSpacing[6] },
  pane: { flex: 1 },
  illustration: {
    alignItems: 'center',
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[6],
    width: '100%',
  },
  heading: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
    textAlign: 'center',
    maxWidth: 480,
  },
  subtitle: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    textAlign: 'center',
    maxWidth: 460,
  },
  preview: { gap: mentaSpacing[2], width: '100%', maxWidth: 480 },
  previewLabel: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  controls: { gap: mentaSpacing[5], width: '100%' },
  privacy: { gap: mentaSpacing[2] },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  controlTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
    flexShrink: 1,
  },
  body: { ...mentaTypography.body, color: mentaColors.text.secondary },
  choices: { gap: mentaSpacing[2] },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: mentaSpacing[4],
  },
  stepCopy: { flex: 1, minWidth: 0, gap: mentaSpacing[2] },
  headingLeft: { alignSelf: 'stretch', textAlign: 'left' },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: 28,
    justifyContent: 'center',
    marginTop: 2,
    width: 28,
  },
  stepNumber: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.action,
  },
});
