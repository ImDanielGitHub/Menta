import type { StreakWidgetSnapshot } from './widget-model';

export const homeWidgetsAvailable = () => false;
export const readWidgetTimeline = async (): Promise<
  { date: Date; props: StreakWidgetSnapshot }[]
> => [];
export const publishWidgetTimeline = async (
  _entries: { date: Date; props: StreakWidgetSnapshot }[],
  _isCurrent: () => boolean
): Promise<void> => {
  return undefined;
};
