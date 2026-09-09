import type { CompleteCatalogue } from '@/lib/localization/en-NZ';
import { accountabilityFr } from '@/lib/localization/catalogues/shared/accountability-fr';
import { accountabilityFrCAOverrides } from '@/lib/localization/catalogues/fr-CA/accountability-overrides';
import { foundationFrCA } from '@/lib/localization/catalogues/fr-CA/foundation';
import { languageFrCA } from '@/lib/localization/catalogues/fr-CA/language';
import { notificationsFrCA } from '@/lib/localization/catalogues/fr-CA/notifications';
import { onboardingFrCA } from '@/lib/localization/catalogues/fr-CA/onboarding';
import { todayFrCA } from '@/lib/localization/catalogues/fr-CA/today';
import { todayStatesFrCA } from '@/lib/localization/catalogues/fr-CA/today-states';
import { proofRecoveryFrCA } from '@/lib/localization/catalogues/fr-CA/proof-recovery';
import { groupsHomeFrCA } from '@/lib/localization/catalogues/fr-CA/groups-home';
import { navigationFrCA } from '@/lib/localization/catalogues/fr-CA/navigation';
import { authLoginFrCA } from '@/lib/localization/catalogues/fr-CA/auth-login';
import { eventsIndexFrCA } from '@/lib/localization/catalogues/fr-CA/events-index';
import { welcomeBonusFrCA } from '@/lib/localization/catalogues/fr-CA/welcome-bonus';
import { fullAuthAccountFrCA } from '@/lib/localization/catalogues/fr-CA/full-auth-account';
import { fullSharedUiFrCA } from '@/lib/localization/catalogues/fr-CA/full-shared-ui';
import { fullTodayProofFrCA } from '@/lib/localization/catalogues/fr-CA/full-today-proof';
import { fullGroupsFrCA } from '@/lib/localization/catalogues/fr-CA/full-groups';
import { fullEventsFrCA } from '@/lib/localization/catalogues/fr-CA/full-events';
import { fullCommerceFrCA } from '@/lib/localization/catalogues/fr-CA/full-commerce';
import { fullDomainFeedbackFrCA } from '@/lib/localization/catalogues/fr-CA/full-domain-feedback';
import { sourceGateFrCA } from '@/lib/localization/catalogues/fr-CA/source-gate';

export const frCA = {
  ...foundationFrCA,
  ...languageFrCA,
  ...notificationsFrCA,
  ...onboardingFrCA,
  ...todayFrCA,
  ...todayStatesFrCA,
  ...proofRecoveryFrCA,
  ...groupsHomeFrCA,
  ...navigationFrCA,
  ...authLoginFrCA,
  ...eventsIndexFrCA,
  ...welcomeBonusFrCA,
  ...fullAuthAccountFrCA,
  ...fullSharedUiFrCA,
  ...fullTodayProofFrCA,
  ...fullGroupsFrCA,
  ...fullEventsFrCA,
  ...fullCommerceFrCA,
  ...fullDomainFeedbackFrCA,
  ...accountabilityFr,
  ...accountabilityFrCAOverrides,
  ...sourceGateFrCA,
} as const satisfies CompleteCatalogue;
