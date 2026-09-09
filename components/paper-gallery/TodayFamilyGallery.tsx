import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MentaMascot } from '@/components/ui/MentaMascot';
import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  TODAY_FAMILY_PAPER_STATES,
  type TodayFamilyAction,
  type TodayFamilyState,
} from '@/lib/paper-state-registry/today';

type TodayFamilyGalleryProps = {
  states?: readonly TodayFamilyState[];
  onAction?: (action: TodayFamilyAction, state: TodayFamilyState) => void;
};

const toneColors = {
  action: mentaColors.action,
  warning: mentaColors.warning,
  success: mentaColors.success,
  danger: mentaColors.danger,
  neutral: mentaColors.border,
} as const;

/**
 * Dev-only preview surface. It is intentionally not registered as a route.
 * Consumers decide how to navigate from an explicit Paper action id.
 */
export const TodayFamilyGallery = ({
  states = TODAY_FAMILY_PAPER_STATES,
  onAction,
}: TodayFamilyGalleryProps) => (
  <View style={styles.gallery} testID="today-family-gallery">
    {states.map(state => (
      <TodayFamilyStatePreview
        key={state.id}
        onAction={onAction}
        state={state}
      />
    ))}
  </View>
);

export const TodayFamilyStatePreview = ({
  state,
  onAction,
}: {
  state: TodayFamilyState;
  onAction?: (action: TodayFamilyAction, state: TodayFamilyState) => void;
}) => {
  const tone = toneColors[state.tone];
  const invoke = (action: TodayFamilyAction) => onAction?.(action, state);

  return (
    <View
      accessibilityLabel={`${state.overline}. ${state.title}. ${state.detail}`}
      style={styles.state}
      testID={`today-paper-${state.id}`}
    >
      <Text style={[styles.overline, { color: tone }]}>{state.overline}</Text>
      {state.id === 'HOME-01' ? (
        <View style={styles.skeletons} testID="today-paper-loading-skeleton">
          <SkeletonLoader height={40} width="34%" />
          <SkeletonLoader height={20} width="88%" />
          <SkeletonLoader height={20} width="72%" />
          <SkeletonLoader height={52} />
        </View>
      ) : (
        <>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Text style={styles.title}>{state.title}</Text>
              <Text style={styles.detail}>{state.detail}</Text>
            </View>
            {state.mascot ? (
              <MentaMascot size="md" state={state.mascot} />
            ) : null}
          </View>
          {state.largeValue ? (
            <Text style={styles.largeValue}>{state.largeValue}</Text>
          ) : null}
          {state.facts.length > 0 ? (
            <View style={styles.facts}>
              {state.facts.map(fact => (
                <View
                  key={`${fact.label}:${fact.value}`}
                  style={styles.factRow}
                >
                  <Text style={styles.factLabel}>{fact.label}</Text>
                  <Text style={styles.factValue}>{fact.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
      <View style={styles.actions}>
        <AppButton
          disabled={state.primaryAction.disabled}
          fullWidth
          onPress={() => invoke(state.primaryAction)}
          title={state.primaryAction.label}
          variant="primary"
        />
        <AppButton
          disabled={state.secondaryAction.disabled}
          fullWidth
          onPress={() => invoke(state.secondaryAction)}
          title={state.secondaryAction.label}
          variant="outline"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gallery: {
    alignSelf: 'center',
    gap: mentaSpacing[6],
    maxWidth: mentaLayout.focusedLane,
    width: '100%',
  },
  state: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[5],
    paddingBottom: mentaSpacing[6],
  },
  overline: {
    ...mentaTypography.labelBold,
  },
  skeletons: {
    gap: mentaSpacing[3],
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[4],
  },
  headingCopy: {
    flex: 1,
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[2],
  },
  largeValue: {
    ...mentaTypography.display,
    color: mentaColors.text.primary,
    fontSize: 64,
    lineHeight: 60,
  },
  facts: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  factRow: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[1],
    paddingVertical: mentaSpacing[3],
  },
  factLabel: {
    ...mentaTypography.label,
    color: mentaColors.text.secondary,
  },
  factValue: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.primary,
  },
  actions: {
    gap: mentaSpacing[2],
  },
});
