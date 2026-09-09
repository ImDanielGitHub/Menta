import React from 'react';
import { View } from 'react-native';

import { AppStoreCandidateCapture } from '@/components/app-store-capture/AppStoreCandidateCapture';
import { BootstrapEmailRecoveryFamilyGallery } from '@/components/paper-gallery/BootstrapEmailRecoveryFamilyGallery';
import { CommerceFamilyStatePreview } from '@/components/paper-gallery/CommerceFamilyGallery';
import { EventsFamilyStatePreview } from '@/components/paper-gallery/EventsFamilyGallery';
import { GroupsAdminArchiveStatePreview } from '@/components/paper-gallery/GroupsAdminArchiveFamilyGallery';
import { NotificationsPrivacyFamilyGallery } from '@/components/paper-gallery/NotificationsPrivacyFamilyGallery';
import { OnboardingAuthFamilyGallery } from '@/components/paper-gallery/OnboardingAuthFamilyGallery';
import { ProofRecoveryStatePreview } from '@/components/paper-gallery/ProofRecoveryFamilyGallery';
import { TodayFamilyStatePreview } from '@/components/paper-gallery/TodayFamilyGallery';
import { SettingsAccountFamilyGallery } from '@/components/paper-gallery/SettingsAccountFamilyGallery';
import { PromiseFamilyGalleryState } from '@/components/paper-gallery/PromiseFamilyGallery';
import { SupportSystemFamilyGallery } from '@/components/paper-gallery/SupportSystemFamilyGallery';
import { SharedShellGallery } from '@/components/paper-gallery/SharedShellGallery';
import {
  TODAY_FAMILY_PAPER_STATES,
  GROUPS_ADMIN_ARCHIVE_PAPER_STATES,
  PROOF_RECOVERY_PAPER_STATES,
  eventProductPaperStateContracts,
  type PaperGallerySelection,
} from '@/lib/paper-state-registry';

type PaperStateGalleryProps = PaperGallerySelection;

/**
 * Deterministic development harness for production-quality Paper state
 * components. It is deliberately not registered with Expo Router and renders
 * nothing in production builds.
 */
export const PaperStateGallery = (selection: PaperStateGalleryProps) => {
  if (!__DEV__) {
    return null;
  }

  if (selection.family === 'onboarding-auth') {
    return (
      <View testID="paper-state-gallery-onboarding-auth">
        <OnboardingAuthFamilyGallery stateId={selection.stateId} />
      </View>
    );
  }

  if (selection.family === 'today') {
    const state = TODAY_FAMILY_PAPER_STATES.find(
      candidate => candidate.id === selection.stateId
    );

    if (!state) {
      return null;
    }

    return (
      <View testID="paper-state-gallery-today">
        <TodayFamilyStatePreview state={state} />
      </View>
    );
  }

  if (selection.family === 'promise') {
    return (
      <View testID="paper-state-gallery-promise">
        <PromiseFamilyGalleryState stateId={selection.stateId} />
      </View>
    );
  }

  if (selection.family === 'events') {
    const state = eventProductPaperStateContracts.find(
      candidate => candidate.paperId === selection.stateId
    );

    if (!state) {
      return null;
    }

    return (
      <View testID="paper-state-gallery-events">
        <EventsFamilyStatePreview state={state} />
      </View>
    );
  }

  if (selection.family === 'support-system') {
    return (
      <View testID="paper-state-gallery-support-system">
        <SupportSystemFamilyGallery galleryMode stateId={selection.stateId} />
      </View>
    );
  }

  if (selection.family === 'bootstrap-email-recovery') {
    return (
      <View testID="paper-state-gallery-bootstrap-email-recovery">
        <BootstrapEmailRecoveryFamilyGallery stateId={selection.stateId} />
      </View>
    );
  }

  if (selection.family === 'commerce') {
    return (
      <View testID="paper-state-gallery-commerce">
        <CommerceFamilyStatePreview stateId={selection.stateId} />
      </View>
    );
  }

  if (selection.family === 'groups-admin-archive') {
    const state = GROUPS_ADMIN_ARCHIVE_PAPER_STATES.find(
      candidate => candidate.paperId === selection.stateId
    );

    if (!state) {
      return null;
    }

    return (
      <View testID="paper-state-gallery-groups-admin-archive">
        <GroupsAdminArchiveStatePreview state={state} />
      </View>
    );
  }

  if (selection.family === 'notifications-privacy') {
    return (
      <View testID="paper-state-gallery-notifications-privacy">
        <NotificationsPrivacyFamilyGallery stateId={selection.stateId} />
      </View>
    );
  }

  if (selection.family === 'proof-recovery') {
    const state = PROOF_RECOVERY_PAPER_STATES.find(
      candidate => candidate.id === selection.stateId
    );

    if (!state) {
      return null;
    }

    return (
      <View testID="paper-state-gallery-proof-recovery">
        <ProofRecoveryStatePreview state={state} />
      </View>
    );
  }

  if (selection.family === 'app-store-candidates') {
    return (
      <View testID="paper-state-gallery-app-store-candidates">
        <AppStoreCandidateCapture candidateId={selection.stateId} />
      </View>
    );
  }

  if (selection.family === 'shared-shell') {
    return (
      <View testID="paper-state-gallery-shared-shell">
        <SharedShellGallery />
      </View>
    );
  }

  return (
    <View testID="paper-state-gallery-settings-account">
      <SettingsAccountFamilyGallery galleryMode stateId={selection.stateId} />
    </View>
  );
};
