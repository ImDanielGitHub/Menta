/* eslint-disable @typescript-eslint/no-require-imports */
const {
  applyKotlinMetadataCompatibility,
  KOTLIN_METADATA_MARKER,
} = require('../with-android-kotlin-metadata');

describe('Android Kotlin metadata compatibility', () => {
  it('lets Expo 56 compile dependencies that publish Kotlin 2.3 metadata', () => {
    const buildGradle = 'allprojects {\n  repositories { google() }\n}\n';
    const compatible = applyKotlinMetadataCompatibility(buildGradle);

    expect(compatible).toContain(KOTLIN_METADATA_MARKER);
    expect(compatible).toContain('it.name.endsWith("Kotlin")');
    expect(compatible).toContain('-Xskip-metadata-version-check');
    expect(applyKotlinMetadataCompatibility(compatible)).toBe(compatible);
  });
});
