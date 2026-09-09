import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ThemeProvider } from '@/constants/ThemeContext';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppListRow } from '@/components/ui/AppShell';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ModalCard } from '@/components/ui/modal/ModalCard';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const renderWithEmber = (children: React.ReactNode) =>
  render(
    <ThemeProvider equippedThemeSku="profile_theme_ember">
      {children}
    </ThemeProvider>
  );

describe('canonical themed surfaces', () => {
  it('uses the equipped theme for content cards', () => {
    const { getByTestId } = renderWithEmber(
      <AppCard variant="content" testID="content-card">
        <Text>Content</Text>
      </AppCard>
    );

    expect(
      StyleSheet.flatten(getByTestId('content-card').props.style)
        .backgroundColor
    ).toBe('#17120F');
  });

  it('keeps receipt paper fixed when a theme is equipped', () => {
    const { getByTestId } = renderWithEmber(
      <AppCard variant="paper" testID="paper-card">
        <Text>Receipt</Text>
      </AppCard>
    );

    expect(
      StyleSheet.flatten(getByTestId('paper-card').props.style).backgroundColor
    ).toBe('#F8F7F1');
  });

  it('uses equipped background tokens for screen gradients', () => {
    const { getByTestId } = renderWithEmber(
      <ScreenWrapper variant="gradient" testID="themed-screen">
        <Text>Screen</Text>
      </ScreenWrapper>
    );

    expect(getByTestId('linear-gradient').props.colors).toEqual([
      '#080909',
      '#17120F',
    ]);
  });

  it('uses equipped surface tokens for dialogs and sheets', () => {
    const { getByTestId } = renderWithEmber(
      <>
        <ModalCard onClose={jest.fn()} testID="themed-dialog" visible>
          <Text>Dialog</Text>
        </ModalCard>
        <ModalCard
          onClose={jest.fn()}
          surface="sheet"
          testID="themed-sheet"
          visible
        >
          <Text>Sheet</Text>
        </ModalCard>
      </>
    );

    expect(
      StyleSheet.flatten(getByTestId('themed-dialog-surface').props.style)
        .backgroundColor
    ).toBe('#17120F');
    expect(
      StyleSheet.flatten(getByTestId('themed-sheet-surface').props.style)
        .backgroundColor
    ).toBe('#1D1713');
  });

  it('uses the equipped palette for recurring actions and selections', () => {
    const { getByRole, getByTestId } = renderWithEmber(
      <>
        <AppButton
          onPress={jest.fn()}
          testID="themed-primary-action"
          title="Save"
        />
        <AppButton
          onPress={jest.fn()}
          testID="themed-accent-action"
          title="Choose"
          variant="accent"
        />
        <AppListRow
          onPress={jest.fn()}
          selected
          showDivider={false}
          title="Selected style"
        />
      </>
    );

    expect(getByTestId('themed-primary-action')).toHaveStyle({
      backgroundColor: '#E7A86D',
      borderColor: '#E7A86D',
    });
    expect(getByTestId('themed-accent-action')).toHaveStyle({
      backgroundColor: '#E7A86D',
      borderColor: '#E7A86D',
    });
    expect(getByRole('button', { name: 'Selected style' })).toHaveStyle({
      backgroundColor: 'rgba(231, 168, 109, 0.14)',
      borderColor: 'rgba(231, 168, 109, 0.55)',
    });
  });
});
