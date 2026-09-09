import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import appConfig from '@/app.json';
import { redirectSystemPath } from '@/app/+native-intent';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const CAPABILITY = 'opaque_event_capability_1234567890';

describe('native event intent entry points', () => {
  it('normalizes cold HTTPS and custom-scheme launches before Expo Router mounts', () => {
    expect(
      redirectSystemPath({
        path: `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}`,
        initial: true,
      })
    ).toBe(`/events/${EVENT_ID}?shareToken=${CAPABILITY}`);

    expect(
      redirectSystemPath({
        path: `menta:///event/${EVENT_ID}?invite=${CAPABILITY}`,
        initial: true,
      })
    ).toBe(`/events/${EVENT_ID}?inviteToken=${CAPABILITY}`);
  });

  it('fails closed for malformed and capability-bypassing cold event links', () => {
    expect(
      redirectSystemPath({
        path: `https://menta.quest/event/${EVENT_ID}?share=short`,
        initial: true,
      })
    ).toBe('/events');
    expect(
      redirectSystemPath({
        path: `menta://events/${EVENT_ID}?inviteToken=${CAPABILITY}`,
        initial: true,
      })
    ).toBe('/events');
    expect(
      redirectSystemPath({
        path: `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}&invite=${CAPABILITY}`,
        initial: true,
      })
    ).toBe('/events');
  });

  it('declares the generated HTTPS event path for both native platforms', () => {
    expect(appConfig.expo.ios.associatedDomains).toContain(
      'applinks:menta.quest'
    );

    const eventIntent = appConfig.expo.android.intentFilters
      .flatMap(filter => filter.data)
      .find(
        data =>
          data.scheme === 'https' &&
          data.host === 'menta.quest' &&
          data.pathPrefix === '/event'
      );

    expect(eventIntent).toEqual({
      scheme: 'https',
      host: 'menta.quest',
      pathPrefix: '/event',
    });

    const associationPath = join(
      process.cwd(),
      'domain/menta.quest/.well-known/apple-app-site-association'
    );
    const association = JSON.parse(readFileSync(associationPath, 'utf8')) as {
      applinks: {
        details: Array<{
          appIDs: string[];
          components: Array<{ '/': string }>;
        }>;
      };
    };
    const mentaAssociation = association.applinks.details.find(detail =>
      detail.appIDs.includes('7PDP8J2L53.com.anekedigitalapps.lockedin')
    );

    expect(mentaAssociation?.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ '/': '/event' }),
        expect.objectContaining({ '/': '/event/*' }),
      ])
    );
  });
});
