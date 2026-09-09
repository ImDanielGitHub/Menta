import type { CompleteCatalogue } from '@/lib/localization/en-NZ';
import {
  spanishAccountabilityDelta,
  spanishAccountabilityEsESOverrides,
} from '@/lib/localization/catalogues/shared/spanish-accountability-delta';
import { foundationEsES } from '@/lib/localization/catalogues/es-ES/foundation';
import { languageEsES } from '@/lib/localization/catalogues/es-ES/language';
import { notificationsEsES } from '@/lib/localization/catalogues/es-ES/notifications';
import { onboardingEsES } from '@/lib/localization/catalogues/es-ES/onboarding';
import { todayEsES } from '@/lib/localization/catalogues/es-ES/today';
import { todayStatesEsES } from '@/lib/localization/catalogues/es-ES/today-states';
import { proofRecoveryEsES } from '@/lib/localization/catalogues/es-ES/proof-recovery';
import { groupsHomeEsES } from '@/lib/localization/catalogues/es-ES/groups-home';
import { navigationEsES } from '@/lib/localization/catalogues/es-ES/navigation';
import { authLoginEsES } from '@/lib/localization/catalogues/es-ES/auth-login';
import { eventsIndexEsES } from '@/lib/localization/catalogues/es-ES/events-index';
import { welcomeBonusEsES } from '@/lib/localization/catalogues/es-ES/welcome-bonus';
import { fullAuthAccountEsES } from '@/lib/localization/catalogues/es-ES/full-auth-account';
import { fullSharedUiEsES } from '@/lib/localization/catalogues/es-ES/full-shared-ui';
import { fullTodayProofEsES } from '@/lib/localization/catalogues/es-ES/full-today-proof';
import { fullCommerceEsES } from '@/lib/localization/catalogues/es-ES/full-commerce';
import { fullGroupsEsES } from '@/lib/localization/catalogues/es-ES/full-groups';
import { fullEventsEsES } from '@/lib/localization/catalogues/es-ES/full-events';
import { fullDomainFeedbackEsES } from '@/lib/localization/catalogues/es-ES/full-domain-feedback';
import { sourceGateEsES } from '@/lib/localization/catalogues/es-ES/source-gate';

export const esES = {
  ...foundationEsES,
  ...languageEsES,
  ...notificationsEsES,
  ...onboardingEsES,
  ...todayEsES,
  ...todayStatesEsES,
  ...proofRecoveryEsES,
  ...groupsHomeEsES,
  ...navigationEsES,
  ...authLoginEsES,
  ...eventsIndexEsES,
  ...welcomeBonusEsES,
  ...fullAuthAccountEsES,
  ...fullSharedUiEsES,
  ...fullTodayProofEsES,
  ...fullCommerceEsES,
  ...fullGroupsEsES,
  ...fullEventsEsES,
  ...fullDomainFeedbackEsES,
  ...sourceGateEsES,
  ...spanishAccountabilityDelta,
  ...spanishAccountabilityEsESOverrides,
} as const satisfies CompleteCatalogue;
