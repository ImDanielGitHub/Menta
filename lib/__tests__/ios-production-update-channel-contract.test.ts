import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '../..');
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('iOS production update channel contract', () => {
  it('keeps app version, runtime, build, URL, and channel aligned', () => {
    const config = JSON.parse(read('app.json')).expo;
    const packageManifest = JSON.parse(read('package.json'));
    const packageLock = JSON.parse(read('package-lock.json'));

    expect(config.version).toBe('1.9.3');
    expect(config.runtimeVersion).toBe('1.9.3');
    expect(packageManifest.version).toBe('1.9.3');
    expect(packageLock.version).toBe('1.9.3');
    expect(packageLock.packages[''].version).toBe('1.9.3');
    expect(config.ios.buildNumber).toBe('154');
    expect(config.updates).toEqual({
      url: 'https://u.expo.dev/',
      requestHeaders: { 'expo-channel-name': 'production' },
    });
  });

  it('embeds the same runtime, URL, and channel in the checked-in iOS plist', () => {
    const expoPlist = read('ios/LockedInPro/Supporting/Expo.plist');

    expect(expoPlist).toContain('<key>EXUpdatesRuntimeVersion</key>');
    expect(expoPlist).toContain('<string>1.9.3</string>');
    expect(expoPlist).toContain(
      '<string>https://u.expo.dev/</string>'
    );
    expect(expoPlist).toMatch(
      /<key>EXUpdatesRequestHeaders<\/key>[\s\S]*?<key>expo-channel-name<\/key>\s*<string>production<\/string>/u
    );
  });

  it('aligns the app and notification extension native build settings', () => {
    const project = read('ios/LockedInPro.xcodeproj/project.pbxproj');

    expect(project.match(/CURRENT_PROJECT_VERSION = 154;/gu)).toHaveLength(4);
    expect(project.match(/MARKETING_VERSION = 1\.9\.3;/gu)).toHaveLength(4);
  });

  it('rejects any IPA without the production channel request header', () => {
    const workflow = read('codemagic.yaml');

    expect(workflow).toContain(
      'plutil -extract EXUpdatesRequestHeaders.expo-channel-name raw'
    );
    expect(workflow).toContain('EXPO_UPDATE_CHANNEL: production');
    expect(workflow).toContain('EXPO_RUNTIME_VERSION: 1.9.3');
    expect(workflow).toContain("APP_STORE_BUILD_NUMBER: '154'");
  });
});
