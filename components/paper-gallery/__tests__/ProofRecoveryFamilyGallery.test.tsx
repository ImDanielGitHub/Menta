import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ProofRecoveryFamilyGallery } from '@/components/paper-gallery/ProofRecoveryFamilyGallery';
import {
  getProofRecoveryPaperState,
  PROOF_RECOVERY_PAPER_STATES,
} from '@/lib/paper-state-registry/proof-recovery';

describe('ProofRecoveryFamilyGallery', () => {
  it('renders every assigned Paper state deterministically', () => {
    const { getByTestId } = render(<ProofRecoveryFamilyGallery />);

    PROOF_RECOVERY_PAPER_STATES.forEach(state => {
      expect(getByTestId(`proof-recovery-paper-${state.id}`)).toBeTruthy();
    });
  });

  it('does not invoke an input-gated action', () => {
    const onAction = jest.fn();
    const state = getProofRecoveryPaperState('PROOF-01TB');
    const { getByText } = render(
      <ProofRecoveryFamilyGallery states={[state]} onAction={onAction} />
    );

    fireEvent.press(getByText('Add a detail to continue'));
    expect(onAction).not.toHaveBeenCalled();
  });

  it('returns the exact action and state for a proof detail', () => {
    const onAction = jest.fn();
    const state = getProofRecoveryPaperState('PROOF-11D');
    const { getByText } = render(
      <ProofRecoveryFamilyGallery states={[state]} onAction={onAction} />
    );

    fireEvent.press(getByText('Open full view'));
    expect(onAction).toHaveBeenCalledWith(state.primaryAction, state);
  });
});
