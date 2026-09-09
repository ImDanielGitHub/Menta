import { languageEnNZ } from '@/lib/localization/catalogues/en-NZ/language';
import { notificationsEnNZ } from '@/lib/localization/catalogues/en-NZ/notifications';
import { onboardingEnNZ } from '@/lib/localization/catalogues/en-NZ/onboarding';
import { todayEnNZ } from '@/lib/localization/catalogues/en-NZ/today';
import { todayStatesEnNZ } from '@/lib/localization/catalogues/en-NZ/today-states';
import { proofRecoveryEnNZ } from '@/lib/localization/catalogues/en-NZ/proof-recovery';
import { groupsHomeEnNZ } from '@/lib/localization/catalogues/en-NZ/groups-home';
import { navigationEnNZ } from '@/lib/localization/catalogues/en-NZ/navigation';
import { authLoginEnNZ } from '@/lib/localization/catalogues/en-NZ/auth-login';
import { eventsIndexEnNZ } from '@/lib/localization/catalogues/en-NZ/events-index';
import { fullEventsEnNZ } from '@/lib/localization/catalogues/en-NZ/full-events';
import { welcomeBonusEnNZ } from '@/lib/localization/catalogues/en-NZ/welcome-bonus';
import { fullAuthAccountEnNZ } from '@/lib/localization/catalogues/en-NZ/full-auth-account';
import { fullSharedUiEnNZ } from '@/lib/localization/catalogues/en-NZ/full-shared-ui';
import { fullTodayProofEnNZ } from '@/lib/localization/catalogues/en-NZ/full-today-proof';
import { fullCommerceEnNZ } from '@/lib/localization/catalogues/en-NZ/full-commerce';
import { fullGroupsEnNZ } from '@/lib/localization/catalogues/en-NZ/full-groups';
import { fullDomainFeedbackEnNZ } from '@/lib/localization/catalogues/en-NZ/full-domain-feedback';
import { sourceGateEnNZ } from '@/lib/localization/catalogues/en-NZ/source-gate';

export const enNZ = {
  'commerce.proJourney.back': 'Back',
  'commerce.proJourney.title': 'Menta Pro',
  'commerce.proJourney.subtitle':
    'Menta Pro gives you more space for the promises you want to keep.',
  'commerce.proJourney.capacity': 'More active promises and groups',
  'commerce.proJourney.capacityDetail':
    'Go beyond the free plan’s active limits.',
  'commerce.proJourney.momenta': 'Momenta with your subscription',
  'commerce.proJourney.momentaDetail':
    'Use your plan’s Momenta for more promises, groups and items.',
  'commerce.proJourney.ads': 'No required ad breaks',
  'commerce.proJourney.adsDetail': 'Keep your attention on your promises.',
  'commerce.proJourney.choose': 'Choose your Pro plan.',
  'commerce.proJourney.sameFeatures':
    'Weekly or annual. Every Pro feature is included in either plan.',
  'commerce.proJourney.loading': 'Loading plans from the store',
  'commerce.proJourney.unavailable': 'Plans aren’t available right now',
  'commerce.proJourney.retryDetail':
    'Check your connection and try again. You can keep using Menta for free.',
  'commerce.proJourney.retry': 'Try again',
  'commerce.proJourney.annual': 'Annual Pro',
  'commerce.proJourney.weekly': 'Weekly Pro',
  'commerce.proJourney.intro': 'Start with one week',
  'commerce.proJourney.perYear': 'per year',
  'commerce.proJourney.perWeek': 'per week',
  'commerce.proJourney.firstWeek': 'for your first week',
  'commerce.proJourney.annualTerms':
    '{price} billed each year. Renews automatically.',
  'commerce.proJourney.weeklyTerms':
    '{price} billed each week. Renews automatically.',
  'commerce.proJourney.introTerms':
    '{intro} for the first week, then {price} each week. Renews automatically.',
  'commerce.proJourney.annualCredits':
    '{amount} Momenta when your annual payment is confirmed. Creates, joins and items still use Momenta.',
  'commerce.proJourney.weeklyCredits':
    '{amount} Momenta when each weekly payment is confirmed, including the introductory week. Creates, joins and items still use Momenta.',
  'commerce.proJourney.introTitle': 'Your first week of Pro.',
  'commerce.proJourney.confirmTitle': 'Your Pro plan.',
  'commerce.proJourney.allIncluded':
    'All Pro features are included. Review the price and renewal before subscribing.',
  'commerce.proJourney.today': 'You pay today',
  'commerce.proJourney.yearAccess': 'One year of Pro access',
  'commerce.proJourney.weekAccess': 'One week of Pro access',
  'commerce.proJourney.renewal': 'What happens next',
  'commerce.proJourney.cancel':
    'Cancel in your store subscription settings before the next renewal. Your access continues until the paid period ends.',
  'commerce.proJourney.seePlans': 'See Pro plans',
  'commerce.proJourney.seeOffer': 'Review my offer',
  'commerce.proJourney.subscribe': 'Subscribe to Pro',
  'commerce.proJourney.stayFree': 'Keep using Menta for free',
  'commerce.proJourney.restore': 'Restore purchases',
  'brand.name': 'Menta',
  'brand.currency': 'Momenta',
  'brand.tagline': 'Keep the promises you make to yourself.',
  'term.promise': 'promise',
  'term.proof': 'proof',
  'term.note': 'a note',
  'term.photo': 'a photo',
  'term.video': 'a video',
  'term.review': 'review',
  'term.group': 'group',
  'term.streak': 'streak',
  'term.today': 'Today',
  'screenshot.01': 'Keep the promises you make to yourself.',
  'screenshot.02': 'Choose what counts as proof.',
  'screenshot.03': 'Check in when you’re done.',
  'screenshot.04': 'Get someone to hold you accountable.',
  'screenshot.05': 'Host your events on Menta.',
  'screenshot.06': 'Use Momenta to protect your streak.',
  'accessibility.back': 'Back',
  'accessibility.close': 'Close',
  'count.promise': '{count} promises',
  'count.promise.one': '{count} promise',
  'count.promise.other': '{count} promises',
  ...onboardingEnNZ,
  ...languageEnNZ,
  ...notificationsEnNZ,
  ...todayEnNZ,
  ...todayStatesEnNZ,
  ...proofRecoveryEnNZ,
  ...groupsHomeEnNZ,
  ...navigationEnNZ,
  ...authLoginEnNZ,
  ...eventsIndexEnNZ,
  ...fullEventsEnNZ,
  ...welcomeBonusEnNZ,
  ...fullAuthAccountEnNZ,
  ...fullSharedUiEnNZ,
  ...fullTodayProofEnNZ,
  ...fullCommerceEnNZ,
  ...fullGroupsEnNZ,
  ...fullDomainFeedbackEnNZ,
  ...sourceGateEnNZ,
} as const;

export type TranslationKey = keyof typeof enNZ;
export type OptionalDynamicSourceKey = Extract<
  TranslationKey,
  | `fullAuth.source.${string}`
  | `groups.source.${string}`
  | `todayProof.source.${string}`
>;

/**
 * Complete sentence variants are optional for regional catalogues while
 * their locale owners catch up. German is checked against CompleteCatalogue
 * below, so the active German catalogue must still provide every key.
 */
export type OptionalRegionalVariantKey =
  | OptionalDynamicSourceKey
  | Extract<TranslationKey, `fullAuth.residual.${string}`>
  | Extract<
      TranslationKey,
      | 'commerce.commerce.loadingTitle'
      | 'commerce.commerce.loadingDetail'
      | 'commerce.wallet.rewardCheckingTitle'
      | 'commerce.wallet.rewardCheckingDetail'
      | 'commerce.wallet.rewardMissingTitle'
      | 'commerce.wallet.rewardMissingDetail'
      | 'commerce.wallet.refreshBalanceAction'
      | 'commerce.wallet.rewardDailyLimitTitle'
      | 'commerce.wallet.rewardDailyLimitDetail'
      | 'commerce.wallet.rewardCheckingAccessibility'
      | 'commerce.wallet.refreshingBalance'
      | 'commerce.wallet.rewardClaimInProgress'
      | 'events.detail.join_unknown_with_message'
      | 'events.check_in.unknown_with_message'
      | 'todayProof.promise.submission_time_unavailable'
      | 'groups.detail.not_archived_title'
      | 'commerce.paywall.quotaGroup.one'
      | 'commerce.paywall.quotaGroup.other'
      | 'commerce.paywall.savedSubject.group'
      | 'commerce.paywall.savedSubject.promise'
      | 'commerce.paywall.savedSubject.draft'
      | 'commerce.paywall.oneAdEnough.group'
      | 'commerce.paywall.oneAdEnough.promise'
      | 'commerce.paywall.oneAdEnough.draft'
      | 'groups.detail.privacy_group.discoverable'
      | 'groups.detail.privacy_group.invite_link_only'
      | 'groups.detail.privacy_group.invite_only'
      | 'todayProof.residual.delivery_not_confirmed'
      | 'todayProof.residual.promise_status_unavailable'
      | 'todayProof.residual.proof_still_saved_on_this_phone'
      | 'todayProof.residual.nothing_saved_on_this_phone_was_changed'
      | 'todayProof.residual.proof_receive_not_confirmed'
      | 'todayProof.residual.latest_promise_details_not_confirmed'
    >;

/** The canonical English catalogue contains every known key. */
export type CompleteCatalogue = Record<TranslationKey, string>;

/**
 * Dynamic source entries remain optional only in regional catalogues while
 * their locale owners catch up. The keys stay in the type so a locale can add
 * them without casts or an excess-property escape hatch.
 */
export type EnglishCatalogue = Record<
  Exclude<TranslationKey, OptionalRegionalVariantKey>,
  string
> &
  Partial<Record<OptionalRegionalVariantKey, string>>;
export type RegionalCatalogue = Partial<EnglishCatalogue>;
