import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { PromiseReviewerStep } from '@/components/challenge/create/PromiseFlow';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';

const renderReviewer = (equippedThemeSku?: string) =>
  render(
    <ThemeProvider equippedThemeSku={equippedThemeSku}>
      <PromiseReviewerStep
        groups={[]}
        value={{ kind: 'self' }}
        onChange={jest.fn()}
      />
    </ThemeProvider>
  );

const selectedBorder = () => {
  const row = screen.getByTestId('create-promise-reviewer-self');
  return StyleSheet.flatten(row.props.style)?.borderColor;
};

describe('PromiseFlow themes', () => {
  it('keeps the designed violet selection without an equipped theme', () => {
    renderReviewer();
    expect(selectedBorder()).toBe(mentaColors.action);
  });

  it('uses the equipped theme for the selected choice', () => {
    renderReviewer('profile_theme_ember');
    expect(selectedBorder()).toBe('rgba(231, 168, 109, 0.55)');
  });
});
