import type { CompleteCatalogue } from '@/lib/localization/en-NZ';
import { mentaCheckPt } from './shared/menta-check-pt';
import { widgetsptPT } from '@/lib/localization/catalogues/shared/widgets-ptPT';
import {
  accountabilityDeltaPt,
  accountabilityDeltaPtPT,
} from '@/lib/localization/catalogues/shared/accountability-delta-pt';
import { foundationPtPT } from '@/lib/localization/catalogues/pt-PT/foundation';
import { languagePtPT } from '@/lib/localization/catalogues/pt-PT/language';
import { notificationsPtPT } from '@/lib/localization/catalogues/pt-PT/notifications';
import { onboardingPtPT } from '@/lib/localization/catalogues/pt-PT/onboarding';
import { todayPtPT } from '@/lib/localization/catalogues/pt-PT/today';
import { todayStatesPtPT } from '@/lib/localization/catalogues/pt-PT/today-states';
import { proofRecoveryPtPT } from '@/lib/localization/catalogues/pt-PT/proof-recovery';
import { groupsHomePtPT } from '@/lib/localization/catalogues/pt-PT/groups-home';
import { navigationPtPT } from '@/lib/localization/catalogues/pt-PT/navigation';
import { authLoginPtPT } from '@/lib/localization/catalogues/pt-PT/auth-login';
import { eventsIndexPtPT } from '@/lib/localization/catalogues/pt-PT/events-index';
import { welcomeBonusPtPT } from '@/lib/localization/catalogues/pt-PT/welcome-bonus';
import { fullAuthAccountPtPT } from '@/lib/localization/catalogues/pt-PT/full-auth-account';
import { fullSharedUiPtPT } from '@/lib/localization/catalogues/pt-PT/full-shared-ui';
import { fullTodayProofPtPT } from '@/lib/localization/catalogues/pt-PT/full-today-proof';
import { fullGroupsPtPT } from '@/lib/localization/catalogues/pt-PT/full-groups';
import { fullEventsPtPT } from '@/lib/localization/catalogues/pt-PT/full-events';
import { fullCommercePtPT } from '@/lib/localization/catalogues/pt-PT/full-commerce';
import { fullDomainFeedbackPtPT } from '@/lib/localization/catalogues/pt-PT/full-domain-feedback';
import { completionPtPT } from '@/lib/localization/catalogues/pt-PT/completion';
import { sourceGatePtPT } from '@/lib/localization/catalogues/pt-PT/source-gate';
import { momentaTopUpPtPT } from '@/lib/localization/catalogues/pt-PT/momenta-top-up';
import { cameraAccessPtPT } from '@/lib/localization/catalogues/pt-PT/camera-access';
import { proofRolesPtPT } from '@/lib/localization/catalogues/pt-PT/proof-roles';

export const ptPT = {
  'settings.appearance.title': 'Aparência',
  'settings.appearance.system': 'Sistema',
  'settings.appearance.light': 'Claro',
  'settings.appearance.dark': 'Escuro',
  ...mentaCheckPt,
  ...momentaTopUpPtPT,
  ...cameraAccessPtPT,
  ...proofRolesPtPT,
  ...widgetsptPT,
  ...foundationPtPT,
  ...languagePtPT,
  ...notificationsPtPT,
  ...onboardingPtPT,
  ...todayPtPT,
  ...todayStatesPtPT,
  ...proofRecoveryPtPT,
  ...groupsHomePtPT,
  ...navigationPtPT,
  ...authLoginPtPT,
  ...eventsIndexPtPT,
  ...welcomeBonusPtPT,
  ...fullAuthAccountPtPT,
  ...fullSharedUiPtPT,
  ...fullTodayProofPtPT,
  ...fullGroupsPtPT,
  ...fullEventsPtPT,
  ...fullCommercePtPT,
  ...fullDomainFeedbackPtPT,
  ...completionPtPT,
  ...sourceGatePtPT,
  ...accountabilityDeltaPt,
  ...accountabilityDeltaPtPT,
} as const satisfies CompleteCatalogue;
