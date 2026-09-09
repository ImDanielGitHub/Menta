import type { CommitmentTemplate } from '@/lib/commitments/templates';

export type TemplatePickerState =
  | {
      kind: 'ready';
      templates: readonly CommitmentTemplate[];
    }
  | {
      kind: 'unavailable';
      templates: readonly [];
    };

/**
 * Keeps the picker truthful when its template source is absent: it may offer
 * manual creation, but it must not imply that a catalogue refresh succeeded.
 */
export const getTemplatePickerState = (
  templates: readonly CommitmentTemplate[]
): TemplatePickerState => {
  if (templates.length === 0) {
    return { kind: 'unavailable', templates: [] };
  }

  return { kind: 'ready', templates };
};
