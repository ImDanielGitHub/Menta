import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const checker = join(
  process.cwd(),
  'scripts/check-localization-completeness.mjs'
);

const withFixture = (
  files: Record<string, string>,
  callback: (root: string) => void
) => {
  const root = mkdtempSync(join(tmpdir(), 'menta-localisation-'));
  try {
    for (const [file, source] of Object.entries(files)) {
      const target = join(root, file);
      mkdirSync(join(target, '..'), { recursive: true });
      writeFileSync(target, source);
    }
    callback(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const runChecker = (root: string) => {
  try {
    const stdout = execFileSync(
      process.execPath,
      [checker, '--root', root, '--json'],
      { encoding: 'utf8' }
    );
    return { report: JSON.parse(stdout), exitCode: 0 };
  } catch (error) {
    const failure = error as { status?: number; stdout?: Buffer | string };
    return {
      report: JSON.parse(String(failure.stdout ?? '')),
      exitCode: failure.status ?? 1,
    };
  }
};

describe('localisation completeness checker', () => {
  it('finds direct display copy, feedback copy, dynamic keys and fragments', () => {
    withFixture(
      {
        'app/example.tsx': `
          import { Alert, Text } from 'react-native';
          import { t } from '@/lib/localization';
          export const Example = () => <Text title="Start">Welcome</Text>;
          Alert.alert('Something went wrong', 'Try again');
          t('example.start' + suffix);
          t(exampleKey);
          t('example.missing');
          const copy = t('example.start') + ' now';
          const styles = { title: 'not display copy' };
          console.error('internal log copy');
          logError({ message: 'internal diagnostic copy' });
          const provider = <AppleAuthenticationButton title="provider copy" />;
        `,
        'lib/promise/promise-detail-presentation.ts': `
          export const getSummary = () => 'A promise summary';
        `,
        'lib/localization/en-NZ.ts': `
          export const enNZ = {
            'example.start': 'Start',
            'count.item.one': '{count} item',
            'count.item.other': '{count} items',
          } as const;
        `,
        'lib/localization/catalogues/de-DE.ts': `
          export const deDE = {
            'example.start': 'Starten',
            'count.item.one': '{count} Element',
            'count.item.other': '{count} Elemente',
          } as const;
        `,
      },
      root => {
        const { report, exitCode } = runChecker(root);
        expect(exitCode).toBe(1);
        expect(report.summary.categories['jsx-text']).toBe(1);
        expect(report.summary.categories['jsx-attribute']).toBe(1);
        expect(report.summary.categories['feedback-copy']).toBe(2);
        expect(report.summary.categories['helper-return']).toBe(1);
        expect(report.summary.categories['dynamic-translation-key']).toBe(1);
        expect(report.summary.categories['dynamic-translation-lookup']).toBe(1);
        expect(report.summary.categories['missing-translation-key']).toBe(1);
        expect(report.summary.categories['translated-fragment']).toBe(1);
      }
    );
  });

  it('checks catalogue parity, placeholders, plurals and raw keys', () => {
    withFixture(
      {
        'lib/localization/en-NZ.ts': `
          export const enNZ = {
            'welcome.title': 'Welcome',
            'count.item.one': '{count} item',
            'count.item.other': '{count} items',
          } as const;
        `,
        'lib/localization/catalogues/de-DE.ts': `
          export const deDE = {
            'welcome.title': 'welcome.title',
            'welcome.title': 'Willkommen',
            'count.item.one': '{total} Element',
            'raw.key': 'raw.key',
          } as const;
        `,
      },
      root => {
        const { report, exitCode } = runChecker(root);
        expect(exitCode).toBe(1);
        expect(report.summary.categories['duplicate-catalogue-key']).toBe(1);
        expect(report.summary.categories['catalogue-fallback']).toBe(1);
        expect(report.summary.categories['catalogue-extra-key']).toBe(1);
        expect(report.summary.categories['raw-catalogue-key']).toBe(1);
        expect(report.summary.categories['placeholder-parity']).toBe(1);
        expect(report.summary.categories['plural-parity']).toBe(1);
      }
    );
  });

  it('passes a complete translated fixture with no direct display copy', () => {
    withFixture(
      {
        'app/example.tsx': `
          import { Text } from 'react-native';
          import { useTranslation } from '@/lib/localization';
          export const Example = () => {
            const { t } = useTranslation();
            return <Text accessibilityLabel={t('welcome.title')}>{t('welcome.title')}</Text>;
          };
        `,
        'lib/localization/en-NZ.ts': `
          export const enNZ = {
            'welcome.title': 'Welcome',
            'count.item.one': '{count} item',
            'count.item.other': '{count} items',
          } as const;
        `,
        'lib/localization/catalogues/de-DE.ts': `
          export const deDE = {
            'welcome.title': 'Willkommen',
            'count.item.one': '{count} Element',
            'count.item.other': '{count} Elemente',
          } as const;
        `,
      },
      root => {
        const { report, exitCode } = runChecker(root);
        expect(exitCode).toBe(0);
        expect(report.summary.errors).toBe(0);
        expect(report.summary.findings).toBe(0);
        expect(report.catalogues.parity['de-DE'].missing).toEqual([]);
      }
    );
  });

  it('attributes only imported shared exports to a locale without creating a shared locale', () => {
    withFixture(
      {
        'lib/localization/en-NZ.ts': `
          export const enNZ = {
            'welcome.title': 'Welcome',
            'welcome.detail': 'Welcome detail',
          } as const;
        `,
        'lib/localization/catalogues/shared/german-welcome.ts': `
          export const germanWelcome = {
            'welcome.title': 'Willkommen',
            'welcome.detail': 'Willkommen bei Menta',
          } as const;
          export const unusedAustrianCopy = {
            'welcome.title': 'Servus',
            'unused.extra': 'Must not be attributed',
          } as const;
          export const germanWelcomeOverrides = {
            'welcome.detail': 'Schön, dass du da bist',
          } as const;
        `,
        'lib/localization/catalogues/de-DE.ts': `
          import {
            germanWelcome,
            germanWelcomeOverrides,
          } from '@/lib/localization/catalogues/shared/german-welcome';
          export const deDE = {
            ...germanWelcome,
            ...germanWelcomeOverrides,
          } as const;
        `,
      },
      root => {
        const { report, exitCode } = runChecker(root);
        expect(exitCode).toBe(0);
        expect(report.catalogues.locales).toEqual(['de-DE', 'en-NZ']);
        expect(report.catalogues.parity['de-DE']).toEqual(
          expect.objectContaining({
            keys: 2,
            missing: [],
            extra: [],
          })
        );
        expect(report.catalogues.parity.shared).toBeUndefined();
        expect(report.summary.findings).toBe(0);
      }
    );
  });

  it('still reports duplicate keys inside one imported shared export', () => {
    withFixture(
      {
        'lib/localization/en-NZ.ts': `
          export const enNZ = { 'welcome.title': 'Welcome' } as const;
        `,
        'lib/localization/catalogues/shared/german-welcome.ts': `
          export const germanWelcome = {
            'welcome.title': 'Willkommen',
            'welcome.title': 'Guten Tag',
          } as const;
        `,
        'lib/localization/catalogues/de-DE.ts': `
          import { germanWelcome } from '@/lib/localization/catalogues/shared/german-welcome';
          export const deDE = { ...germanWelcome } as const;
        `,
      },
      root => {
        const { report, exitCode } = runChecker(root);
        expect(exitCode).toBe(1);
        expect(report.catalogues.locales).toEqual(['de-DE', 'en-NZ']);
        expect(report.summary.categories['duplicate-catalogue-key']).toBe(1);
      }
    );
  });

  it('allows only scoped machine tokens, not arbitrary status copy', () => {
    withFixture(
      {
        'lib/events/links.ts': `
          export const event = { status: 'event' };
        `,
        'app/example.tsx': `
          export const example = { status: 'draft' };
        `,
        'lib/localization/en-NZ.ts': `
          export const enNZ = { 'example.title': 'Example' } as const;
        `,
      },
      root => {
        const { report } = runChecker(root);
        const findings = report.findings.filter(
          (finding: { category: string; file: string; text?: string }) =>
            finding.category === 'display-property'
        );
        expect(findings).toHaveLength(1);
        expect(findings[0].file).toContain('app/example.tsx');
        expect(findings[0].text).toBe('draft');
      }
    );
  });

  it('keeps final source-gate machine tokens scoped to their sinks', () => {
    withFixture(
      {
        'app/shop/[id].tsx': `
          export const shop = {
            allowed: { reason: 'module_missing' },
            blocked: { reason: 'insufficient-momenta' },
            rejected: { reason: 'not-listed' },
          };
        `,
        'app/groups/[id].tsx': `
          export const group = {
            permission: { reason: 'permission' },
            validation: { reason: 'validation' },
            rejected: { reason: 'not-listed' },
          };
        `,
        'app/join-group.tsx': `
          export const join = {
            funding: { reason: 'insufficient-momenta' },
            quota: { reason: 'quota' },
            rejected: { reason: 'not-listed' },
          };
        `,
        'components/ui/ConfirmActionButton.tsx': `
          export const confirm = {
            funding: { reason: 'insufficient-momenta' },
            rejected: { reason: 'not-listed' },
          };
        `,
        'lib/motion/event-receipt-haptics.ts': `
          export const receipt = {
            permission: { reason: 'permission' },
            rejected: { reason: 'not-listed' },
          };
        `,
        'lib/paywall/revenuecat.ts': `
          import { translate } from '@/lib/localization';
          showGlobalToast(translate('en-NZ', 'example.title'), 'error');
          showGlobalToast(translate('en-NZ', 'example.title'), 'info');
          showGlobalToast(translate('en-NZ', 'example.title'), 'warning');
        `,
        'store/auth-store.ts': `
          import { translate } from '@/lib/localization';
          showGlobalToast(translate('en-NZ', 'example.title'), 'success');
          showGlobalToast(translate('en-NZ', 'example.title'), 'error');
          showGlobalToast(translate('en-NZ', 'example.title'), 'notice');
        `,
        'store/challenge-store.ts': `
          export const challenge = {
            allowed: { status: 'failed' },
            rejected: { status: 'unknown' },
          };
        `,
        'store/momenta-store.ts': `
          export const rewards = [
            { reason: 'unauthenticated' },
            { reason: 'daily-limit' },
            { reason: 'cooldown' },
            { reason: 'unknown' },
            { reason: 'not-a-machine-token' },
          ];
        `,
        'lib/localization/en-NZ.ts': `
          export const enNZ = { 'example.title': 'Example' } as const;
        `,
      },
      root => {
        const { report } = runChecker(root);
        const findings = report.findings.filter(
          (finding: { category: string; file: string; text?: string }) =>
            finding.category === 'display-property' ||
            finding.category === 'feedback-copy'
        );
        expect(findings).toHaveLength(9);
        expect(
          findings.map((finding: { text?: string }) => finding.text)
        ).toEqual(
          expect.arrayContaining([
            'not-listed',
            'warning',
            'notice',
            'unknown',
            'not-listed',
            'not-listed',
            'not-listed',
            'not-listed',
            'not-a-machine-token',
          ])
        );
      }
    );
  });

  it('does not suppress ordinary copy because a parent component mentions a provider', () => {
    withFixture(
      {
        'app/onboarding.tsx': `
          import { Text, View } from 'react-native';
          export const Onboarding = () => (
            <View>
              <Text>Menta</Text>
              <Text title="Create account">Create account</Text>
            </View>
          );
        `,
        'lib/localization/en-NZ.ts': `
          export const enNZ = { 'onboarding.title': 'Create account' } as const;
        `,
      },
      root => {
        const { report, exitCode } = runChecker(root);
        expect(exitCode).toBe(1);
        expect(
          report.findings.filter(
            (finding: { category: string; text?: string }) =>
              finding.category === 'jsx-text' &&
              finding.text === 'Create account'
          )
        ).toHaveLength(1);
        expect(
          report.findings.filter(
            (finding: { category: string; text?: string }) =>
              finding.category === 'jsx-attribute' &&
              finding.text === 'Create account'
          )
        ).toHaveLength(1);
      }
    );
  });

  it('finds copy in arrays, ternaries, copy-bearing state setters, and dynamic descriptions', () => {
    withFixture(
      {
        'app/onboarding.tsx': `
          import { useState } from 'react';
          import { t } from '@/lib/localization';
          const examples = ['Walk after work', 'Read before bed'];
          const proofLabel = (kind: string) => kind === 'photo' ? 'Photo proof' : 'Text proof';
          export const Example = () => {
            const [error, setFinishError] = useState<string | null>(null);
            const save = () => {
              setFinishError('Could not save your promise.');
              const payload = { verificationDescription: \`Add a clear proof: \${examples[0]}\` };
              return payload;
            };
            return <div title="Promise setup">{proofLabel('photo')}</div>;
          };
        `,
        'lib/localization/en-NZ.ts': `
          export const enNZ = {
            'fullAuth.source.example.walk': 'Walk after work',
            'fullAuth.source.example.read': 'Read before bed',
            'fullAuth.source.proof.photo': 'Photo proof',
            'fullAuth.source.proof.note': 'Text proof',
            'fullAuth.source.error.save': 'Could not save your promise.',
            'fullAuth.source.description': 'Add a clear proof: {example}',
            'fullAuth.source.title': 'Promise setup',
          } as const;
        `,
        'lib/localization/catalogues/de-DE.ts': `
          export const deDE = {
            'fullAuth.source.example.walk': 'Nach der Arbeit spazieren gehen',
            'fullAuth.source.example.read': 'Vor dem Schlafengehen lesen',
            'fullAuth.source.proof.photo': 'Fotobeweis',
            'fullAuth.source.proof.note': 'Textnachweis',
            'fullAuth.source.error.save': 'Versprechen konnte nicht gespeichert werden.',
            'fullAuth.source.description': 'Einen klaren Nachweis hinzufügen: {example}',
            'fullAuth.source.title': 'Versprechen einrichten',
          } as const;
        `,
      },
      root => {
        const { report } = runChecker(root);
        const sourceFindings = report.findings.filter(
          (finding: { category: string }) =>
            !finding.category.startsWith('catalogue') &&
            !finding.category.startsWith('plural') &&
            !finding.category.startsWith('placeholder') &&
            !finding.category.startsWith('duplicate')
        );
        expect(
          sourceFindings.map(
            (finding: { category: string }) => finding.category
          )
        ).toEqual(
          expect.arrayContaining([
            'copy-variable',
            'helper-return',
            'customer-copy',
            'jsx-attribute',
          ])
        );
      }
    );
  });

  it('keeps German dynamic source strict while exposing other locale gaps', () => {
    withFixture(
      {
        'lib/localization/en-NZ.ts': `
          export const enNZ = {
            'fullAuth.source.example': 'Example',
            'welcome.title': 'Welcome',
          } as const;
        `,
        'lib/localization/catalogues/de-DE.ts': `
          export const deDE = { 'welcome.title': 'Willkommen' } as const;
        `,
        'lib/localization/catalogues/es-ES.ts': `
          export const esES = { 'welcome.title': 'Bienvenido' } as const;
        `,
      },
      root => {
        const { report } = runChecker(root);
        const dynamicGaps = report.findings.filter(
          (finding: { category: string; key?: string }) =>
            finding.category === 'catalogue-fallback' &&
            finding.key === 'fullAuth.source.example'
        );
        expect(dynamicGaps).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              file: 'lib/localization/catalogues/de-DE.ts',
              severity: 'error',
            }),
            expect.objectContaining({
              file: 'lib/localization/catalogues/es-ES.ts',
              severity: 'warning',
            }),
          ])
        );
      }
    );
  });

  it('applies the same regional fallback policy to dynamic-source plurals', () => {
    withFixture(
      {
        'lib/localization/en-NZ.ts': `
          export const enNZ = {
            'groups.source.example.count.one': '{count} person',
            'groups.source.example.count.other': '{count} people',
          } as const;
        `,
        'lib/localization/catalogues/de-DE.ts': `export const deDE = {} as const;`,
        'lib/localization/catalogues/es-ES.ts': `export const esES = {} as const;`,
      },
      root => {
        const { report } = runChecker(root);
        const pluralGaps = report.findings.filter(
          (finding: { category: string; key?: string }) =>
            finding.category === 'plural-parity' &&
            finding.key === 'groups.source.example.count'
        );
        expect(pluralGaps).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              file: 'lib/localization/catalogues/de-DE.ts',
              severity: 'error',
            }),
            expect.objectContaining({
              file: 'lib/localization/catalogues/es-ES.ts',
              severity: 'warning',
            }),
          ])
        );
      }
    );
  });

  it('checks aliased translation helpers and toast or action-message sinks', () => {
    withFixture(
      {
        'app/example.tsx': `
          import { showToast } from '@/components/ui/Toast';
          import { setActionMessage } from '@/state';
          import { translate as copy } from '@/lib/localization';
          export const Example = () => {
            setActionMessage({ text: 'Delete failed.', type: 'error' });
            showToast.success('Saved', 'The promise was saved.');
            return copy('missing.key');
          };
        `,
        'lib/localization/en-NZ.ts': `
          export const enNZ = { 'example.title': 'Example' } as const;
        `,
      },
      root => {
        const { report } = runChecker(root);
        expect(
          report.findings.map(
            (finding: { category: string }) => finding.category
          )
        ).toEqual(expect.arrayContaining(['customer-copy', 'feedback-copy']));
      }
    );
  });
});
