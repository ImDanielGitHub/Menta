/** @jest-environment node */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

it('keeps real SDK logout persistence, scope, refresh and listener-lock contracts', () => {
  // An ordinary Node process gives the real SDK fetch primitives without the
  // React Native Jest transport mocks. Every transport in the fixture is stubbed.
  const output = execFileSync(
    process.execPath,
    [path.join(__dirname, 'fixtures/sdk-logout-runtime.cjs')],
    { encoding: 'utf8', timeout: 30000 }
  );
  expect(JSON.parse(output).passed).toHaveLength(8);
});
