import type { CompleteCatalogue } from '@/lib/localization/en-NZ';
import { spanishAccountabilityDelta } from '@/lib/localization/catalogues/shared/spanish-accountability-delta';
import { foundationEsMX } from '@/lib/localization/catalogues/es-MX/foundation';
import { languageEsMX } from '@/lib/localization/catalogues/es-MX/language';
import { notificationsEsMX } from '@/lib/localization/catalogues/es-MX/notifications';
import { onboardingEsMX } from '@/lib/localization/catalogues/es-MX/onboarding';
import { todayEsMX } from '@/lib/localization/catalogues/es-MX/today';
import { todayStatesEsMX } from '@/lib/localization/catalogues/es-MX/today-states';
import { proofRecoveryEsMX } from '@/lib/localization/catalogues/es-MX/proof-recovery';
import { groupsHomeEsMX } from '@/lib/localization/catalogues/es-MX/groups-home';
import { navigationEsMX } from '@/lib/localization/catalogues/es-MX/navigation';
import { authLoginEsMX } from '@/lib/localization/catalogues/es-MX/auth-login';
import { eventsIndexEsMX } from '@/lib/localization/catalogues/es-MX/events-index';
import { welcomeBonusEsMX } from '@/lib/localization/catalogues/es-MX/welcome-bonus';
import { fullAuthAccountEsMX } from '@/lib/localization/catalogues/es-MX/full-auth-account';
import { fullSharedUiEsMX } from '@/lib/localization/catalogues/es-MX/full-shared-ui';
import { fullTodayProofEsMX } from '@/lib/localization/catalogues/es-MX/full-today-proof';
import { fullCommerceEsMX } from '@/lib/localization/catalogues/es-MX/full-commerce';
import { fullGroupsEsMX } from '@/lib/localization/catalogues/es-MX/full-groups';
import { fullEventsEsMX } from '@/lib/localization/catalogues/es-MX/full-events';
import { fullDomainFeedbackEsMX } from '@/lib/localization/catalogues/es-MX/full-domain-feedback';
import { sourceGateEsMX } from '@/lib/localization/catalogues/es-MX/source-gate';

export const esMX = {
  ...foundationEsMX,
  ...languageEsMX,
  ...notificationsEsMX,
  ...onboardingEsMX,
  ...todayEsMX,
  ...todayStatesEsMX,
  ...proofRecoveryEsMX,
  ...groupsHomeEsMX,
  ...navigationEsMX,
  ...authLoginEsMX,
  ...eventsIndexEsMX,
  ...welcomeBonusEsMX,
  ...fullAuthAccountEsMX,
  ...fullSharedUiEsMX,
  ...fullTodayProofEsMX,
  ...fullCommerceEsMX,
  ...fullGroupsEsMX,
  ...fullEventsEsMX,
  ...fullDomainFeedbackEsMX,
  ...sourceGateEsMX,
  ...spanishAccountabilityDelta,
} as const satisfies CompleteCatalogue;
