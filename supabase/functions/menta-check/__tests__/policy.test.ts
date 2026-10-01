import { decide, flagsFor, hintFor, type MentaAnswers } from '../policy';

const answers = (overrides: Partial<MentaAnswers> = {}): MentaAnswers => ({
  pMatch: 0.97,
  reason: 'matches',
  reasonConfidence: 0.9,
  tip: 'none',
  ...overrides,
});

const check = (
  overrides: Partial<Parameters<typeof decide>[0]> = {}
): ReturnType<typeof decide> =>
  decide({
    kind: 'check',
    proofKind: 'photo',
    answers: answers(),
    flags: [],
    secondLookDone: false,
    minutesPending: 0,
    ...overrides,
  });

describe('Menta Check policy', () => {
  it('counts a clear match without a tip', () => {
    expect(check()).toEqual({
      action: 'approve',
      outcome: 'counted',
      tip: null,
      hint: 'matches',
    });
  });

  it('adds one tip when Menta was sure but not very sure', () => {
    expect(
      check({ answers: answers({ pMatch: 0.86, tip: 'show_display' }) })
    ).toMatchObject({
      action: 'approve',
      outcome: 'counted_tip',
      tip: 'show_display',
    });
  });

  it('takes a second look before turning any photo down', () => {
    expect(check({ answers: answers({ pMatch: 0.4 }) })).toEqual({
      action: 'second_look',
    });
  });

  it('turns a photo down after a second look agrees, preferring a retake to a false pass', () => {
    expect(
      check({
        answers: answers({ pMatch: 0.62, reason: 'matches' }),
        secondLookDone: true,
      })
    ).toMatchObject({
      action: 'reject',
      outcome: 'not_yet',
      reason: 'cant_see_rule',
    });
  });

  it('keeps Jev’s reason when it chose one', () => {
    expect(
      check({
        answers: answers({ pMatch: 0.1, reason: 'shows_something_else' }),
        secondLookDone: true,
      })
    ).toMatchObject({ reason: 'shows_something_else' });
  });

  it('does not count a match Jev was unsure how to classify', () => {
    expect(
      check({
        answers: answers({ reasonConfidence: 0.4 }),
        secondLookDone: true,
      })
    ).toMatchObject({ action: 'reject' });
  });

  it('never counts a reused photo, and does not spend a second look on it', () => {
    expect(check({ flags: ['duplicate'] })).toMatchObject({
      action: 'reject',
      reason: 'duplicate',
    });
  });

  it('turns down a screenshot when the rule wants a real photo', () => {
    expect(
      check({ flags: ['screenshot'], secondLookDone: true })
    ).toMatchObject({
      action: 'reject',
      reason: 'screenshot',
    });
  });

  it('counts a specific note and asks for detail on a vague one', () => {
    expect(
      check({ proofKind: 'text', answers: answers({ specific: 0.9 }) })
    ).toMatchObject({ action: 'approve', outcome: 'counted', tip: null });
    expect(
      check({ proofKind: 'text', answers: answers({ specific: 0.2 }) })
    ).toMatchObject({
      action: 'approve',
      outcome: 'counted_tip',
      tip: 'add_detail',
    });
  });

  it('turns a text proof down without a second look', () => {
    expect(
      check({
        proofKind: 'text',
        answers: answers({ pMatch: 0.2, reason: 'too_unclear' }),
      })
    ).toMatchObject({ action: 'reject', reason: 'too_unclear' });
  });

  it('requires inspected video evidence instead of automatically counting it', () => {
    expect(() => check({ proofKind: 'video', answers: null })).toThrow(
      'MENTA_CHECK_ANSWERS_REQUIRED'
    );
  });

  it('only records a hint while people decide', () => {
    expect(check({ kind: 'hint' })).toEqual({
      action: 'record',
      outcome: 'hint_only',
      hint: 'matches',
    });
  });

  describe('group backup', () => {
    const backup = (overrides: Partial<Parameters<typeof decide>[0]> = {}) =>
      check({ kind: 'backup', minutesPending: 24 * 60, ...overrides });

    it('steps in only when confident', () => {
      expect(backup()).toMatchObject({
        action: 'approve',
        outcome: 'backup_counted',
      });
      expect(backup({ answers: answers({ pMatch: 0.8 }) })).toMatchObject({
        action: 'record',
        outcome: 'left_for_people',
      });
    });

    it('never turns proof down for a group', () => {
      expect(
        backup({ answers: answers({ pMatch: 0.05, reason: 'too_unclear' }) })
      ).toMatchObject({ action: 'record', outcome: 'left_for_people' });
    });

    it('counts a plausible proof after three days with nobody checking', () => {
      expect(
        backup({ answers: answers({ pMatch: 0.6 }), minutesPending: 72 * 60 })
      ).toMatchObject({ action: 'approve', outcome: 'backup_counted' });
      expect(
        backup({
          answers: answers({ pMatch: 0.6 }),
          minutesPending: 72 * 60,
          flags: ['duplicate'],
        })
      ).toMatchObject({ action: 'record' });
    });
  });

  it('keeps reviewer hints coarse', () => {
    expect(hintFor(answers({ pMatch: 0.9 }), [])).toBe('matches');
    expect(hintFor(answers({ pMatch: 0.2 }), [])).toBe('unsure');
    expect(hintFor(answers({ pMatch: 0.6 }), [])).toBeNull();
    expect(hintFor(null, [])).toBeNull();
  });

  it('flags screens only when the rule is not about a screen', () => {
    const screenshot = { image_kind: 'screenshot' as const };
    expect(
      flagsFor({ description: screenshot, screenOk: 0.9, isDuplicate: false })
    ).toEqual([]);
    expect(
      flagsFor({ description: screenshot, screenOk: 0.1, isDuplicate: false })
    ).toEqual(['screenshot']);
    expect(
      flagsFor({
        description: { image_kind: 'stock_or_web_image' },
        screenOk: null,
        isDuplicate: true,
      })
    ).toEqual(['duplicate', 'blank_or_stock']);
  });
});
