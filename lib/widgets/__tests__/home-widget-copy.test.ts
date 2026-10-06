import {
  getHomeWidgetEmptyCreateCopy,
  getHomeWidgetSkipCopy,
} from '@/lib/widgets/home-widget-copy';
import { translate } from '@/lib/localization/translate';

describe('home widget setup copy', () => {
  it('names You as the skip destination instead of Not now', () => {
    expect(getHomeWidgetSkipCopy()).toBe('Back to You');
    expect(getHomeWidgetSkipCopy().toLowerCase()).not.toContain('not now');
  });

  it('reuses the shared You back label rather than the widget Not now key', () => {
    expect(getHomeWidgetSkipCopy()).toBe(
      translate('en-NZ', 'fullAuth.shared.back_to_you')
    );
    expect(getHomeWidgetSkipCopy()).not.toBe(
      translate('en-NZ', 'widgets.notNow')
    );
  });

  it('names empty-list create instead of choosing a promise', () => {
    expect(getHomeWidgetEmptyCreateCopy()).toBe('Create a promise');
    expect(getHomeWidgetEmptyCreateCopy()).toBe(
      translate('en-NZ', 'fullAuth.tabs_profile.create_a_promise')
    );
    expect(getHomeWidgetEmptyCreateCopy()).not.toBe(
      translate('en-NZ', 'widgets.state.empty.action')
    );
  });
});
