/* eslint-disable @typescript-eslint/no-require-imports */
const {
  createRunOncePlugin,
  withProjectBuildGradle,
} = require('expo/config-plugins');

const KOTLIN_METADATA_MARKER = 'menta.kotlin.metadataCompatibility';
const KOTLIN_METADATA_COMPATIBILITY = `
// ${KOTLIN_METADATA_MARKER}
subprojects { subproject ->
    subproject.tasks.matching {
        it.name.startsWith("compile") && it.name.endsWith("Kotlin")
    }.configureEach { task ->
        if (task.hasProperty("kotlinOptions")) {
            def current = task.kotlinOptions.freeCompilerArgs ?: []
            if (!current.contains("-Xskip-metadata-version-check")) {
                task.kotlinOptions.freeCompilerArgs = current + ["-Xskip-metadata-version-check"]
            }
        }
    }
}
`;

function applyKotlinMetadataCompatibility(contents) {
  if (contents.includes(KOTLIN_METADATA_MARKER)) {
    return contents;
  }

  return `${contents.trimEnd()}\n${KOTLIN_METADATA_COMPATIBILITY}`;
}

function withAndroidKotlinMetadata(config) {
  return withProjectBuildGradle(config, gradleConfig => {
    if (gradleConfig.modResults.language === 'groovy') {
      gradleConfig.modResults.contents = applyKotlinMetadataCompatibility(
        gradleConfig.modResults.contents
      );
    }

    return gradleConfig;
  });
}

const plugin = createRunOncePlugin(
  withAndroidKotlinMetadata,
  'with-android-kotlin-metadata',
  '1.0.0'
);

plugin.applyKotlinMetadataCompatibility = applyKotlinMetadataCompatibility;
plugin.KOTLIN_METADATA_MARKER = KOTLIN_METADATA_MARKER;

module.exports = plugin;
