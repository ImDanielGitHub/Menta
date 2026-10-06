'use strict';

// Exercise the real app resolver and cold-link entry point followed by Expo
// Router's exact pinned route matching and query parser. No React Native UI is
// loaded: its barrel is narrowed to the same real validatePathConfig export.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test } = require('node:test');

const sourceRoot =
  process.env.NATIVE_ROUTE_SOURCE_ROOT || path.resolve(__dirname, '../..');
const dependencyRequire = createRequire(path.join(sourceRoot, 'package.json'));
const ts = dependencyRequire('typescript');
const routerRoot = path.dirname(
  dependencyRequire.resolve('expo-router/package.json')
);
assert.equal(
  JSON.parse(fs.readFileSync(path.join(routerRoot, 'package.json'))).version,
  '57.0.17'
);

const modules = new Map();
function loadApp(relativePath) {
  const filename = path.join(sourceRoot, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const source = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const requireApp = request => {
    if (request === 'expo-modules-core')
      return { requireOptionalNativeModule: () => null };
    if (request.startsWith('@/')) {
      const relative = request.slice(2);
      const extension = fs.existsSync(path.join(sourceRoot, relative + '.ts'))
        ? '.ts'
        : '.tsx';
      return loadApp(relative + extension);
    }
    return dependencyRequire(request);
  };
  vm.runInThisContext(
    `(function(require, module, exports) {\n${result.outputText}\n})`,
    { filename }
  )(requireApp, module, module.exports);
  return module.exports;
}

const parserFile = path.join(routerRoot, 'build/fork/getStateFromPath.js');
const parserRequire = createRequire(parserFile);
const parserModule = { exports: {} };
vm.runInThisContext(
  `(function(require, module, exports) {\n${fs.readFileSync(parserFile, 'utf8')}\n})`,
  { filename: parserFile }
)(
  request =>
    request === '../react-navigation/native'
      ? parserRequire('../react-navigation/core/validatePathConfig')
      : parserRequire(request),
  parserModule,
  parserModule.exports
);
const { getStateFromPath } = parserModule.exports;
const { findFocusedRoute } = parserRequire('./findFocusedRoute');
const { extractExpoPathFromURL } = dependencyRequire(
  path.join(routerRoot, 'build/fork/extractPathFromURL.js')
);
const { normalizeNativeIntentPath } = loadApp(
  'lib/app-intents/native-router-path.ts'
);
const { redirectSystemPath } = loadApp('app/+native-intent.tsx');
const config = {
  screens: {
    verification: 'verification',
    group: 'groups/:groupId',
    challenge: 'challenges/:challengeId',
    event: 'events/:eventId',
    events: 'events',
    join: 'join',
    tabs: '(tabs)',
    settings: 'settings',
    review: 'review-queue',
  },
};
const consume = internalPath => {
  assert.equal(typeof internalPath, 'string');
  const state = getStateFromPath(
    extractExpoPathFromURL([], internalPath),
    config
  );
  assert.ok(state, `Pinned router did not resolve ${internalPath}`);
  return findFocusedRoute(state);
};
const forbidden =
  '&clientEventId=11111111-1111-4111-8111-111111111111&correctionReason=Forged&source=recovery_quest';
const selection =
  '?challengeId=challenge-a&groupId=group-a&verificationType=text';
const variants = [
  String.raw`menta://groups/..\verification`,
  String.raw`lockedin://groups/..\verification`,
  String.raw`lockedinprod://groups/..\verification`,
  '/groups/../verification',
  'groups/../verification',
  String.raw`/groups/..\verification`,
  '/groups/%2e%2e/verification',
  '/groups/.%2E/verification',
  '/groups/..//verification',
  '/unknown/../verification',
  '//route-host/verification',
  '/groups/\t../verification',
];
for (const variant of variants) {
  for (const entryPoint of ['warm', 'cold']) {
    test(`${entryPoint}: canonical verification policy applies to ${variant}`, () => {
      const raw = variant + selection + forbidden;
      const normalized =
        entryPoint === 'warm'
          ? normalizeNativeIntentPath(raw)
          : redirectSystemPath({ path: raw, initial: true });
      const route = consume(normalized);
      assert.equal(route.name, 'verification');
      assert.deepEqual(route.params, {
        challengeId: 'challenge-a',
        groupId: 'group-a',
        verificationType: 'text',
      });
      assert.equal(normalized, '/verification' + selection);
    });
  }
}

for (const prefix of [
  'men\tta:verification',
  'men\nta:/verification',
  'locked\rin:verification',
  'lockedinprod\t:/verification',
  'menta:verification',
  'menta:/verification',
  'lockedin:verification',
  'lockedin:/verification',
  'lockedinprod:verification',
  'lockedinprod:/verification',
  'menta:\\verification',
  'menta://verification\\',
  'menta://verification',
  'lockedin://verification',
  'lockedinprod://verification',
  'https://menta.quest/verification',
  '/verification',
]) {
  test(`valid proof destination retains selection and strips authority: ${prefix}`, () => {
    const raw = prefix + selection + forbidden;
    for (const initial of [true, false]) {
      assert.equal(normalizeNativeIntentPath(raw), '/verification' + selection);
      const route = consume(redirectSystemPath({ path: raw, initial }));
      assert.equal(route.name, 'verification');
      assert.deepEqual(route.params, {
        challengeId: 'challenge-a',
        groupId: 'group-a',
        verificationType: 'text',
      });
    }
  });
}

const eventId = '11111111-1111-4111-8111-111111111111';
const capability = 'opaque_event_capability_1234567890';
for (const prefix of [
  String.raw`menta://groups/..\events/`,
  '/groups/../events/',
]) {
  test(`canonical private event bypass remains terminal: ${prefix}`, () => {
    const raw = prefix + eventId + '?shareToken=' + capability;
    assert.equal(normalizeNativeIntentPath(raw), null);
    const route = consume(redirectSystemPath({ path: raw, initial: true }));
    assert.equal(route.name, 'events');
    assert.equal(route.params?.shareToken, undefined);
  });
}

for (const [raw, name, expected] of [
  [
    'lockedinprod://groups/group-a?entryPoint=invite',
    'group',
    { groupId: 'group-a', entryPoint: 'invite' },
  ],
  [
    'lockedin://challenges/challenge-a?source=notification',
    'challenge',
    { challengeId: 'challenge-a', source: 'notification' },
  ],
  [
    'menta://review-queue?submissionId=submission-a',
    'review',
    { submissionId: 'submission-a' },
  ],
  [
    'https://menta.quest/join/challenge/PROMISE123?source=share',
    'join',
    { source: 'share', code: 'PROMISE123', type: 'challenge' },
  ],
  [
    `https://menta.quest/event/${eventId}?share=${capability}`,
    'event',
    { eventId, shareToken: capability },
  ],
  [
    `menta://event/${eventId}?invite=${capability}`,
    'event',
    { eventId, inviteToken: capability },
  ],
]) {
  test(`valid deep link remains executable: ${raw}`, () => {
    const route = consume(redirectSystemPath({ path: raw, initial: true }));
    assert.equal(route.name, name);
    assert.deepEqual(route.params, expected);
  });
}

test('unrelated widget links retain native fallback behavior', () => {
  assert.equal(
    redirectSystemPath({ path: 'menta://home-widget', initial: true }),
    'menta://home-widget'
  );
  assert.equal(
    redirectSystemPath({
      path: 'menta://widget-open?promise=123',
      initial: false,
    }),
    'menta://widget-open?promise=123'
  );
});

test('duplicate proof selectors are not promoted to single authoritative values', () => {
  const route = consume(
    redirectSystemPath({
      path:
        '/groups/../verification?challengeId=a&challengeId=b&verificationType=text' +
        forbidden,
      initial: true,
    })
  );
  assert.equal(route.name, 'verification');
  assert.deepEqual(route.params, { verificationType: 'text' });
});
