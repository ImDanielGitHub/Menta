import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppTextScaleProvider } from '@/components/ui/AppScaledText';
import { MentaPaletteContext } from '@/constants/use-menta-palette';
import { mentaLightColors } from '@/constants/MentaDesignSystem';

import { TodayAlsoList, type TodayAlsoItem } from '../TodayAlsoList';

jest.mock('@/components/ui/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props: Record<string, unknown>) =>
    React.createElement(View, props);
  return {
    CameraIcon: Icon,
    CheckIcon: Icon,
    ChevronRightIcon: Icon,
    ClockIcon: Icon,
    EditIcon: Icon,
    EyeIcon: Icon,
    RotateCcwIcon: Icon,
    UsersIcon: Icon,
    VideoIcon: Icon,
  };
});

const approved: TodayAlsoItem = {
  key: 'approved',
  kind: 'proof-approved',
  title: 'Reading a book',
  detail: 'Personal · Day 1 of 7',
  statusLabel: 'Done today',
  accessibilityLabel: 'Reading a book. Done today',
  onPress: jest.fn(),
};

describe('TodayAlsoList', () => {
  it('keeps approved proof copy and navigation intact with the new artwork', () => {
    const onPress = jest.fn();
    render(
      <TodayAlsoList heading="More today" items={[{ ...approved, onPress }]} />
    );

    expect(screen.getByText('Reading a book')).toBeTruthy();
    expect(screen.getByText('Personal · Day 1 of 7')).toBeTruthy();
    expect(screen.getByText('Done today')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Reading a book. Done today'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps proof titles and metadata readable without line truncation', () => {
    const title = 'Read a chapter before going to sleep';
    render(
      <TodayAlsoList heading="More today" items={[{ ...approved, title }]} />
    );
    expect(screen.getByTestId('today-also-approved')).toHaveStyle({
      backgroundColor: 'transparent',
      borderWidth: 0,
    });
    expect(screen.getByText(title).props.numberOfLines).toBeUndefined();
    expect(
      screen.getByText(approved.detail).props.numberOfLines
    ).toBeUndefined();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('keeps large-type status readable in the light palette', () => {
    render(
      <MentaPaletteContext.Provider value={mentaLightColors}>
        <AppTextScaleProvider scale={1.6}>
          <TodayAlsoList heading="More today" items={[approved]} />
        </AppTextScaleProvider>
      </MentaPaletteContext.Provider>
    );
    expect(screen.getByText('Done today')).toHaveStyle({
      color: mentaLightColors.success,
      fontSize: 20.8,
    });
    expect(
      screen.getByText(approved.detail).props.numberOfLines
    ).toBeUndefined();
    expect(
      screen.getByText(approved.title).props.numberOfLines
    ).toBeUndefined();
  });

  it('does not invent status when none was supplied', () => {
    render(
      <TodayAlsoList
        heading="More today"
        items={[{ ...approved, statusLabel: undefined }]}
      />
    );
    expect(screen.queryByText('Done today')).toBeNull();
    expect(screen.getByText(approved.title)).toBeTruthy();
  });

  it('preserves correction actions and their existing warning card', () => {
    const onPress = jest.fn();
    render(
      <TodayAlsoList
        heading="More today"
        items={[
          {
            ...approved,
            kind: 'proof-correction',
            key: 'correction',
            statusLabel: 'Needs correction',
            accessibilityLabel: 'Reading a book. Needs correction',
            onPress,
          },
        ]}
      />
    );
    expect(screen.getByTestId('today-also-correction')).toHaveStyle({
      borderWidth: 1,
    });
    fireEvent.press(screen.getByLabelText('Reading a book. Needs correction'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not turn pending proof into a completed receipt', () => {
    const onPress = jest.fn();
    render(
      <TodayAlsoList
        heading="More today"
        items={[
          {
            ...approved,
            key: 'pending',
            kind: 'proof-pending',
            statusLabel: 'Waiting for review',
            accessibilityLabel: 'Reading a book. Waiting for review',
            onPress,
          },
        ]}
      />
    );

    expect(screen.queryByText('Done today')).toBeNull();
    expect(screen.getByText('Waiting for review')).toBeTruthy();
    fireEvent.press(
      screen.getByLabelText('Reading a book. Waiting for review')
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
