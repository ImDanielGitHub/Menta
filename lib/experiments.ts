export type ExperimentStatus = 'draft' | 'ready' | 'paused' | 'complete';

export type ExperimentSurface = 'onboarding' | 'paywall' | 'today';

export interface ExperimentDefinition<
  TKey extends string = string,
  TVariant extends string = string,
> {
  key: TKey;
  status: ExperimentStatus;
  surface: ExperimentSurface;
  variants: readonly TVariant[];
  control: TVariant;
  owner: string;
  reviewAfter: string;
  hypothesis: string;
  eligibility: string;
  primaryMetric: string;
  guardrails: readonly string[];
  authority: 'presentation_only';
}

export type ExperimentAssignmentSource =
  | 'remote'
  | 'draft_control'
  | 'paused_control'
  | 'anonymous_control'
  | 'missing_or_invalid_control';

export interface ExperimentAssignment<
  TKey extends string = string,
  TVariant extends string = string,
> {
  key: TKey;
  surface: ExperimentSurface;
  variant: TVariant;
  source: ExperimentAssignmentSource;
  isRemoteAssignment: boolean;
}

const defineExperiment = <TKey extends string, TVariant extends string>(
  definition: ExperimentDefinition<TKey, TVariant>
): ExperimentDefinition<TKey, TVariant> => definition;

export const ONBOARDING_SEQUENCE_EXPERIMENT = defineExperiment({
  key: 'onboarding_sequence',
  status: 'draft',
  surface: 'onboarding',
  variants: ['current_progressive', 'action_first_short'] as const,
  control: 'current_progressive',
  owner: 'Menta product',
  reviewAfter: '2026-10-01',
  hypothesis:
    'A shorter action-first sequence helps eligible new people reach a confirmed first promise without reducing understanding or first-proof follow-through.',
  eligibility:
    'New authenticated people who have not completed onboarding and are not entering through a named group invitation or event QR path.',
  primaryMetric: 'server-confirmed first Promise Created within 24 hours',
  guardrails: [
    'Onboarding Completed',
    'first qualifying Proof Submitted within three days',
    'legal and auth completion',
    'group-invite and event-entry preservation',
    'support or confusion reports',
  ],
  authority: 'presentation_only',
});

export const PAYWALL_PLACEMENT_EXPERIMENT = defineExperiment({
  key: 'paywall_placement',
  status: 'draft',
  surface: 'paywall',
  variants: ['later', 'onboarding'] as const,
  control: 'later',
  owner: 'Menta product',
  reviewAfter: '2026-10-01',
  hypothesis:
    'Showing the existing paywall after the first accountability value moment converts at least as well while protecting activation.',
  eligibility:
    'Authenticated new users whose first promise is confirmed and who do not already have Pro.',
  primaryMetric: 'Subscription Started after an eligible Paywall Viewed',
  guardrails: [
    'first qualifying Proof Submitted',
    'loop activation within 14 days',
    'purchase failure or delayed-entitlement rate',
    'restore success',
  ],
  authority: 'presentation_only',
});

export const PAYWALL_PRESENTATION_EXPERIMENT = defineExperiment({
  key: 'paywall_presentation',
  status: 'draft',
  surface: 'paywall',
  variants: ['current_plans', 'value_first'] as const,
  control: 'current_plans',
  owner: 'Menta product',
  reviewAfter: '2026-10-01',
  hypothesis:
    'A value-first explanation before the same authoritative plans improves purchase understanding without harming completion or restore confidence.',
  eligibility:
    'Authenticated non-Pro users opening the full plans paywall; insufficient-Momenta and quota recovery sheets are excluded.',
  primaryMetric: 'Subscription Started per eligible full-paywall exposure',
  guardrails: [
    'paywall close without plan selection',
    'purchase cancellation',
    'purchase failure or delayed-entitlement rate',
    'restore success',
    'first qualifying Proof Submitted',
  ],
  authority: 'presentation_only',
});

export const TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT = defineExperiment({
  key: 'today_proof_logging_layout',
  status: 'draft',
  surface: 'today',
  variants: ['timer_hero', 'classic_feed'] as const,
  control: 'timer_hero',
  owner: 'Menta product',
  reviewAfter: '2026-10-01',
  hypothesis:
    'The timer-led Today layout helps eligible people reach a confirmed proof outcome at least as reliably as the source-faithful classic feed.',
  eligibility:
    'Authenticated people with a proof due state that both layouts can represent without changing proof authority or navigation.',
  primaryMetric: 'server-confirmed Proof Submitted per eligible Today exposure',
  guardrails: [
    'time from exposure to confirmed proof',
    'proof selection abandonment',
    'proof retry or error rate',
    'next-day accountable return',
    'seven-day accountable return',
    'accessibility or layout failure',
  ],
  authority: 'presentation_only',
});

export const MENTA_EXPERIMENT_REGISTRY = {
  onboardingSequence: ONBOARDING_SEQUENCE_EXPERIMENT,
  paywallPlacement: PAYWALL_PLACEMENT_EXPERIMENT,
  paywallPresentation: PAYWALL_PRESENTATION_EXPERIMENT,
  todayProofLoggingLayout: TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT,
} as const;

export type MentaExperimentDefinition =
  (typeof MENTA_EXPERIMENT_REGISTRY)[keyof typeof MENTA_EXPERIMENT_REGISTRY];

export type MentaExperimentKey = MentaExperimentDefinition['key'];

export type MentaExperimentVariant =
  MentaExperimentDefinition['variants'][number];

const hasVariant = <TKey extends string, TVariant extends string>(
  definition: ExperimentDefinition<TKey, TVariant>,
  value: unknown
): value is TVariant =>
  typeof value === 'string' && definition.variants.includes(value as TVariant);

export const resolveExperimentAssignment = <
  TKey extends string,
  TVariant extends string,
>(
  definition: ExperimentDefinition<TKey, TVariant>,
  remoteValue: unknown,
  hasStableUserId: boolean
): ExperimentAssignment<TKey, TVariant> => {
  const control = (source: ExperimentAssignmentSource) => ({
    key: definition.key,
    surface: definition.surface,
    variant: definition.control,
    source,
    isRemoteAssignment: false,
  });

  if (definition.status === 'draft' || definition.status === 'complete') {
    return control('draft_control');
  }
  if (definition.status === 'paused') {
    return control('paused_control');
  }
  if (!hasStableUserId) {
    return control('anonymous_control');
  }
  if (!hasVariant(definition, remoteValue)) {
    return control('missing_or_invalid_control');
  }

  return {
    key: definition.key,
    surface: definition.surface,
    variant: remoteValue,
    source: 'remote',
    isRemoteAssignment: true,
  };
};
