/* eslint-disable @typescript-eslint/no-require-imports -- Expo loads config plugins as CommonJS modules. */
const fs = require('node:fs');
const path = require('node:path');
const plist = require('@expo/plist').default;
const {
  withDangerousMod,
  withPlugins,
  withXcodeProject,
} = require('expo/config-plugins');

const targetName = 'ExpoWidgetsTarget';
const fontName = 'Newsreader_600SemiBold.ttf';

/** Keep the checked-in widget target and future prebuilds on the same configuration. */
module.exports = function withMentaStreakWidget(config) {
  const widgetPlugins = [
    [
      'expo-widgets',
      {
        bundleIdentifier: 'org.example.menta.streakwidgets',
        groupIdentifier: 'group.org.example.menta.widgets',
        enableAndroid: false,
        enablePushNotifications: false,
        widgets: [
          {
            name: 'MentaStreak',
            displayName: 'Your streak',
            description: 'Keep your promise and streak in sight.',
            ios: {
              supportedFamilies: [
                'systemSmall',
                'systemMedium',
                'systemLarge',
                'systemExtraLarge',
                'accessoryCircular',
                'accessoryRectangular',
                'accessoryInline',
              ],
            },
            android: null,
          },
        ],
      },
    ],
  ];
  config = withDangerousMod(config, [
    'ios',
    async mod => {
      const target = path.join(mod.modRequest.platformProjectRoot, targetName);
      const source = require.resolve(
        `@expo-google-fonts/newsreader/600SemiBold/${fontName}`
      );
      fs.copyFileSync(source, path.join(target, fontName));
      const infoPath = path.join(target, 'Info.plist');
      const info = plist.parse(fs.readFileSync(infoPath, 'utf8'));
      info.UIAppFonts = [...new Set([...(info.UIAppFonts || []), fontName])];
      fs.writeFileSync(infoPath, plist.build(info));
      return mod;
    },
  ]);
  config = withXcodeProject(config, mod => {
    const project = mod.modResults;
    const target = project.findTargetKey(targetName);
    if (!target) throw new Error('Menta widget target was not generated');
    // The Xcode helper deduplicates relative file names across groups. Give
    // the widget its own Info.plist reference instead of reusing the UI tests'.
    const widgetGroup = project.pbxGroupByName(targetName);
    const infoReference = widgetGroup?.children?.find(
      child => child.comment === 'Info.plist'
    );
    const groups = project.hash.project.objects.PBXGroup;
    if (
      infoReference &&
      Object.values(groups).some(
        group =>
          group !== widgetGroup &&
          typeof group === 'object' &&
          group.children?.some(child => child.value === infoReference.value)
      )
    ) {
      const references = project.pbxFileReferenceSection();
      const separateReference = project.generateUuid();
      references[separateReference] = { ...references[infoReference.value] };
      references[`${separateReference}_comment`] = 'Info.plist';
      infoReference.value = separateReference;
    }
    const resourcePath = `${targetName}/${fontName}`;
    if (!project.pbxGroupByName('Resources')) {
      const resources = project.addPbxGroup([], 'Resources', '');
      project.addToPbxGroup(
        resources.uuid,
        project.getFirstProject().firstProject.mainGroup
      );
    }
    const resourcesGroup = project.pbxGroupByName('Resources');
    if (!resourcesGroup.path || resourcesGroup.path === 'undefined')
      delete resourcesGroup.path;
    const phases = project.hash.project.objects.PBXResourcesBuildPhase ?? {};
    const nativeTarget = project.pbxNativeTargetSection()[target];
    // The xcode convenience lookup returns the main app's phase when this
    // target has none. Resolve membership explicitly before adding a resource.
    if (!nativeTarget.buildPhases.some(phase => phases[phase.value])) {
      project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target);
    }
    if (!project.hasFile(resourcePath))
      project.addResourceFile(resourcePath, { target });
    const fontReference = Object.entries(
      project.pbxFileReferenceSection()
    ).find(
      ([, file]) =>
        typeof file === 'object' &&
        String(file.path).replace(/"/g, '') === resourcePath
    );
    if (fontReference) {
      const [fileId, file] = fontReference;
      file.lastKnownFileType = 'file';
      delete file.fileEncoding;
      delete file.explicitFileType;
      const buildFile = Object.entries(project.pbxBuildFileSection()).find(
        ([, value]) => typeof value === 'object' && value.fileRef === fileId
      );
      const widgetPhase = nativeTarget.buildPhases.find(
        phase => phases[phase.value]
      );
      if (buildFile && widgetPhase) {
        for (const phase of Object.values(phases)) {
          if (typeof phase === 'object')
            phase.files = phase.files.filter(
              file => file.value !== buildFile[0]
            );
        }
        phases[widgetPhase.value].files.push({
          value: buildFile[0],
          comment: `${fontName} in Resources`,
        });
      }
    }
    // Info.plist-writing scripts must run after embedding extensions. App
    // Intents metadata otherwise introduces a copy/configuration dependency cycle.
    const appTarget =
      project.pbxNativeTargetSection()[project.getFirstTarget().uuid];
    const embedIndex = appTarget.buildPhases.findIndex(
      phase => phase.comment === 'Embed Foundation Extensions'
    );
    const bundleIndex = appTarget.buildPhases.findIndex(
      phase => phase.comment === 'Bundle React Native code and images'
    );
    if (embedIndex >= 0 && bundleIndex >= 0 && embedIndex > bundleIndex) {
      const [embed] = appTarget.buildPhases.splice(embedIndex, 1);
      appTarget.buildPhases.splice(bundleIndex, 0, embed);
    }
    return mod;
  });
  // Mods run in reverse registration order: generate the extension before
  // copying its font and adding that font to its resource build phase.
  return withPlugins(config, widgetPlugins);
};
