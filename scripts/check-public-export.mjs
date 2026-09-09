import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const ignored = new Set(['.git', 'node_modules', '.expo', 'Pods', 'build', 'coverage', '.temp', '.branches']);
const forbiddenRoots = ['.codex', '.agents', '.argent', '.cursor', '.maestro', 'paper-screens', 'codemagic.yaml', 'sentry.properties', 'credentials.json'];
for (const name of forbiddenRoots) {
  if (fs.existsSync(path.join(root, name))) fail(`Private operational path present: ${name}`);
}
for (const required of ['LICENSE', 'README.md', 'SOURCE.md', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md', '.env.example', '.env.server.example', 'supabase/seed.sql', 'assets/fonts/OFL-GoogleSans.txt']) {
  if (!fs.existsSync(required)) fail(`Required public file missing: ${required}`);
}
const expo = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
if (expo.owner || expo.extra?.eas?.projectId || expo.updates?.url || expo.updates?.enabled !== false) fail('Production Expo binding or OTA enabled');
for (const key of ['supabaseUrl', 'supabaseAnonKey', 'sentryDsn', 'revenuecatIosKey', 'revenuecatAndroidKey', 'googleWebClientId', 'googleIosClientId', 'googleAndroidClientId']) {
  if (expo.extra?.[key]) fail(`Provider value embedded in app config: ${key}`);
}
if (expo.ios.appleTeamId) fail('Apple signing team embedded in app config');
if (expo.ios.bundleIdentifier !== 'org.example.menta' || expo.android.package !== 'org.example.menta') fail('Portable bundle IDs changed; review required');
if (fs.existsSync('supabase/functions/e2e-test-helper')) fail('Privileged E2E helper must not ship in public edition');
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name.startsWith('dist-')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!entry.isFile()) { fail(`Unexpected symlink or special file: ${path.relative(root, full)}`); continue; }
    const relative = path.relative(root, full);
    if (entry.name.startsWith('.env') && !entry.name.endsWith('.example')) continue;
    if (!/\.(?:[cm]?js|jsx|ts|tsx|json|sql|ya?ml|toml|md|plist|pbxproj|properties|example)$/.test(entry.name)) continue;
    const content = fs.readFileSync(full, 'utf8');
    if (relative === 'scripts/check-public-export.mjs') continue;
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]{64,}-----END/.test(content) || /\bsbp_[a-f0-9]{30,}\b/.test(content) || /\b(?:ghp|gho|ghs)_[A-Za-z0-9]{30,}\b/.test(content)) fail(`Credential-shaped material: ${relative}`);
    for (const token of content.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []) {
      try {
        const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
        if (claims.role === 'service_role' || claims.ref || claims.session_id) fail(`Embedded project/session JWT: ${relative}`);
      } catch { /* Fixture strings are also reviewed by the separate secret scanner. */ }
    }
    if (/\/Users\/dananeke|\/Volumes\/MAC_OS_EXTENDED/.test(content)) fail(`Private machine path: ${relative}`);
    if (/testflight-feedback-to-issues|sync-testflight-feedback/.test(content)) fail(`Private tester-feedback pipeline: ${relative}`);
  }
}
walk(root);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Public export boundary passed: portable config, required licences, and no private operational paths or embedded project credentials.');
