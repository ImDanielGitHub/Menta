import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CommerceReceiptRows } from '@/components/commerce/CommerceReceiptRows';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  COMMERCE_FAMILY_PAPER_STATES,
  getCommercePaperState,
  type CommercePaperAction,
  type CommercePaperPriceSlot,
  type CommercePaperState,
  type CommercePaperStateId,
  type CommercePaperTone,
} from '@/lib/paper-state-registry/commerce';

export type CommerceGalleryPrices = Partial<
  Record<CommercePaperPriceSlot, string>
>;

type CommerceFamilyGalleryProps = {
  states?: readonly CommercePaperState[];
  prices?: CommerceGalleryPrices;
  onAction?: (action: CommercePaperAction, state: CommercePaperState) => void;
};

type CommerceFamilyStatePreviewProps = {
  stateId: CommercePaperStateId;
  prices?: CommerceGalleryPrices;
  onAction?: (action: CommercePaperAction, state: CommercePaperState) => void;
};

const toneColours: Record<CommercePaperTone, string> = {
  neutral: mentaColors.text.secondary,
  action: mentaColors.action,
  success: mentaColors.success,
  warning: mentaColors.warning,
  danger: mentaColors.danger,
};

const noticeTone = (tone: CommercePaperTone) => {
  if (tone === 'success') return 'success' as const;
  if (tone === 'warning') return 'warning' as const;
  if (tone === 'danger') return 'error' as const;
  return 'info' as const;
};

const actionVariant = (action: CommercePaperAction) => {
  if (action.emphasis === 'quiet') return 'ghost' as const;
  if (action.emphasis === 'secondary') return 'secondary' as const;
  return 'primary' as const;
};

const priceForFact = (
  label: string,
  state: CommercePaperState,
  prices: CommerceGalleryPrices
) => {
  if (!state.priceSlots?.length) return null;

  const normalized = label.toLowerCase();
  const slot = normalized.includes('monthly')
    ? 'monthly'
    : normalized.includes('annual')
      ? 'annual'
      : normalized.includes('reserve')
        ? 'reserve'
        : null;

  if (!slot || !state.priceSlots.includes(slot)) return null;
  return prices[slot] ?? 'Live price unavailable';
};

const requiresMissingPrice = (
  state: CommercePaperState,
  prices: CommerceGalleryPrices
) => {
  if (state.id === 'PAY-03B') return !prices.monthly;
  if (state.id === 'TOP-01') return !prices.reserve;
  return false;
};

const CommerceLoadingStructure = ({ state }: { state: CommercePaperState }) => (
  <View
    accessibilityLabel={`${state.title} ${state.detail}`}
    accessibilityRole="progressbar"
    style={styles.loadingStructure}
    testID={`commerce-paper-${state.id}-skeleton`}
  >
    <SkeletonLoader
      announce={false}
      borderRadius={mentaRadii.small}
      height={16}
      width="34%"
    />
    <SkeletonLoader
      announce={false}
      borderRadius={mentaRadii.small}
      height={30}
      width="82%"
    />
    <SkeletonLoader
      announce={false}
      borderRadius={mentaRadii.small}
      height={18}
      width="94%"
    />
    {[0, 1].map(index => (
      <View key={index} style={styles.loadingRow}>
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.small}
          height={44}
          width={44}
        />
        <View style={styles.loadingCopy}>
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.small}
            height={14}
            width="42%"
          />
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.small}
            height={18}
            width="76%"
          />
        </View>
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.small}
          height={18}
          width={64}
        />
      </View>
    ))}
  </View>
);

const CommerceFactRows = ({
  state,
  prices,
}: {
  state: CommercePaperState;
  prices: CommerceGalleryPrices;
}) => {
  if (state.facts.length === 0) return null;

  const facts = state.facts.map(fact => {
    const livePrice = priceForFact(fact.label, state, prices);
    const selected =
      state.id === 'PAY-03B' && fact.label.toLowerCase() === 'monthly';

    return {
      label: fact.label,
      detail: livePrice
        ? `Supplied by the current store offering${selected ? ' · selected' : ''}`
        : undefined,
      value: livePrice ?? fact.value,
    };
  });

  return (
    <CommerceReceiptRows
      facts={facts}
      testID={`commerce-paper-${state.id}-facts`}
    />
  );
};

const CommerceActions = ({
  state,
  prices,
  onAction,
}: {
  state: CommercePaperState;
  prices: CommerceGalleryPrices;
  onAction?: (action: CommercePaperAction, state: CommercePaperState) => void;
}) => {
  const invoke = (action: CommercePaperAction) => onAction?.(action, state);
  const priceMissing = requiresMissingPrice(state, prices);

  return (
    <View style={styles.actions}>
      <AppButton
        disabled={Boolean(state.primaryAction.disabled || priceMissing)}
        fullWidth
        haptic={false}
        onPress={() => invoke(state.primaryAction)}
        size="large"
        testID={`commerce-paper-${state.id}-primary`}
        title={
          priceMissing ? 'Waiting for live price' : state.primaryAction.label
        }
        variant={actionVariant(state.primaryAction)}
      />
      {state.secondaryAction ? (
        <AppButton
          disabled={Boolean(state.secondaryAction.disabled)}
          fullWidth
          haptic={false}
          onPress={() => invoke(state.secondaryAction as CommercePaperAction)}
          size="large"
          testID={`commerce-paper-${state.id}-secondary`}
          title={state.secondaryAction.label}
          variant={actionVariant(state.secondaryAction)}
        />
      ) : null}
    </View>
  );
};

export const CommerceFamilyStatePreview = ({
  stateId,
  prices = {},
  onAction,
}: CommerceFamilyStatePreviewProps) => {
  const state = getCommercePaperState(stateId);
  const showMascot =
    state.tone === 'success' &&
    ['PAY-06', 'PAY-09B', 'SHP-08', 'ADV-03'].includes(state.id);

  return (
    <View
      accessibilityLabel={`${state.eyebrow}. ${state.title}. ${state.detail}`}
      style={styles.state}
      testID={`commerce-paper-${state.id}`}
    >
      <View style={styles.fixtureHeader}>
        <Text style={styles.fixtureLabel}>DETERMINISTIC GALLERY FIXTURE</Text>
        <Text style={styles.stateId}>{state.id}</Text>
      </View>
      <Text style={[styles.eyebrow, { color: toneColours[state.tone] }]}>
        {state.eyebrow}
      </Text>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{state.title}</Text>
          <Text style={styles.detail}>{state.detail}</Text>
        </View>
        {showMascot ? (
          <MentaMascot
            size="md"
            state="celebration"
            testID={`commerce-paper-${state.id}-mascot`}
          />
        ) : null}
      </View>

      {state.kind === 'loading' ? (
        <CommerceLoadingStructure state={state} />
      ) : (
        <CommerceFactRows prices={prices} state={state} />
      )}

      <AppInlineNotice
        description={state.proofBoundary}
        testID={`commerce-paper-${state.id}-boundary`}
        title="Proof boundary"
        tone={noticeTone(state.tone)}
      />

      <CommerceActions onAction={onAction} prices={prices} state={state} />
    </View>
  );
};

/**
 * Dev-only Commerce state inventory. It is deliberately not registered with
 * Expo Router and does not perform store, wallet, entitlement or purchase
 * mutations. Actions are delegated to the caller as deterministic receipts.
 */
export const CommerceFamilyGallery = ({
  states = COMMERCE_FAMILY_PAPER_STATES,
  prices = {},
  onAction,
}: CommerceFamilyGalleryProps) => {
  if (!__DEV__) return null;

  return (
    <View style={styles.gallery} testID="commerce-family-gallery">
      {states.map(state => (
        <CommerceFamilyStatePreview
          key={state.id}
          onAction={onAction}
          prices={prices}
          stateId={state.id as CommercePaperStateId}
        />
      ))}
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
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[8],
    width: '100%',
  },
  fixtureHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fixtureLabel: {
    ...mentaTypography.label,
    color: mentaColors.text.muted,
  },
  stateId: {
    ...mentaTypography.label,
    color: mentaColors.text.secondary,
  },
  eyebrow: {
    ...mentaTypography.labelBold,
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
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[2],
  },
  loadingStructure: {
    gap: mentaSpacing[3],
  },
  loadingRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 68,
  },
  loadingCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
  actions: {
    gap: mentaSpacing[2],
  },
});
