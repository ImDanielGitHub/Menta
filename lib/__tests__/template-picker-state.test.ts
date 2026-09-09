import { commitmentTemplates } from '@/lib/commitments/templates';
import { getTemplatePickerState } from '@/lib/commitments/template-picker-state';

describe('getTemplatePickerState', () => {
  it('keeps every supplied starter template available to the expanded picker', () => {
    const state = getTemplatePickerState(commitmentTemplates);

    expect(state).toEqual({
      kind: 'ready',
      templates: commitmentTemplates,
    });
    expect(state.templates).toHaveLength(commitmentTemplates.length);
  });

  it('makes an absent catalogue an honest manual-creation state', () => {
    expect(getTemplatePickerState([])).toEqual({
      kind: 'unavailable',
      templates: [],
    });
  });

  it('keeps starter proof rules concrete and free of trust shorthand', () => {
    const visibleTemplateCopy = commitmentTemplates
      .flatMap(template => [
        template.description,
        template.verificationDescription,
        template.submissionText,
      ])
      .join(' ');

    expect(visibleTemplateCopy).not.toMatch(/honou?r system/i);
    expect(visibleTemplateCopy).not.toMatch(/challenge activity/i);
    expect(
      commitmentTemplates.every(
        template =>
          template.verificationDescription.trim().length > 0 &&
          template.submissionText.trim().length > 0
      )
    ).toBe(true);
  });
});
