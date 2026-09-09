import { act, renderHook } from '@testing-library/react-native';
import { useCreateChallengeForm } from '@/hooks/useCreateChallengeForm';

describe('useCreateChallengeForm', () => {
  it('initializes solo mode as self-review enabled', () => {
    const { result } = renderHook(() =>
      useCreateChallengeForm({ initialGroupId: null, initialMode: 'solo' })
    );

    expect(result.current.formData.allowSelfReview).toBe(true);
    expect(result.current.formData.selectedGroupId).toBeNull();
  });

  it('validates step progression requirements', () => {
    const { result } = renderHook(() =>
      useCreateChallengeForm({ initialGroupId: null, initialMode: 'group' })
    );

    expect(result.current.canProceed(0)).toBe(false);

    act(() => {
      result.current.updateField('allowSelfReview', true);
    });

    expect(result.current.canProceed(0)).toBe(true);
    expect(result.current.canProceed(1)).toBe(false);

    act(() => {
      result.current.updateField('title', 'Morning Run');
      result.current.updateField(
        'description',
        'Run 3km every morning before breakfast.'
      );
    });

    expect(result.current.canProceed(1)).toBe(true);

    act(() => {
      result.current.updateField('duration', '400');
    });

    expect(result.current.canProceed(1)).toBe(false);

    act(() => {
      result.current.updateField('duration', '30');
      result.current.updateField('verificationType', 'photo');
      result.current.updateField('verificationDescription', '');
    });

    expect(result.current.canProceed(2)).toBe(false);

    act(() => {
      result.current.updateField(
        'verificationDescription',
        'Upload workout photo'
      );
    });

    expect(result.current.canProceed(2)).toBe(true);
  });

  it('applies category-based verification defaults', () => {
    const { result } = renderHook(() =>
      useCreateChallengeForm({ initialGroupId: null, initialMode: 'group' })
    );

    act(() => {
      result.current.updateField('category', 'learning');
      result.current.updateField('verificationType', 'text');
      result.current.updateVerificationDefaults();
    });

    expect(result.current.formData.verificationDescription).toContain(
      'Write what you studied'
    );

    act(() => {
      result.current.updateField('verificationType', 'none');
      result.current.updateVerificationDefaults();
    });

    expect(result.current.formData.verificationDescription).toContain(
      'No upload is required'
    );
    expect(result.current.formData.verificationDescription).not.toMatch(
      /honou?r system/i
    );
  });
});
