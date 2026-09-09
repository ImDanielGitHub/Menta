import {
  TODAY_FAMILY_PAPER_STATES,
  type TodayFamilyPaperId,
} from '@/lib/paper-state-registry/today';
import {
  settingsAccountPaperStates,
  type SettingsAccountPaperStateId,
} from '@/lib/paper-state-registry/settings-account';
import {
  PROMISE_FAMILY_PAPER_STATES,
  type PromiseFamilyStateId,
} from '@/components/paper-gallery/PromiseFamilyGallery';
import {
  eventProductPaperStateContracts,
  type EventProductPaperStateId,
} from '@/lib/paper-state-registry/events';
import {
  SUPPORT_SYSTEM_PAPER_STATES,
  type SupportSystemPaperStateId,
} from '@/lib/paper-state-registry/support-system';
import {
  BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES,
  type BootstrapEmailRecoveryPaperStateId,
} from '@/lib/paper-state-registry/bootstrap-email-recovery';
import {
  COMMERCE_FAMILY_PAPER_STATES,
  type CommercePaperStateId,
} from '@/lib/paper-state-registry/commerce';
import {
  GROUPS_ADMIN_ARCHIVE_PAPER_STATES,
  type GroupsAdminArchivePaperStateId,
} from '@/lib/paper-state-registry/groups-admin-archive';
import {
  NOTIFICATIONS_PRIVACY_PAPER_STATES,
  type NotificationsPrivacyPaperStateId,
} from '@/lib/paper-state-registry/notifications-privacy';
import {
  PROOF_RECOVERY_PAPER_STATES,
  type ProofRecoveryPaperId,
} from '@/lib/paper-state-registry/proof-recovery';
import {
  ONBOARDING_AUTH_PAPER_STATES,
  type OnboardingAuthPaperStateId,
} from '@/lib/paper-state-registry/onboarding-auth';
import { JOIN_FUNDING_RUNTIME_STATES } from '@/lib/paper-state-registry/join-funding';
import {
  APP_STORE_CAPTURE_CANDIDATES,
  type AppStoreCaptureCandidateId,
} from '@/lib/app-store-capture-registry';
import {
  SHARED_SHELL_PAPER_STATES,
  type SharedShellPaperStateId,
} from '@/lib/paper-state-registry/shared-shell';

export type PaperGallerySelection =
  | { family: 'onboarding-auth'; stateId: OnboardingAuthPaperStateId }
  | { family: 'today'; stateId: TodayFamilyPaperId }
  | { family: 'settings-account'; stateId: SettingsAccountPaperStateId }
  | { family: 'promise'; stateId: PromiseFamilyStateId }
  | { family: 'events'; stateId: EventProductPaperStateId }
  | { family: 'support-system'; stateId: SupportSystemPaperStateId }
  | {
      family: 'bootstrap-email-recovery';
      stateId: BootstrapEmailRecoveryPaperStateId;
    }
  | { family: 'commerce'; stateId: CommercePaperStateId }
  | {
      family: 'groups-admin-archive';
      stateId: GroupsAdminArchivePaperStateId;
    }
  | {
      family: 'notifications-privacy';
      stateId: NotificationsPrivacyPaperStateId;
    }
  | { family: 'proof-recovery'; stateId: ProofRecoveryPaperId }
  | {
      family: 'app-store-candidates';
      stateId: AppStoreCaptureCandidateId;
    }
  | { family: 'shared-shell'; stateId: SharedShellPaperStateId };

export const PAPER_GALLERY_FAMILIES = [
  {
    id: 'onboarding-auth',
    label: 'Onboarding and authentication',
    // AUTH-02B has one global gallery owner in bootstrap/email recovery. The
    // onboarding renderer still supports it, but the registry never duplicates
    // a live Paper state ID across families.
    stateIds: ONBOARDING_AUTH_PAPER_STATES.filter(
      state => state.id !== 'AUTH-02B'
    ).map(state => state.id),
  },
  {
    id: 'today',
    label: 'Today and streaks',
    stateIds: TODAY_FAMILY_PAPER_STATES.map(state => state.id),
  },
  {
    id: 'settings-account',
    label: 'Settings and account safety',
    stateIds: settingsAccountPaperStates.map(state => state.id),
  },
  {
    id: 'promise',
    label: 'Promise creation and detail',
    stateIds: PROMISE_FAMILY_PAPER_STATES.map(state => state.id),
  },
  {
    id: 'events',
    label: 'Events participation',
    stateIds: eventProductPaperStateContracts.map(state => state.paperId),
  },
  {
    id: 'support-system',
    label: 'Support, errors and system',
    stateIds: SUPPORT_SYSTEM_PAPER_STATES.map(state => state.id),
  },
  {
    id: 'bootstrap-email-recovery',
    label: 'Bootstrap, email and recovery',
    stateIds: BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES.map(state => state.id),
  },
  {
    id: 'commerce',
    label: 'Pro, wallet, shop and inventory',
    // INV-01..05 were legacy inventory registry aliases. The current Paper
    // invitation artboards own those exact IDs in Settings/account, while the
    // commerce renderer remains available for its actual routes.
    stateIds: COMMERCE_FAMILY_PAPER_STATES.filter(
      state =>
        !['INV-01', 'INV-02', 'INV-03', 'INV-04', 'INV-05'].includes(state.id)
    ).map(state => state.id),
  },
  {
    id: 'groups-admin-archive',
    label: 'Group members, settings and archive',
    stateIds: GROUPS_ADMIN_ARCHIVE_PAPER_STATES.map(state => state.paperId),
  },
  {
    id: 'notifications-privacy',
    label: 'Notifications and privacy',
    stateIds: NOTIFICATIONS_PRIVACY_PAPER_STATES.filter(
      state => state.id !== 'INV-06'
    ).map(state => state.id),
  },
  {
    id: 'proof-recovery',
    label: 'Proof detail, review and recovery',
    stateIds: PROOF_RECOVERY_PAPER_STATES.map(state => state.id),
  },
  {
    id: 'app-store-candidates',
    label: 'App Store capture candidates',
    stateIds: APP_STORE_CAPTURE_CANDIDATES.map(state => state.id),
  },
  {
    id: 'shared-shell',
    label: 'Shared navigation shell',
    stateIds: SHARED_SHELL_PAPER_STATES.map(state => state.id),
  },
] as const;

export const PAPER_GALLERY_STATE_COUNT = PAPER_GALLERY_FAMILIES.reduce(
  (total, family) => total + family.stateIds.length,
  0
);

export {
  BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES,
  COMMERCE_FAMILY_PAPER_STATES,
  GROUPS_ADMIN_ARCHIVE_PAPER_STATES,
  NOTIFICATIONS_PRIVACY_PAPER_STATES,
  ONBOARDING_AUTH_PAPER_STATES,
  PROMISE_FAMILY_PAPER_STATES,
  PROOF_RECOVERY_PAPER_STATES,
  SUPPORT_SYSTEM_PAPER_STATES,
  TODAY_FAMILY_PAPER_STATES,
  JOIN_FUNDING_RUNTIME_STATES,
  APP_STORE_CAPTURE_CANDIDATES,
  SHARED_SHELL_PAPER_STATES,
  eventProductPaperStateContracts,
  settingsAccountPaperStates,
};
