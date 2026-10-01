import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const ignored = new Set([
  '.git',
  'node_modules',
  '.expo',
  'Pods',
  'build',
  'coverage',
  '.temp',
  '.branches',
]);
const forbiddenRoots = [
  '.codex',
  '.agents',
  '.argent',
  '.cursor',
  '.maestro',
  'paper-screens',
  'codemagic.yaml',
  'sentry.properties',
  'credentials.json',
];
for (const name of forbiddenRoots) {
  if (fs.existsSync(path.join(root, name)))
    fail(`Private operational path present: ${name}`);
}
for (const required of [
  'LICENSE',
  'README.md',
  'SOURCE.md',
  'SECURITY.md',
  'THIRD_PARTY_NOTICES.md',
  '.env.example',
  '.env.server.example',
  'supabase/seed.sql',
  'assets/fonts/OFL-GoogleSans.txt',
]) {
  if (!fs.existsSync(required))
    fail(`Required public file missing: ${required}`);
}
const manifest = JSON.parse(fs.readFileSync('source-manifest.json', 'utf8'));
const publicOnlyFiles = new Set([
  '.env.server.example',
  '.github/workflows/validate.yml',
  '.gitignore',
  '.gitleaks.toml',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'README.md',
  'SECURITY.md',
  'SOURCE.md',
  'THIRD_PARTY_NOTICES.md',
  'assets/fonts/OFL-GoogleSans.txt',
  'docs/JUDGING.md',
  'docs/SETUP.md',
  'scripts/check-public-export.mjs',
  'source-manifest.json',
  'supabase/config.toml',
  'supabase/migrations/20260910000000_public_baseline.sql',
  'supabase/migrations/20260912153318_cache_profile_timezone_names.sql',
  'supabase/migrations/20260923120000_expire_invites_after_creator_deletion.sql',
  'supabase/migrations/20260924215659_profile_month_summary.sql',
  'supabase/migrations/20260926151119_weekday_check_in_schedules.sql',
  'supabase/seed.sql',
]);
const selectedFiles = new Set(manifest.sourceFiles.map(entry => entry.path));
// Validate Git's publication boundary before ignoring local install/build output.
// Reading the index also catches newly staged files before they are committed.
const tracked = execFileSync('git', ['ls-files', '--stage', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);
for (const record of tracked) {
  const [metadata, relative] = record.split('\t');
  const [mode, , stage] = metadata.split(' ');
  if (!['100644', '100755'].includes(mode) || stage !== '0')
    fail(`Tracked symlink, special file or unresolved entry: ${relative}`);
  if (
    relative
      .split('/')
      .some(part => ignored.has(part) || part.startsWith('dist-'))
  )
    fail(`Tracked dependency or generated output: ${relative}`);
  if (!selectedFiles.has(relative) && !publicOnlyFiles.has(relative))
    fail(`Unlisted tracked public file: ${relative}`);
}
for (const entry of manifest.sourceFiles) {
  if (!entry.publicSha256 || !/^[a-f0-9]{64}$/.test(entry.publicSha256)) {
    fail(`Manifest public hash missing or invalid: ${entry.path}`);
    continue;
  }
  const selected = path.resolve(root, entry.path);
  if (!selected.startsWith(root + path.sep) || !fs.existsSync(selected)) {
    fail(`Manifest source missing or outside export: ${entry.path}`);
    continue;
  }
  const parts = path.relative(root, selected).split(path.sep);
  if (
    parts.some((_, index) =>
      fs
        .lstatSync(path.join(root, ...parts.slice(0, index + 1)))
        .isSymbolicLink()
    )
  ) {
    fail(`Manifest source traverses a symlink: ${entry.path}`);
    continue;
  }
  const digest = createHash('sha256')
    .update(fs.readFileSync(selected))
    .digest('hex');
  if (digest !== entry.publicSha256)
    fail(`Public source hash changed: ${entry.path}`);
}
const expo = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
if (
  expo.owner ||
  expo.extra?.eas?.projectId ||
  expo.updates?.url ||
  expo.updates?.enabled !== false
)
  fail('Production Expo binding or OTA enabled');
for (const key of [
  'supabaseUrl',
  'supabaseAnonKey',
  'sentryDsn',
  'revenuecatIosKey',
  'revenuecatAndroidKey',
  'googleWebClientId',
  'googleIosClientId',
  'googleAndroidClientId',
]) {
  if (expo.extra?.[key]) fail(`Provider value embedded in app config: ${key}`);
}
if (expo.ios.appleTeamId) fail('Apple signing team embedded in app config');
if (
  expo.ios.bundleIdentifier !== 'org.example.menta' ||
  expo.android.package !== 'org.example.menta'
)
  fail('Portable bundle IDs changed; review required');
const storeLinkFiles = [
  'lib/app-update-policy.ts',
  'lib/legacy-app-update-policy.ts',
  'lib/store-review.ts',
];
for (const name of storeLinkFiles) {
  const content = fs.readFileSync(name, 'utf8');
  if (/6747362646|com\.anekedigitalapps\.lockedinpro/.test(content))
    fail(`Hosted store link in public app: ${name}`);
}
for (const name of [
  'ios/LockedInPro/LockedInPro.entitlements',
  'ios/ExpoWidgetsTarget/ExpoWidgetsTarget.entitlements',
  'plugins/with-menta-streak-widget.js',
]) {
  const content = fs.readFileSync(name, 'utf8');
  if (
    !content.includes('group.org.example.menta.widgets') ||
    content.includes('group.com.anekedigitalapps.lockedin.widgets')
  )
    fail(`Widget App Group is not portable: ${name}`);
}
if (fs.existsSync('supabase/functions/e2e-test-helper'))
  fail('Privileged E2E helper must not ship in public edition');
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name.startsWith('dist-')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.isFile()) {
      fail(`Unexpected symlink or special file: ${path.relative(root, full)}`);
      continue;
    }
    const relative = path.relative(root, full);
    if (entry.name.startsWith('.env') && !entry.name.endsWith('.example'))
      continue;
    if (
      !/\.(?:[cm]?js|jsx|ts|tsx|json|sql|ya?ml|toml|md|plist|pbxproj|properties|example)$/.test(
        entry.name
      )
    )
      continue;
    const content = fs.readFileSync(full, 'utf8');
    if (relative === 'scripts/check-public-export.mjs') continue;
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]{64,}-----END/.test(
        content
      ) ||
      /\bsbp_[a-f0-9]{30,}\b/.test(content) ||
      /\b(?:ghp|gho|ghs)_[A-Za-z0-9]{30,}\b/.test(content)
    )
      fail(`Credential-shaped material: ${relative}`);
    for (const token of content.match(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
    ) ?? []) {
      try {
        const claims = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64url').toString()
        );
        if (claims.role === 'service_role' || claims.ref || claims.session_id)
          fail(`Embedded project/session JWT: ${relative}`);
      } catch {
        /* Fixture strings are also reviewed by the separate secret scanner. */
      }
    }
    if (/\/Users\/dananeke|\/Volumes\/MAC_OS_EXTENDED/.test(content))
      fail(`Private machine path: ${relative}`);
    if (/testflight-feedback-to-issues|sync-testflight-feedback/.test(content))
      fail(`Private tester-feedback pipeline: ${relative}`);
  }
}
walk(root);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  'Public export boundary passed: portable config, required licences, and no private operational paths or embedded project credentials.'
);
