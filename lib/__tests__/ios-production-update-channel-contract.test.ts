import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '../..');
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('iOS production update channel contract', () => {
  it('keeps app version, runtime, build, URL, and channel aligned', () => {
    const config = JSON.parse(read('app.json')).expo;
    expect(config.updates).toEqual({
      url: 'https://u.expo.dev/',
      requestHeaders: { 'expo-channel-name': 'production' },
    });
  });

  it('embeds the same runtime, URL, and channel in the checked-in iOS plist', () => {
    const expoPlist = read('ios/LockedInPro/Supporting/Expo.plist');

    expect(expoPlist).toContain('<key>EXUpdatesRuntimeVersion</key>');
    expect(expoPlist).toContain(
      '<string>https://u.expo.dev/</string>'
    );
    expect(expoPlist).toMatch(
      /<key>EXUpdatesRequestHeaders<\/key>[\s\S]*?<key>expo-channel-name<\/key>\s*<string>production<\/string>/u
    );
  });

  it('rejects any IPA without the production channel request header', () => {
    const workflow = read('codemagic.yaml');

    expect(workflow).toContain(
      'plutil -extract EXUpdatesRequestHeaders.expo-channel-name raw'
    );
    expect(workflow).toContain('EXPO_UPDATE_CHANNEL: production');
  });
});
