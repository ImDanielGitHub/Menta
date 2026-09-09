import fs from 'node:fs';
import path from 'node:path';

import {
  mentaColors,
  mentaBreakpoints,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { mentaFontAssets, mentaFonts } from '@/lib/menta-fonts';

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('canonical Menta design-system contract', () => {
  it('freezes the governing live Paper roles', () => {
    expect(mentaColors).toMatchObject({
      canvas: '#080909',
      surface: '#101111',
      raised: '#181919',
      border: '#2B2C2C',
      borderPaper: '#D8D5CB',
      skeleton: '#1D1E1E',
      skeletonHighlight: '#292A2A',
      scrim: 'rgba(8, 9, 9, 0.82)',
      paper: '#F8F7F1',
      action: '#B88CFF',
      actionPressed: '#A78BFA',
      success: '#8DE7B7',
      warning: '#F0C15C',
      danger: '#FF6B7A',
    });
    expect(Object.values(mentaSpacing)).toEqual([
      4, 8, 12, 16, 20, 24, 32, 40, 48,
    ]);
    expect(mentaRadii).toEqual({
      small: 8,
      medium: 12,
      large: 16,
      round: 999,
    });
    expect(mentaLayout).toMatchObject({
      readingMeasure: 342,
      minimumTouchTarget: 44,
      screenInset: 24,
    });
    // A screen fills the widest supported phone rather than shrinking to the
    // prose reading measure, so 430pt devices keep 24pt gutters.
    expect(mentaLayout.taskLane).toBe(
      mentaLayout.phoneFrameMax - mentaLayout.screenInset * 2
    );
    expect(mentaBreakpoints).toEqual({
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
    });
  });

  it('loads exact Inter and Newsreader roles from one root contract', () => {
    expect(Object.keys(mentaFontAssets)).toEqual(
      expect.arrayContaining([
        'Inter_400Regular',
        'Inter_500Medium',
        'Inter_600SemiBold',
        'Inter_700Bold',
        'Newsreader_400Regular',
        'Newsreader_500Medium',
        'Newsreader_600SemiBold',
      ])
    );
    expect(mentaFonts.inter.medium).toBe('Inter_500Medium');
    expect(mentaFonts.newsreader.medium).toBe('Newsreader_500Medium');

    const rootLayout = readSource('app/_layout.tsx');
    expect(rootLayout).toContain('SplashScreen.preventAutoHideAsync()');
    expect(rootLayout).toContain('useMentaFonts()');
    expect(rootLayout).toContain('SplashScreen.hideAsync()');
    expect(rootLayout).toContain(
      'if (!fontsLoaded && !fontError) return null;'
    );
  });

  it('maps Paper typography roles to the loaded font families', () => {
    expect(mentaTypography).toMatchObject({
      label: { fontFamily: mentaFonts.inter.semibold },
      caption: { fontFamily: mentaFonts.inter.regular },
      body: { fontFamily: mentaFonts.inter.regular },
      lead: { fontFamily: mentaFonts.inter.regular },
      control: { fontFamily: mentaFonts.inter.semibold },
      title: { fontFamily: mentaFonts.newsreader.medium },
      heading: { fontFamily: mentaFonts.newsreader.medium },
      display: { fontFamily: mentaFonts.newsreader.semibold },
    });
  });

  it('keeps a readable body size and a strictly rising role hierarchy', () => {
    // Body copy is the size the whole app is read at. Anything below 16pt made
    // guidance on a 430pt phone feel like fine print in TestFlight 1.8 (117).
    expect(mentaTypography.body.fontSize).toBeGreaterThanOrEqual(16);

    const risingRoles = [
      mentaTypography.caption,
      mentaTypography.bodySmall,
      mentaTypography.body,
      mentaTypography.lead,
      mentaTypography.title,
      mentaTypography.heading,
      mentaTypography.display,
    ];

    for (let index = 1; index < risingRoles.length; index += 1) {
      expect(risingRoles[index].fontSize).toBeGreaterThan(
        risingRoles[index - 1].fontSize
      );
    }

    // A control label must never read as ordinary body copy inside a pill.
    expect(mentaTypography.control.fontSize).toBeGreaterThan(
      mentaTypography.body.fontSize
    );

    // Every role needs leading, and serif display sizes need proportionally more
    // room than the tight 1.1 ratio that made two-line headings feel cramped.
    for (const role of Object.values(mentaTypography)) {
      expect(role.lineHeight / role.fontSize).toBeGreaterThanOrEqual(1.1);
    }
  });

  it('keeps repeated product surfaces off route-local font loaders', () => {
    for (const relativePath of [
      'app/onboarding.tsx',
      'components/onboarding/PaperAuthSurface.tsx',
      'components/loop/TodayStateCard.tsx',
      'app/momenta.tsx',
      'app/create-group.tsx',
      'app/group-invite.tsx',
      'components/creation/CreateHubModal.tsx',
    ]) {
      const source = readSource(relativePath);
      expect(source).not.toContain("from 'expo-font'");
      expect(source).not.toContain("from '@expo-google-fonts/");
    }
  });
});
