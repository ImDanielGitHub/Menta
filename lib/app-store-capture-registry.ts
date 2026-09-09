/**
 * Internal-only source contract for the six App Store capture candidates.
 *
 * These are deterministic, production-shaped display fixtures. They are not
 * registered as Expo Router routes and must never imply a current server
 * receipt, wallet balance, attendance, or review decision.
 */

export const APP_STORE_CAPTURE_DEVICE = {
  width: 390,
  height: 844,
  contentLane: 342,
} as const;

export type AppStoreCaptureCandidateId =
  | 'ASC-01'
  | 'ASC-02'
  | 'ASC-03'
  | 'ASC-04'
  | 'ASC-05'
  | 'ASC-06';

export type AppStoreCaptureCandidate = {
  id: AppStoreCaptureCandidateId;
  paperId: string;
  artboardName: string;
  productionJourney: string;
  productionRoute: string;
  productionComponents: readonly string[];
  fixtureBoundary: string;
  accessibilityLabel: string;
};

export const APP_STORE_CAPTURE_CANDIDATES = [
  {
    id: 'ASC-01',
    paperId: 'FV0-0',
    artboardName: 'ASC-01 — Today Proof Due',
    productionJourney: 'Today to proof capture',
    productionRoute: '/(tabs) -> /verification',
    productionComponents: ['TodayProofSection', 'MentaMascot', 'AppButton'],
    fixtureBoundary:
      'A due proof is displayed only as a deterministic local fixture; no proof has been submitted or confirmed.',
    accessibilityLabel: 'App Store candidate Today proof due',
  },
  {
    id: 'ASC-02',
    paperId: 'FWX-0',
    artboardName: 'ASC-02 — Promise Review',
    productionJourney: 'Create a promise with its proof and review rule',
    productionRoute: '/create-challenge',
    productionComponents: ['AppCard', 'AppListRow', 'AppButton'],
    fixtureBoundary:
      'The promise terms are local creation inputs. No promise has been created.',
    accessibilityLabel: 'App Store candidate promise review',
  },
  {
    id: 'ASC-03',
    paperId: 'FYF-0',
    artboardName: 'ASC-03 — Group Accountability',
    productionJourney: 'Group board to proof capture',
    productionRoute: '/groups/[id] -> /verification',
    productionComponents: ['GroupAccountabilityBoard', 'AppButton'],
    fixtureBoundary:
      'Member statuses are deterministic display inputs, not a fetched group snapshot.',
    accessibilityLabel: 'App Store candidate group accountability',
  },
  {
    id: 'ASC-04',
    paperId: 'G02-0',
    artboardName: 'ASC-04 — Human Review',
    productionJourney: 'Review queue decision context',
    productionRoute: '/review-queue',
    productionComponents: ['AppCard', 'AppListRow', 'AppButton'],
    fixtureBoundary:
      'The evidence context is explanatory only. No review decision or receipt is represented.',
    accessibilityLabel: 'App Store candidate human review',
  },
  {
    id: 'ASC-05',
    paperId: 'G1T-0',
    artboardName: 'ASC-05 — Momenta Ledger',
    productionJourney: 'Wallet activity to shop',
    productionRoute: '/momenta -> /(tabs)/shop',
    productionComponents: ['TransactionHistory', 'AppButton'],
    fixtureBoundary:
      'Ledger rows are display-shaped sample data, never a claimed wallet balance or purchase receipt.',
    accessibilityLabel: 'App Store candidate Momenta ledger',
  },
  {
    id: 'ASC-06',
    paperId: 'G4A-0',
    artboardName: 'ASC-06 — Event Participation',
    productionJourney: 'Event details to attendance and participant proof',
    productionRoute: '/events/[eventId] -> /events/[eventId]/check-in',
    productionComponents: ['AppCard', 'AppButton'],
    fixtureBoundary:
      'The event is a display fixture. It does not state that the viewer checked in or joined.',
    accessibilityLabel: 'App Store candidate event participation',
  },
] as const satisfies readonly AppStoreCaptureCandidate[];

export const getAppStoreCaptureCandidate = (id: AppStoreCaptureCandidateId) => {
  const candidate = APP_STORE_CAPTURE_CANDIDATES.find(item => item.id === id);

  if (!candidate) {
    throw new Error(`Unknown App Store capture candidate: ${id}`);
  }

  return candidate;
};
