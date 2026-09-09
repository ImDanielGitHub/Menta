import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const readSource = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('App Store screenshot regeneration contract', () => {
  const generator = readSource('scripts/app-store/generate-screenshots.py');

  it('keeps stale captures and generated composites out of Git', () => {
    const tracked = execFileSync(
      'git',
      [
        'ls-files',
        'assets/app-store/screenshots/source',
        'assets/app-store/screenshots/generated',
      ],
      { encoding: 'utf8' }
    )
      .trim()
      .split('\n')
      .filter(Boolean);

    expect(tracked).toEqual([]);

    const ignore = readSource('.gitignore');
    expect(ignore).toContain('assets/app-store/screenshots/source/');
    expect(ignore).toContain('assets/app-store/screenshots/generated/');
  });

  it('requires real current-release captures before generating', () => {
    expect(generator).toContain(
      'Current-release simulator captures are required before generation'
    );
    expect(generator).toContain('status: str = "capture-required"');
    expect(generator).toContain(
      'upload_eligible": shot.status == "final-candidate"'
    );
    expect(generator).toContain('source_sha256');
    expect(generator).toContain('hashlib.sha256(source_path.read_bytes())');
  });

  it('freezes the current marketing journey and Apple canvas contract', () => {
    expect(generator).toContain('CANVAS = (1290, 2796)');
    expect(generator).toContain('BLACK = (8, 9, 9, 255)');
    expect(generator).toContain('PURPLE = (184, 140, 255, 255)');
    expect(generator).toContain('FRAME_EDGE = (43, 44, 44, 255)');

    for (const source of [
      '01-today.png',
      '02-create-hub.png',
      '03-create-group-window.png',
      '04-groups.png',
      '05-review-queue.png',
      '06-momenta-shop.png',
    ]) {
      expect(generator).toContain(`source="${source}"`);
    }
  });

  it('uses the loaded product font packages, not system approximations', () => {
    expect(generator).toContain('@expo-google-fonts/newsreader');
    expect(generator).toContain('Newsreader_600SemiBold.ttf');
    expect(generator).toContain('@expo-google-fonts/inter');
    expect(generator).toContain('Inter_400Regular.ttf');
    expect(generator).toContain('Inter_600SemiBold.ttf');
  });
});
