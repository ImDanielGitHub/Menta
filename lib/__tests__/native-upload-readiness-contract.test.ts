import fs from 'node:fs';
import path from 'node:path';

type JsonRecord = Record<string, unknown>;

const readText = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const readJson = (relativePath: string): JsonRecord =>
  JSON.parse(readText(relativePath)) as JsonRecord;

const asRecord = (value: unknown, label: string): JsonRecord => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }

  return value as JsonRecord;
};

const pngDimensions = (
  relativePath: string
): { width: number; height: number } => {
  const image = fs.readFileSync(path.join(process.cwd(), relativePath));

  if (image.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${relativePath} is not a PNG`);
  }

  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
  };
};

describe('native upload readiness contract', () => {
  const appConfig = readJson('app.json');
  const expo = asRecord(appConfig.expo, 'expo');
  const plugins = expo.plugins as unknown[];

  it('keeps the approved Menta mascot as the native app icon', () => {
    const ios = asRecord(expo.ios, 'expo.ios');
    const configuredIcon = './assets/images/AppIcons/appstore.png';
    const iconAsset = fs.readFileSync(path.join(process.cwd(), configuredIcon));
    const nativeIcon = fs.readFileSync(
      path.join(
        process.cwd(),
        'ios/LockedInPro/Images.xcassets/AppIcon.appiconset/1024.png'
      )
    );

    expect(expo.icon).toBe(configuredIcon);
    expect(ios.icon).toBe(configuredIcon);
    expect(pngDimensions('assets/images/AppIcons/appstore.png')).toEqual({
      width: 1024,
      height: 1024,
    });
    expect(nativeIcon.equals(iconAsset)).toBe(true);
    expect(configuredIcon).not.toContain('splash-icon.png');
  });

  it('uses one 1024-square launch composition for native and React handoff', () => {
    const splashEntry = plugins.find(
      entry => Array.isArray(entry) && entry[0] === 'expo-splash-screen'
    ) as [string, unknown] | undefined;
    const splash = asRecord(splashEntry?.[1], 'expo-splash-screen config');
    const dark = asRecord(splash.dark, 'expo-splash-screen dark config');
    const loadingSource = readText('components/ui/FullScreenLoading.tsx');
    const storyboard = readText('ios/LockedInPro/SplashScreen.storyboard');
    const canonicalAsset = fs.readFileSync(
      path.join(process.cwd(), 'assets/images/menta-splash-welcome.png')
    );

    expect(expo).not.toHaveProperty('splash');
    expect(expo.backgroundColor).toBe('#080909');
    expect(splash).toMatchObject({
      backgroundColor: '#080909',
      image: './assets/images/menta-splash-welcome.png',
      imageWidth: 280,
      resizeMode: 'contain',
    });
    expect(dark).toEqual({
      backgroundColor: '#080909',
      image: './assets/images/menta-splash-welcome.png',
    });
    expect(loadingSource).toContain(
      "require('@/assets/images/menta-splash-welcome.png')"
    );
    expect(loadingSource).not.toContain('blackandwhite-app-logo.png');
    expect(pngDimensions('assets/images/menta-splash-welcome.png')).toEqual({
      width: 1024,
      height: 1024,
    });
    expect(storyboard).toContain('firstAttribute="centerX"');
    expect(storyboard).toContain('firstAttribute="centerY"');
    expect(storyboard.match(/constant="280"/g)).toHaveLength(2);

    for (const filename of ['image.png', 'image@2x.png', 'image@3x.png']) {
      const nativeAsset = fs.readFileSync(
        path.join(
          process.cwd(),
          'ios/LockedInPro/Images.xcassets/SplashScreenLegacy.imageset',
          filename
        )
      );
      expect(nativeAsset.equals(canonicalAsset)).toBe(true);
    }
  });

  it('keeps native Google identity aligned with the iOS callback scheme', () => {
    const extra = asRecord(expo.extra, 'expo.extra');
    const ios = asRecord(expo.ios, 'expo.ios');
    const infoPlist = asRecord(ios.infoPlist, 'expo.ios.infoPlist');
    const nativeInfoPlist = readText('ios/LockedInPro/Info.plist');
    const clientId = extra.googleIosClientId;

    expect(expo.name).toBe('Menta');
    expect(infoPlist.CFBundleName).toBe('Menta');
    expect(nativeInfoPlist).toContain(
      '<key>CFBundleDisplayName</key>\n\t<string>Menta</string>'
    );
    expect(nativeInfoPlist).toContain(
      '<key>CFBundleName</key>\n\t<string>Menta</string>'
    );
    expect(plugins).toContain('@react-native-google-signin/google-signin');
    expect(extra.oauthUseWeb).toBe(false);
    expect(extra.oauthWip).toBe(false);
    expect(typeof extra.googleWebClientId).toBe('string');
    expect(typeof clientId).toBe('string');

    const expectedScheme = `com.googleusercontent.apps.${String(
      clientId
    ).replace('.apps.googleusercontent.com', '')}`;
    expect(JSON.stringify(infoPlist.CFBundleURLTypes)).toContain(
      expectedScheme
    );
    expect(nativeInfoPlist).toContain(expectedScheme);
  });

  it('keeps Expo SDK 57 and the tracked iOS deployment target aligned', () => {
    const buildPropertiesEntry = plugins.find(
      entry => Array.isArray(entry) && entry[0] === 'expo-build-properties'
    ) as [string, unknown] | undefined;
    const buildProperties = asRecord(
      buildPropertiesEntry?.[1],
      'expo-build-properties config'
    );
    const ios = asRecord(buildProperties.ios, 'expo-build-properties ios');
    const project = readText('ios/LockedInPro.xcodeproj/project.pbxproj');
    const podfileProperties = readJson('ios/Podfile.properties.json');

    expect(ios.deploymentTarget).toBe('16.4');
    expect(podfileProperties['ios.deploymentTarget']).toBe('16.4');
    expect(project).toContain('IPHONEOS_DEPLOYMENT_TARGET = 16.4;');
  });

  it('ships a resizable first-party iPad target without changing the iPhone orientation contract', () => {
    const ios = asRecord(expo.ios, 'expo.ios');
    const infoPlist = asRecord(ios.infoPlist, 'expo.ios.infoPlist');
    const nativeInfoPlist = readText('ios/LockedInPro/Info.plist');
    const project = readText('ios/LockedInPro.xcodeproj/project.pbxproj');
    const iPadOrientations = [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationPortraitUpsideDown',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ];

    expect(ios.supportsTablet).toBe(true);
    expect(ios.requireFullScreen).toBe(false);
    expect(infoPlist['UISupportedInterfaceOrientations~ipad']).toEqual(
      iPadOrientations
    );
    expect(expo.orientation).toBe('portrait');
    expect(nativeInfoPlist).not.toContain('<key>UIRequiresFullScreen</key>');
    expect(nativeInfoPlist).toContain(
      '<key>UISupportedInterfaceOrientations~ipad</key>'
    );
    for (const orientation of iPadOrientations) {
      expect(nativeInfoPlist).toContain(`<string>${orientation}</string>`);
    }
    expect(project.match(/TARGETED_DEVICE_FAMILY = "1,2";/g)).toHaveLength(4);
  });

  it('aligns the native candidate with the App Store 1.9.3 notification release', () => {
    const project = readText('ios/LockedInPro.xcodeproj/project.pbxproj');
    const notificationExtensionInfo = readText(
      'ios/OneSignalNotificationServiceExtension/OneSignalNotificationServiceExtension-Info.plist'
    );

    expect(expo.version).toBe('1.9.3');
    expect(expo.ios).toMatchObject({ buildNumber: '154' });
    expect(project.match(/MARKETING_VERSION = 1\.9\.3;/g)).toHaveLength(4);
    expect(project.match(/CURRENT_PROJECT_VERSION = 154;/g)).toHaveLength(4);
    expect(notificationExtensionInfo).toContain(
      '<string>$(MARKETING_VERSION)</string>'
    );
  });

  it('uses system media pickers without broad library permissions', () => {
    const ios = asRecord(expo.ios, 'expo.ios');
    const infoPlist = asRecord(ios.infoPlist, 'expo.ios.infoPlist');
    const android = asRecord(expo.android, 'expo.android');
    const androidPermissions = android.permissions as unknown[];
    const nativeInfoPlist = readText('ios/LockedInPro/Info.plist');
    const cameraCopy =
      'Menta uses your camera only when you choose to take a photo or video for proof, or scan a group or event check-in code.';
    const imagePickerEntry = plugins.find(
      entry => Array.isArray(entry) && entry[0] === 'expo-image-picker'
    ) as [string, unknown] | undefined;
    const imagePicker = asRecord(
      imagePickerEntry?.[1],
      'expo-image-picker config'
    );

    expect(infoPlist.NSCameraUsageDescription).toBe(cameraCopy);
    expect(infoPlist.NSPhotoLibraryUsageDescription).toBeUndefined();
    expect(infoPlist.NSPhotoLibraryAddUsageDescription).toBeUndefined();
    expect(nativeInfoPlist).toContain(`<string>${cameraCopy}</string>`);
    expect(nativeInfoPlist).not.toContain('NSPhotoLibraryUsageDescription');
    expect(nativeInfoPlist).not.toContain('NSPhotoLibraryAddUsageDescription');
    expect(imagePicker.photosPermission).toBe(false);
    expect(androidPermissions).not.toContain(
      'android.permission.READ_MEDIA_IMAGES'
    );
    expect(androidPermissions).not.toContain(
      'android.permission.READ_MEDIA_VIDEO'
    );
    expect(JSON.stringify(plugins)).not.toContain('challenge proof');
    expect(nativeInfoPlist).not.toContain('proof for a challenge');
  });

  it('keeps the SDK 57 native updates runtime on the patch-version boundary', () => {
    const nativeUpdatesConfig = readText(
      'ios/LockedInPro/Supporting/Expo.plist'
    );

    expect(expo.runtimeVersion).toBe('1.9.3');
    expect(nativeUpdatesConfig).toContain(
      '<key>EXUpdatesRuntimeVersion</key>\n    <string>1.9.3</string>'
    );
    expect(nativeUpdatesConfig).not.toContain(
      '<string>file:fingerprint</string>'
    );
    expect(nativeUpdatesConfig).not.toContain(
      '<key>EXUpdatesRuntimeVersion</key>\n    <string>1.0.3</string>'
    );
  });

  it('creates native candidates without silently submitting them', () => {
    const pinnedEasCliVersion = '21.0.0';
    const productionWorkflow = readText(
      '.github/workflows/eas-unified-on-main.yml'
    );
    const previewWorkflow = readText('.github/workflows/eas-unified-on-pr.yml');

    for (const workflow of [productionWorkflow, previewWorkflow]) {
      expect(workflow).toContain(`eas-version: ${pinnedEasCliVersion}`);
      expect(workflow).toContain('eas build --platform');
      expect(workflow).not.toContain('eas submit');
      expect(workflow).not.toContain('eas-cli@latest');
    }

    expect(productionWorkflow).toContain(
      'eas build --platform android --profile production'
    );
    expect(productionWorkflow).toContain(
      'eas build --platform ios --profile production'
    );
    expect(productionWorkflow).toContain(
      'Store upload/submission is a separate approved action.'
    );
  });

  it('keeps Sentry uploads on for devices and skips credentials only on simulators', () => {
    const project = readText('ios/LockedInPro.xcodeproj/project.pbxproj');
    const sentryProperties = readText('sentry.properties');
    const eas = readJson('eas.json');
    const build = asRecord(eas.build, 'eas.build');
    const production = asRecord(build.production, 'eas.build.production');
    const productionEnv = asRecord(production.env, 'eas.build.production.env');

    expect(
      project.match(
        /"SENTRY_DISABLE_AUTO_UPLOAD\[sdk=iphonesimulator\*\]" = true;/g
      )
    ).toHaveLength(2);
    expect(project).not.toContain('SENTRY_ALLOW_FAILURE');
    expect(productionEnv.SENTRY_PROPERTIES).toBe('../sentry.properties');
    expect(productionEnv.SENTRY_DISABLE_AUTO_UPLOAD).toBeUndefined();
    expect(productionEnv.SENTRY_ALLOW_FAILURE).toBeUndefined();
    expect(sentryProperties).toContain('defaults.org=lockedin-pro');
    expect(sentryProperties).toContain('defaults.project=react-native');
    expect(sentryProperties).not.toContain('[defaults]');
  });

  it('requires approval before submitting the exact iOS job output to TestFlight', () => {
    const workflow = readText('.eas/workflows/release-testflight.yml');

    expect(workflow).toContain('platform: ios');
    expect(workflow).toContain('type: require-approval');
    expect(workflow).toContain('needs: [build_ios]');
    expect(workflow).toContain('needs: [build_ios, approve_testflight]');
    expect(workflow).toContain(
      'build_id: ${{ needs.build_ios.outputs.build_id }}'
    );
    expect(workflow).not.toContain('platform: android');
    expect(workflow).not.toContain('--latest');
  });

  it('declares Meta ads ATT, advertising ID, and SKAdNetwork measurement', () => {
    const ios = asRecord(expo.ios, 'expo.ios');
    const infoPlist = asRecord(ios.infoPlist, 'expo.ios.infoPlist');
    const android = asRecord(expo.android, 'expo.android');
    const androidPermissions = android.permissions as unknown[];
    const nativeInfoPlist = readText('ios/LockedInPro/Info.plist');
    const facebookNativePatch = readText(
      'patches/react-native-fbsdk-next+13.4.3.patch'
    );
    const appConfig = readText('app.config.js');
    const reactNativeConfig = readText('react-native.config.js');
    const trackingCopy =
      'Menta uses this to measure whether ads from Meta helped someone sign up, create a group, create a promise, or invite a friend. You can decline and still use Menta.';
    const trackingPlugin = plugins.find(
      entry => Array.isArray(entry) && entry[0] === 'expo-tracking-transparency'
    ) as [string, unknown] | undefined;
    const trackingConfig = asRecord(
      trackingPlugin?.[1],
      'expo-tracking-transparency config'
    );
    const skAdNetworkItems = infoPlist.SKAdNetworkItems as unknown[];

    expect(infoPlist.NSUserTrackingUsageDescription).toBe(trackingCopy);
    expect(trackingConfig.userTrackingPermission).toBe(trackingCopy);
    expect(nativeInfoPlist).toContain(`<string>${trackingCopy}</string>`);
    expect(androidPermissions).toContain(
      'com.google.android.gms.permission.AD_ID'
    );
    expect(JSON.stringify(skAdNetworkItems)).toContain(
      'v9wttpbfk9.skadnetwork'
    );
    expect(JSON.stringify(skAdNetworkItems)).toContain(
      'n38lu8286q.skadnetwork'
    );
    expect(nativeInfoPlist).toContain('v9wttpbfk9.skadnetwork');
    expect(nativeInfoPlist).toContain('n38lu8286q.skadnetwork');
    expect(appConfig).toContain('advertiserIDCollectionEnabled: false');
    expect(appConfig).toContain('autoLogAppEventsEnabled: false');
    expect(appConfig).toContain('isAutoInitEnabled: false');
    expect(appConfig).toContain("EAS_BUILD_PLATFORM === 'android'");
    expect(appConfig).toContain('hasFacebookConfig && !isAndroidBuild');
    expect(reactNativeConfig).toContain("EAS_BUILD_PLATFORM === 'android'");
    expect(reactNativeConfig).toContain('hasFacebookAppId && !isAndroidBuild');
    expect(reactNativeConfig).toContain('android: null');
    expect(readText('lib/meta-ads.ts')).toContain("platform === 'ios'");
    expect(readText('lib/meta-ads.ts')).toContain(
      '!isMetaAdsPlatformSupported() || !hasMetaAdsConfig()'
    );
    expect(JSON.stringify(plugins)).not.toContain('"react-native-fbsdk-next"');
    expect(infoPlist.FacebookAutoInitEnabled).toBe(false);
    expect(infoPlist.FacebookAutoLogAppEventsEnabled).toBe(false);
    expect(infoPlist.FacebookAdvertiserIDCollectionEnabled).toBe(false);
    expect(nativeInfoPlist).toMatch(
      /<key>FacebookAutoInitEnabled<\/key>\s*<false\/>/
    );
    expect(nativeInfoPlist).toMatch(
      /<key>FacebookAutoLogAppEventsEnabled<\/key>\s*<false\/>/
    );
    expect(nativeInfoPlist).toMatch(
      /<key>FacebookAdvertiserIDCollectionEnabled<\/key>\s*<false\/>/
    );
    expect(facebookNativePatch).toContain(
      'Bundle.main.object(forInfoDictionaryKey: "FacebookAppID")'
    );
    expect(facebookNativePatch).toContain(
      'Bundle.main.object(forInfoDictionaryKey: "FacebookClientToken")'
    );
    expect(facebookNativePatch).toContain(
      'guard hasFacebookConfiguration else'
    );
  });
});
