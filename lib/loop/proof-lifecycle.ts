import type {
  ProofLifecycleInput,
  ProofLifecycleSelection,
  ProofLifecycleState,
} from '@/lib/loop/types';
import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

/**
 * Deterministic proof lifecycle resolution.
 *
 * Authoritative server proof always supersedes a stale local overlay for the
 * same obligation/day. When the server has no proof, local state retains its
 * upload/draft truth and media-preservation requirements.
 *
 * Local overlays never become `sent`, `pending-review`, or `accepted`.
 */
export const selectProofLifecycleState = (
  input: ProofLifecycleInput
): ProofLifecycleSelection => {
  const { challengeId, localDay, serverProofStatus, localOverlay } = input;
  const clientEventId = localOverlay?.clientEventId ?? null;

  const finish = (
    state: ProofLifecycleState,
    reason: string,
    flags: { isServerConfirmed: boolean; isLocalOnly: boolean }
  ): ProofLifecycleSelection => ({
    state,
    challengeId,
    localDay,
    clientEventId,
    isServerConfirmed: flags.isServerConfirmed,
    isLocalOnly: flags.isLocalOnly,
    reason,
  });

  if (serverProofStatus === 'rejected') {
    return finish('correction-requested', 'server-rejected', {
      isServerConfirmed: true,
      isLocalOnly: false,
    });
  }

  if (serverProofStatus === 'pending') {
    return finish('pending-review', 'server-pending', {
      isServerConfirmed: true,
      isLocalOnly: false,
    });
  }

  if (serverProofStatus === 'approved') {
    return finish('accepted', 'server-approved', {
      isServerConfirmed: true,
      isLocalOnly: false,
    });
  }

  if (localOverlay && localOverlay.localDay === localDay) {
    if (localOverlay.status === 'uploading') {
      return finish('uploading', 'local-overlay-uploading', {
        isServerConfirmed: false,
        isLocalOnly: true,
      });
    }

    if (localOverlay.status === 'unknown-result') {
      return finish('unknown-result', 'local-overlay-unknown-result', {
        isServerConfirmed: false,
        isLocalOnly: true,
      });
    }

    if (localOverlay.status === 'terminal-failure') {
      return finish('terminal-failure', 'local-overlay-terminal-failure', {
        isServerConfirmed: false,
        isLocalOnly: true,
      });
    }

    if (localOverlay.status === 'saved-local') {
      return finish('saved-local', 'local-overlay-saved', {
        isServerConfirmed: false,
        isLocalOnly: true,
      });
    }
  }

  if (input.submitAcknowledged) {
    return finish('sent', 'submit-acknowledged-without-status', {
      isServerConfirmed: true,
      isLocalOnly: false,
    });
  }

  return finish('idle', 'no-local-or-server-proof', {
    isServerConfirmed: false,
    isLocalOnly: false,
  });
};

/**
 * Whether local media must be preserved (do not delete / overwrite).
 * Unknown results and in-flight uploads keep media until reconcile.
 */
export const mustPreserveLocalProofMedia = (
  state: ProofLifecycleState
): boolean =>
  state === 'saved-local' ||
  state === 'uploading' ||
  state === 'unknown-result' ||
  state === 'terminal-failure';

/**
 * Safe user-facing fact label for proof lifecycle (copy contract).
 * Feelings stay out of this helper — UI may add warmth separately.
 */
type Localise = (key: TranslationKey) => string;

export const proofLifecycleFactLabel = (
  state: ProofLifecycleState,
  localise?: Localise
): string => {
  switch (state) {
    case 'idle':
      return (
        localise?.('todayProof.source.lifecycle.due') ??
        translate('en-NZ', 'todayProof.source.lifecycle.due')
      );
    case 'saved-local':
      return (
        localise?.('todayProof.source.lifecycle.saved') ??
        translate('en-NZ', 'todayProof.source.lifecycle.saved')
      );
    case 'uploading':
      return (
        localise?.('todayProof.source.lifecycle.uploading') ??
        translate('en-NZ', 'todayProof.source.lifecycle.uploading')
      );
    case 'sent':
      return (
        localise?.('todayProof.source.lifecycle.sent') ??
        translate('en-NZ', 'todayProof.source.lifecycle.sent')
      );
    case 'pending-review':
      return (
        localise?.('todayProof.source.lifecycle.pending') ??
        translate('en-NZ', 'todayProof.source.lifecycle.pending')
      );
    case 'accepted':
      return (
        localise?.('todayProof.source.lifecycle.accepted') ??
        translate('en-NZ', 'todayProof.source.lifecycle.accepted')
      );
    case 'correction-requested':
      return (
        localise?.('todayProof.source.lifecycle.correction') ??
        translate('en-NZ', 'todayProof.source.lifecycle.correction')
      );
    case 'unknown-result':
      return (
        localise?.('todayProof.source.lifecycle.unknown') ??
        translate('en-NZ', 'todayProof.source.lifecycle.unknown')
      );
    case 'terminal-failure':
      return (
        localise?.('todayProof.source.lifecycle.failed') ??
        translate('en-NZ', 'todayProof.source.lifecycle.failed')
      );
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
};
