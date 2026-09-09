import type { CompleteCatalogue } from '@/lib/localization/en-NZ';
import { foundationDeDE } from '@/lib/localization/catalogues/de-DE/foundation';
import { languageDeDE } from '@/lib/localization/catalogues/de-DE/language';
import { notificationsDeDE } from '@/lib/localization/catalogues/de-DE/notifications';
import { onboardingDeDE } from '@/lib/localization/catalogues/de-DE/onboarding';
import { todayDeDE } from '@/lib/localization/catalogues/de-DE/today';
import { todayStatesDeDE } from '@/lib/localization/catalogues/de-DE/today-states';
import { proofRecoveryDeDE } from '@/lib/localization/catalogues/de-DE/proof-recovery';
import { groupsHomeDeDE } from '@/lib/localization/catalogues/de-DE/groups-home';
import { navigationDeDE } from '@/lib/localization/catalogues/de-DE/navigation';
import { authLoginDeDE } from '@/lib/localization/catalogues/de-DE/auth-login';
import { eventsIndexDeDE } from '@/lib/localization/catalogues/de-DE/events-index';
import { welcomeBonusDeDE } from '@/lib/localization/catalogues/de-DE/welcome-bonus';
import { fullAuthAccountDeDE } from '@/lib/localization/catalogues/de-DE/full-auth-account';
import { fullSharedUiDeDE } from '@/lib/localization/catalogues/de-DE/full-shared-ui';
import { fullTodayProofDeDE } from '@/lib/localization/catalogues/de-DE/full-today-proof';
import { fullGroupsDeDE } from '@/lib/localization/catalogues/de-DE/full-groups';
import { fullEventsDeDE } from '@/lib/localization/catalogues/de-DE/full-events';
import { fullCommerceDeDE } from '@/lib/localization/catalogues/de-DE/full-commerce';
import { fullDomainFeedbackDeDE } from '@/lib/localization/catalogues/de-DE/full-domain-feedback';
import { sourceGateDeDE } from '@/lib/localization/catalogues/de-DE/source-gate';

export const deDE = {
  ...foundationDeDE,
  ...languageDeDE,
  ...notificationsDeDE,
  ...onboardingDeDE,
  ...todayDeDE,
  ...todayStatesDeDE,
  ...proofRecoveryDeDE,
  ...groupsHomeDeDE,
  ...navigationDeDE,
  ...authLoginDeDE,
  ...eventsIndexDeDE,
  ...welcomeBonusDeDE,
  ...fullAuthAccountDeDE,
  ...fullSharedUiDeDE,
  ...fullTodayProofDeDE,
  ...fullGroupsDeDE,
  ...fullEventsDeDE,
  ...fullCommerceDeDE,
  ...fullDomainFeedbackDeDE,
  ...sourceGateDeDE,
} as const satisfies CompleteCatalogue;
