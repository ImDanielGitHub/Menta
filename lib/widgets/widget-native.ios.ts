import { requireOptionalNativeModule } from 'expo';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import type { StreakWidgetSnapshot } from './widget-model';

export const homeWidgetsAvailable = () => {
  try {
    return Boolean(requireOptionalNativeModule('ExpoWidgets'));
  } catch {
    return false;
  }
};

let mascotPromise: Promise<string | undefined> | null = null;
export const readWidgetTimeline = async (): Promise<
  { date: Date; props: StreakWidgetSnapshot }[]
> => {
  if (!homeWidgetsAvailable()) return [];
  const { default: widget } = await import('@/widgets/menta-streak-widget');
  return widget.getTimeline();
};

const prepareMascot = (directory: string | null | undefined) => {
  if (!directory) return Promise.resolve(undefined);
  if (!mascotPromise)
    mascotPromise = (async () => {
      const asset = Asset.fromModule(
        require('@/assets/images/mascot/today-clear.png')
      );
      await asset.downloadAsync();
      if (!asset.localUri) return undefined;
      const destination = new File(directory, 'menta-widget-companion.png');
      if (!destination.exists) new File(asset.localUri).copy(destination);
      return destination.uri;
    })().catch(() => {
      mascotPromise = null;
      return undefined;
    });
  return mascotPromise;
};

export const publishWidgetTimeline = async (
  entries: { date: Date; props: StreakWidgetSnapshot }[],
  isCurrent: () => boolean
) => {
  if (!homeWidgetsAvailable() || !isCurrent()) return;
  // Older binaries must never evaluate createWidget or the Expo UI native views.
  const [{ default: widget }, { widgetsDirectory }] = await Promise.all([
    import('@/widgets/menta-streak-widget'),
    import('expo-widgets'),
  ]);
  if (!isCurrent()) return;
  // Publish privacy/sign-out changes before any optional image I/O.
  widget.updateTimeline(entries);
  if (!entries.some(entry => entry.props.streak)) return;
  const mascotUri = await prepareMascot(widgetsDirectory);
  if (mascotUri && isCurrent()) {
    widget.updateTimeline(
      entries.map(entry => ({ ...entry, props: { ...entry.props, mascotUri } }))
    );
  }
};
