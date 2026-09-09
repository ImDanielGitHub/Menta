import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ImageIcon, ShieldCheckIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  PROOF_RECOVERY_PAPER_STATES,
  type ProofRecoveryAction,
  type ProofRecoveryState,
} from '@/lib/paper-state-registry/proof-recovery';

type Props = {
  states?: readonly ProofRecoveryState[];
  onAction?: (action: ProofRecoveryAction, state: ProofRecoveryState) => void;
};

/** Dev-only preview surface; intentionally not registered as a product route. */
export const ProofRecoveryFamilyGallery = ({
  states = PROOF_RECOVERY_PAPER_STATES,
  onAction,
}: Props) => (
  <View style={styles.gallery} testID="proof-recovery-family-gallery">
    {states.map(state => (
      <ProofRecoveryStatePreview
        key={state.id}
        state={state}
        onAction={onAction}
      />
    ))}
  </View>
);

export const ProofRecoveryStatePreview = ({
  state,
  onAction,
}: {
  state: ProofRecoveryState;
  onAction?: Props['onAction'];
}) => {
  const accent =
    state.authority === 'server-receipt'
      ? mentaColors.success
      : state.id === 'REV-02B'
        ? mentaColors.warning
        : mentaColors.action;

  const invoke = (action: ProofRecoveryAction) => {
    if (!action.disabled) onAction?.(action, state);
  };

  return (
    <View
      accessibilityLabel={`${state.overline}. ${state.title}. ${state.detail}`}
      style={styles.state}
      testID={`proof-recovery-paper-${state.id}`}
    >
      <Text style={[styles.overline, { color: accent }]}>{state.overline}</Text>
      <Text style={styles.title}>{state.title}</Text>
      <Text style={styles.detail}>{state.detail}</Text>

      {state.mediaRole ? (
        <View
          style={styles.media}
          testID={`${state.id}-media-${state.mediaRole}`}
        >
          <ImageIcon size={28} color={mentaColors.text.secondary} />
          <Text style={styles.mediaLabel}>
            {state.mediaRole === 'walking-proof-full'
              ? 'Walking proof · full view'
              : 'Walking proof · detail crop'}
          </Text>
        </View>
      ) : null}

      {state.facts.length ? (
        <View style={styles.facts}>
          {state.facts.map(fact => (
            <View key={`${fact.label}:${fact.value}`} style={styles.fact}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {state.decisionGate ? (
        <View style={styles.gate}>
          <ShieldCheckIcon size={16} color={mentaColors.text.secondary} />
          <Text style={styles.gateText}>Gate: {state.decisionGate}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          disabled={state.primaryAction.disabled}
          fullWidth
          onPress={() => invoke(state.primaryAction)}
          title={state.primaryAction.label}
        />
        {state.secondaryAction ? (
          <AppButton
            disabled={state.secondaryAction.disabled}
            fullWidth
            onPress={() => invoke(state.secondaryAction!)}
            title={state.secondaryAction.label}
            variant="outline"
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gallery: {
    alignSelf: 'center',
    gap: mentaSpacing[8],
    maxWidth: mentaLayout.focusedLane,
    width: '100%',
  },
  state: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    paddingBottom: mentaSpacing[6],
  },
  overline: {
    ...mentaTypography.labelBold,
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  media: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    height: 220,
    justifyContent: 'center',
  },
  mediaLabel: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[2],
  },
  facts: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fact: {
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
  gate: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  gateText: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  actions: {
    gap: mentaSpacing[2],
  },
});
