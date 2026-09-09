const hasFacebookAppId = Boolean(
  process.env.EXPO_PUBLIC_FACEBOOK_APP_ID?.trim()
);
const isAndroidBuild = process.env.EAS_BUILD_PLATFORM === 'android';
const hasSupportedFacebookConfig = hasFacebookAppId && !isAndroidBuild;

module.exports = {
  dependencies: {
    'react-native-date-picker': {
      platforms: {
        ios: null,
      },
    },
    ...(hasSupportedFacebookConfig
      ? {}
      : {
          'react-native-fbsdk-next': {
            platforms: {
              android: null,
              ios: null,
            },
          },
        }),
  },
};
