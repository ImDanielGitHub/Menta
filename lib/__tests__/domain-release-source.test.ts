import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(join(process.cwd(), path), 'utf8'));

const readText = (path: string): string =>
  readFileSync(join(process.cwd(), path), 'utf8');

describe('menta.quest release source', () => {
  it('keeps Lovable association files equal to the canonical release files', () => {
    expect(
      readJson(
        'domain/menta.quest/lovable-overlay/public/.well-known/apple-app-site-association'
      )
    ).toEqual(
      readJson('domain/menta.quest/.well-known/apple-app-site-association')
    );
    expect(
      readJson(
        'domain/menta.quest/lovable-overlay/public/.well-known/assetlinks.json'
      )
    ).toEqual(readJson('domain/menta.quest/.well-known/assetlinks.json'));
  });

  it('declares every native public-link route and both Android certificates', () => {
    const association = readJson(
      'domain/menta.quest/.well-known/apple-app-site-association'
    ) as {
      applinks: {
        details: Array<{
          appIDs: string[];
          components: Array<{ '/': string }>;
        }>;
      };
    };
    const assetLinks = readJson(
      'domain/menta.quest/.well-known/assetlinks.json'
    ) as Array<{
      target: { sha256_cert_fingerprints: string[] };
    }>;

    expect(association.applinks.details).toHaveLength(1);
    expect(association.applinks.details[0]?.appIDs).toEqual([
      '7PDP8J2L53.com.anekedigitalapps.lockedin',
    ]);
    expect(
      association.applinks.details[0]?.components.map(
        component => component['/']
      )
    ).toEqual(
      expect.arrayContaining([
        '/join',
        '/join/*',
        '/invite',
        '/event',
        '/event/*',
      ])
    );
    expect(assetLinks[0]?.target.sha256_cert_fingerprints).toEqual([
      '0F:59:AE:D3:F7:70:BC:E7:35:A2:E0:04:F4:E0:8C:76:15:D0:20:21:3B:24:89:22:6F:77:61:9A:7F:F2:5D:99',
      'AF:A3:E7:D5:44:A3:04:1F:9F:A5:57:CD:51:2C:6E:8B:CC:E9:C7:3D:B1:50:63:26:0F:6D:99:C3:3F:B9:FA:3C',
    ]);
  });

  it('uses exactly the current appIDs and components AASA structure', () => {
    const association = readJson(
      'domain/menta.quest/.well-known/apple-app-site-association'
    ) as {
      applinks: {
        details: Array<Record<string, unknown>>;
      };
    };
    const detail = association.applinks.details[0];

    expect(detail).toBeDefined();
    expect(Object.keys(detail ?? {}).sort()).toEqual(['appIDs', 'components']);
    expect(detail).not.toHaveProperty('appID');
    expect(detail).not.toHaveProperty('paths');
  });

  it('contains the event fallback and no placeholder or automatic referral promise', () => {
    const appSource = readText(
      'domain/menta.quest/lovable-overlay/src/App.tsx'
    );
    const inviteSource = readText(
      'domain/menta.quest/lovable-overlay/src/pages/Invite.tsx'
    );
    const joinSource = readText(
      'domain/menta.quest/lovable-overlay/src/pages/Join.tsx'
    );
    const releaseSource = readText(
      'domain/menta.quest/lovable-overlay/src/lib/release-config.ts'
    );
    const combinedSource = `${appSource}\n${inviteSource}\n${releaseSource}`;

    expect(appSource).toContain('path="/event/:eventId"');
    expect(appSource).toContain('path="/join/*"');
    expect(appSource).toContain('path="/invite"');
    expect(appSource).not.toContain('path="/invite/*"');
    expect(joinSource).toContain('{resolution.code}');
    expect(joinSource).toContain('href={resolution.appUrl}');
    expect(combinedSource).not.toContain('id0000000000');
    expect(inviteSource.toLowerCase()).not.toContain(
      'referral attaches automatically'
    );
    expect(inviteSource).toMatch(
      /A code shown here is not proof\s+that a reward has been added\./
    );
  });
});
