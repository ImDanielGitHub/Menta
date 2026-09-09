import type { CompleteCatalogue } from '@/lib/localization/en-NZ';
import {
  accountabilityDeltaPt,
  accountabilityDeltaPtBR,
} from '@/lib/localization/catalogues/shared/accountability-delta-pt';
import { foundationPtBR } from '@/lib/localization/catalogues/pt-BR/foundation';
import { languagePtBR } from '@/lib/localization/catalogues/pt-BR/language';
import { notificationsPtBR } from '@/lib/localization/catalogues/pt-BR/notifications';
import { onboardingPtBR } from '@/lib/localization/catalogues/pt-BR/onboarding';
import { todayPtBR } from '@/lib/localization/catalogues/pt-BR/today';
import { todayStatesPtBR } from '@/lib/localization/catalogues/pt-BR/today-states';
import { proofRecoveryPtBR } from '@/lib/localization/catalogues/pt-BR/proof-recovery';
import { groupsHomePtBR } from '@/lib/localization/catalogues/pt-BR/groups-home';
import { navigationPtBR } from '@/lib/localization/catalogues/pt-BR/navigation';
import { authLoginPtBR } from '@/lib/localization/catalogues/pt-BR/auth-login';
import { eventsIndexPtBR } from '@/lib/localization/catalogues/pt-BR/events-index';
import { welcomeBonusPtBR } from '@/lib/localization/catalogues/pt-BR/welcome-bonus';
import { fullAuthAccountPtBR } from '@/lib/localization/catalogues/pt-BR/full-auth-account';
import { fullSharedUiPtBR } from '@/lib/localization/catalogues/pt-BR/full-shared-ui';
import { fullTodayProofPtBR } from '@/lib/localization/catalogues/pt-BR/full-today-proof';
import { fullGroupsPtBR } from '@/lib/localization/catalogues/pt-BR/full-groups';
import { fullEventsPtBR } from '@/lib/localization/catalogues/pt-BR/full-events';
import { fullCommercePtBR } from '@/lib/localization/catalogues/pt-BR/full-commerce';
import { fullDomainFeedbackPtBR } from '@/lib/localization/catalogues/pt-BR/full-domain-feedback';
import { completionPtBR } from '@/lib/localization/catalogues/pt-BR/completion';
import { sourceGatePtBR } from '@/lib/localization/catalogues/pt-BR/source-gate';

export const ptBR = {
  ...foundationPtBR,
  ...languagePtBR,
  ...notificationsPtBR,
  ...onboardingPtBR,
  ...todayPtBR,
  ...todayStatesPtBR,
  ...proofRecoveryPtBR,
  ...groupsHomePtBR,
  ...navigationPtBR,
  ...authLoginPtBR,
  ...eventsIndexPtBR,
  ...welcomeBonusPtBR,
  ...fullAuthAccountPtBR,
  ...fullSharedUiPtBR,
  ...fullTodayProofPtBR,
  ...fullGroupsPtBR,
  ...fullEventsPtBR,
  ...fullCommercePtBR,
  ...fullDomainFeedbackPtBR,
  ...completionPtBR,
  ...sourceGatePtBR,
  ...accountabilityDeltaPt,
  ...accountabilityDeltaPtBR,
} as const satisfies CompleteCatalogue;
