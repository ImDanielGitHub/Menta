export type TodaySecondaryContent = {
  hasLoadingLedger: boolean;
  hasPartialDataNotice: boolean;
  hasStaleSnapshotNotice: boolean;
  hasSupportingLedger: boolean;
};

export type TodayDashboardLayout = 'stacked' | 'adjacent';

export const hasTodaySecondaryContent = ({
  hasLoadingLedger,
  hasPartialDataNotice,
  hasStaleSnapshotNotice,
  hasSupportingLedger,
}: TodaySecondaryContent): boolean =>
  hasLoadingLedger ||
  hasPartialDataNotice ||
  hasStaleSnapshotNotice ||
  hasSupportingLedger;

/**
 * Width permits an adjacent Today lane; product content decides whether that
 * lane exists. A simple primary state must never surrender half the canvas to
 * an empty secondary view.
 */
export const resolveTodayDashboardLayout = ({
  wideWindowEligible,
  secondary,
}: {
  wideWindowEligible: boolean;
  secondary: TodaySecondaryContent;
}): TodayDashboardLayout =>
  wideWindowEligible && hasTodaySecondaryContent(secondary)
    ? 'adjacent'
    : 'stacked';
