const ATT_USAGE_DESCRIPTION =
  'Menta uses this to measure whether ads from Meta helped someone sign up, create a group, create a promise, or invite a friend. You can decline and still use Menta.';

const pluginName = plugin => (Array.isArray(plugin) ? plugin[0] : plugin);

module.exports = ({ config }) => {
  const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID?.trim() ?? '';
  const facebookClientToken =
    process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN?.trim() ?? '';
  const hasFacebookConfig = Boolean(facebookAppId && facebookClientToken);
  const isAndroidBuild = process.env.EAS_BUILD_PLATFORM === 'android';

  const plugins = (config.plugins ?? []).filter(plugin => {
    const name = pluginName(plugin);
    return (
      name !== 'react-native-fbsdk-next' &&
      name !== 'expo-tracking-transparency'
    );
  });

  plugins.push([
    'expo-tracking-transparency',
    {
      userTrackingPermission: ATT_USAGE_DESCRIPTION,
    },
  ]);

  if (hasFacebookConfig && !isAndroidBuild) {
    plugins.push([
      'react-native-fbsdk-next',
      {
        appID: facebookAppId,
        clientToken: facebookClientToken,
        displayName: 'Menta',
        scheme: `fb${facebookAppId}`,
        advertiserIDCollectionEnabled: false,
        autoLogAppEventsEnabled: false,
        isAutoInitEnabled: false,
        iosUserTrackingPermission: ATT_USAGE_DESCRIPTION,
      },
    ]);
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      facebookAppId: isAndroidBuild ? '' : facebookAppId,
      facebookClientToken: isAndroidBuild ? '' : facebookClientToken,
    },
  };
};
