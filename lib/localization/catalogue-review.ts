export type CatalogueReviewStatus =
  | 'canonical-source'
  | 'draft'
  | 'language-reviewed'
  | 'layout-checked';

export type CatalogueReview = {
  status: CatalogueReviewStatus;
  surfaces: readonly string[];
  reviewer: string | null;
  reviewedAt: string | null;
  writingRulesCommit: string;
};

const writingRulesCommit = 'b0305948aa95b7807345a49833e81f26bec8ec48';

export const CATALOGUE_REVIEWS = {
  'de-DE': {
    status: 'draft',
    surfaces: [
      'notifications',
      'onboarding-welcome',
      'today-dashboard-shell',
      'today-state-presenter',
      'proof-recovery-cards',
      'groups-home',
      'primary-navigation',
      'auth-login',
      'events-index',
      'welcome-bonus',
      'settings-language-picker',
    ],
    reviewer: null,
    reviewedAt: null,
    writingRulesCommit,
  },
  'en-NZ': {
    status: 'canonical-source',
    surfaces: [
      'foundation',
      'notifications',
      'onboarding-welcome',
      'today-dashboard-shell',
      'today-state-presenter',
      'proof-recovery-cards',
      'groups-home',
      'primary-navigation',
      'auth-login',
      'events-index',
      'welcome-bonus',
      'settings-language-picker',
      'shared-ui',
    ],
    reviewer: null,
    reviewedAt: null,
    writingRulesCommit,
  },
  'es-ES': {
    status: 'draft',
    surfaces: [
      'notifications',
      'onboarding-welcome',
      'today-dashboard-shell',
      'today-state-presenter',
      'proof-recovery-cards',
      'groups-home',
      'primary-navigation',
      'auth-login',
      'events-index',
      'welcome-bonus',
      'settings-language-picker',
    ],
    reviewer: null,
    reviewedAt: null,
    writingRulesCommit,
  },
  'es-MX': {
    status: 'draft',
    surfaces: [
      'notifications',
      'onboarding-welcome',
      'today-dashboard-shell',
      'today-state-presenter',
      'proof-recovery-cards',
      'groups-home',
      'primary-navigation',
      'auth-login',
      'events-index',
      'welcome-bonus',
      'settings-language-picker',
    ],
    reviewer: null,
    reviewedAt: null,
    writingRulesCommit,
  },
  'fr-CA': {
    status: 'draft',
    surfaces: [
      'notifications',
      'onboarding-welcome',
      'today-dashboard-shell',
      'today-state-presenter',
      'proof-recovery-cards',
      'groups-home',
      'primary-navigation',
      'auth-login',
      'events-index',
      'welcome-bonus',
      'settings-language-picker',
    ],
    reviewer: null,
    reviewedAt: null,
    writingRulesCommit,
  },
  'fr-FR': {
    status: 'draft',
    surfaces: [
      'notifications',
      'onboarding-welcome',
      'today-dashboard-shell',
      'today-state-presenter',
      'proof-recovery-cards',
      'groups-home',
      'primary-navigation',
      'auth-login',
      'events-index',
      'welcome-bonus',
      'settings-language-picker',
    ],
    reviewer: null,
    reviewedAt: null,
    writingRulesCommit,
  },
  'pt-BR': {
    status: 'draft',
    surfaces: [
      'notifications',
      'onboarding-welcome',
      'today-dashboard-shell',
      'today-state-presenter',
      'proof-recovery-cards',
      'groups-home',
      'primary-navigation',
      'auth-login',
      'events-index',
      'welcome-bonus',
      'settings-language-picker',
    ],
    reviewer: null,
    reviewedAt: null,
    writingRulesCommit,
  },
  'pt-PT': {
    status: 'draft',
    surfaces: [
      'notifications',
      'onboarding-welcome',
      'today-dashboard-shell',
      'today-state-presenter',
      'proof-recovery-cards',
      'groups-home',
      'primary-navigation',
      'auth-login',
      'events-index',
      'welcome-bonus',
      'settings-language-picker',
    ],
    reviewer: null,
    reviewedAt: null,
    writingRulesCommit,
  },
} as const satisfies Record<string, CatalogueReview>;
