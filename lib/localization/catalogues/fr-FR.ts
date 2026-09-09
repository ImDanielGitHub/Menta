import type { CompleteCatalogue } from '@/lib/localization/en-NZ';
import { accountabilityFr } from '@/lib/localization/catalogues/shared/accountability-fr';
import { foundationFrFR } from '@/lib/localization/catalogues/fr-FR/foundation';
import { languageFrFR } from '@/lib/localization/catalogues/fr-FR/language';
import { notificationsFrFR } from '@/lib/localization/catalogues/fr-FR/notifications';
import { onboardingFrFR } from '@/lib/localization/catalogues/fr-FR/onboarding';
import { todayFrFR } from '@/lib/localization/catalogues/fr-FR/today';
import { todayStatesFrFR } from '@/lib/localization/catalogues/fr-FR/today-states';
import { proofRecoveryFrFR } from '@/lib/localization/catalogues/fr-FR/proof-recovery';
import { groupsHomeFrFR } from '@/lib/localization/catalogues/fr-FR/groups-home';
import { navigationFrFR } from '@/lib/localization/catalogues/fr-FR/navigation';
import { authLoginFrFR } from '@/lib/localization/catalogues/fr-FR/auth-login';
import { eventsIndexFrFR } from '@/lib/localization/catalogues/fr-FR/events-index';
import { welcomeBonusFrFR } from '@/lib/localization/catalogues/fr-FR/welcome-bonus';
import { fullAuthAccountFrFR } from '@/lib/localization/catalogues/fr-FR/full-auth-account';
import { fullSharedUiFrFR } from '@/lib/localization/catalogues/fr-FR/full-shared-ui';
import { fullTodayProofFrFR } from '@/lib/localization/catalogues/fr-FR/full-today-proof';
import { fullGroupsFrFR } from '@/lib/localization/catalogues/fr-FR/full-groups';
import { fullEventsFrFR } from '@/lib/localization/catalogues/fr-FR/full-events';
import { fullCommerceFrFR } from '@/lib/localization/catalogues/fr-FR/full-commerce';
import { fullDomainFeedbackFrFR } from '@/lib/localization/catalogues/fr-FR/full-domain-feedback';
import { sourceGateFrFR } from '@/lib/localization/catalogues/fr-FR/source-gate';

export const frFR = {
  ...foundationFrFR,
  ...languageFrFR,
  ...notificationsFrFR,
  ...onboardingFrFR,
  ...todayFrFR,
  ...todayStatesFrFR,
  ...proofRecoveryFrFR,
  ...groupsHomeFrFR,
  ...navigationFrFR,
  ...authLoginFrFR,
  ...eventsIndexFrFR,
  ...welcomeBonusFrFR,
  ...fullAuthAccountFrFR,
  ...fullSharedUiFrFR,
  ...fullTodayProofFrFR,
  ...fullGroupsFrFR,
  ...fullEventsFrFR,
  ...fullCommerceFrFR,
  ...fullDomainFeedbackFrFR,
  ...accountabilityFr,
  ...sourceGateFrFR,
} as const satisfies CompleteCatalogue;
