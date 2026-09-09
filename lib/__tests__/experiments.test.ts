import {
  MENTA_EXPERIMENT_REGISTRY,
  ONBOARDING_SEQUENCE_EXPERIMENT,
  PAYWALL_PLACEMENT_EXPERIMENT,
  PAYWALL_PRESENTATION_EXPERIMENT,
  TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT,
  resolveExperimentAssignment,
  type ExperimentDefinition,
} from '@/lib/experiments';

describe('Menta experiment registry', () => {
  it('keeps planned experiments disabled until their product paths are ready', () => {
    expect(MENTA_EXPERIMENT_REGISTRY).toEqual({
      onboardingSequence: ONBOARDING_SEQUENCE_EXPERIMENT,
      paywallPlacement: PAYWALL_PLACEMENT_EXPERIMENT,
      paywallPresentation: PAYWALL_PRESENTATION_EXPERIMENT,
      todayProofLoggingLayout: TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT,
    });
    expect(
      Object.values(MENTA_EXPERIMENT_REGISTRY).map(item => item.status)
    ).toEqual(['draft', 'draft', 'draft', 'draft']);
  });

  it('documents the exact Today variants from issue 285', () => {
    expect(TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT.key).toBe(
      'today_proof_logging_layout'
    );
    expect(TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT.control).toBe('timer_hero');
    expect(TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT.variants).toEqual([
      'timer_hero',
      'classic_feed',
    ]);
  });

  it('keeps paywall timing separate from paywall presentation', () => {
    expect(PAYWALL_PLACEMENT_EXPERIMENT.key).toBe('paywall_placement');
    expect(PAYWALL_PLACEMENT_EXPERIMENT.variants).toEqual([
      'later',
      'onboarding',
    ]);
    expect(PAYWALL_PRESENTATION_EXPERIMENT.key).toBe('paywall_presentation');
    expect(PAYWALL_PRESENTATION_EXPERIMENT.variants).toEqual([
      'current_plans',
      'value_first',
    ]);
  });

  it('keeps shorter onboarding separate from named invite and event entry', () => {
    expect(ONBOARDING_SEQUENCE_EXPERIMENT.key).toBe('onboarding_sequence');
    expect(ONBOARDING_SEQUENCE_EXPERIMENT.control).toBe('current_progressive');
    expect(ONBOARDING_SEQUENCE_EXPERIMENT.variants).toEqual([
      'current_progressive',
      'action_first_short',
    ]);
    expect(ONBOARDING_SEQUENCE_EXPERIMENT.eligibility).toContain(
      'named group invitation'
    );
    expect(ONBOARDING_SEQUENCE_EXPERIMENT.eligibility).toContain('event QR');
  });

  it('keeps every experiment presentation-only with a named decision contract', () => {
    for (const definition of Object.values(MENTA_EXPERIMENT_REGISTRY)) {
      expect(definition.authority).toBe('presentation_only');
      expect(definition.owner).toBeTruthy();
      expect(definition.reviewAfter).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(definition.hypothesis).toBeTruthy();
      expect(definition.eligibility).toBeTruthy();
      expect(definition.primaryMetric).toBeTruthy();
      expect(definition.guardrails.length).toBeGreaterThan(0);
    }
  });
});

describe('experiment assignment', () => {
  const readyExperiment: ExperimentDefinition<
    'test_layout',
    'control' | 'treatment'
  > = {
    key: 'test_layout',
    status: 'ready',
    surface: 'today',
    variants: ['control', 'treatment'],
    control: 'control',
    owner: 'Menta product',
    reviewAfter: '2026-10-01',
    hypothesis: 'Treatment improves the primary outcome.',
    eligibility: 'Authenticated eligible people only.',
    primaryMetric: 'confirmed outcome',
    guardrails: ['error rate'],
    authority: 'presentation_only',
  };

  it('does not evaluate a draft registry entry into a live treatment', () => {
    expect(
      resolveExperimentAssignment(
        TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT,
        'classic_feed',
        true
      )
    ).toMatchObject({
      variant: 'timer_hero',
      source: 'draft_control',
      isRemoteAssignment: false,
    });
  });

  it('requires a stable authenticated identity before accepting assignment', () => {
    expect(
      resolveExperimentAssignment(readyExperiment, 'treatment', false)
    ).toMatchObject({
      variant: 'control',
      source: 'anonymous_control',
      isRemoteAssignment: false,
    });
  });

  it('fails missing and malformed values to the explicit control', () => {
    expect(
      resolveExperimentAssignment(readyExperiment, undefined, true)
    ).toMatchObject({
      variant: 'control',
      source: 'missing_or_invalid_control',
    });
    expect(
      resolveExperimentAssignment(readyExperiment, 'surprise', true)
    ).toMatchObject({
      variant: 'control',
      source: 'missing_or_invalid_control',
    });
  });

  it('accepts only a declared variant for a ready experiment', () => {
    expect(
      resolveExperimentAssignment(readyExperiment, 'treatment', true)
    ).toEqual({
      key: 'test_layout',
      surface: 'today',
      variant: 'treatment',
      source: 'remote',
      isRemoteAssignment: true,
    });
  });
});
