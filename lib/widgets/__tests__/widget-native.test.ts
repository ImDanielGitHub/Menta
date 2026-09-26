import {
  homeWidgetsAvailable,
  publishWidgetTimeline,
  readWidgetTimeline,
} from '../widget-native.ios';
import { makeWidgetFallback } from '../widget-model';

jest.mock('expo', () => ({ requireOptionalNativeModule: () => null }));
jest.mock('@/widgets/menta-streak-widget', () => {
  throw new Error('Older binaries must not initialise the widget extension');
});

it('keeps older installed clients usable without the new native widget module', async () => {
  expect(homeWidgetsAvailable()).toBe(false);
  await expect(readWidgetTimeline()).resolves.toEqual([]);
  await expect(
    publishWidgetTimeline(
      [{ date: new Date(), props: makeWidgetFallback('signed-out', 'en-NZ') }],
      () => true
    )
  ).resolves.toBeUndefined();
});
