import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import {
  PromiseArtefact,
  resolveTypingPlaceholderFrame,
} from '@/components/challenge/PromiseArtefact';

describe('PromiseArtefact', () => {
  afterEach(() => jest.useRealTimers());

  it('presents the promise as one tangible, accessible commitment', () => {
    render(
      <PromiseArtefact
        promise="Walk after work"
        countsWhen="Walk outside for 20 minutes"
        proofRule="A clear route photo"
        testID="promise-artefact"
      />
    );

    expect(screen.getByText('YOUR PROMISE')).toBeTruthy();
    expect(screen.getByText('Walk after work')).toBeTruthy();
    expect(screen.getByText('DAILY MINIMUM')).toBeTruthy();
    expect(screen.getByText('Walk outside for 20 minutes')).toBeTruthy();
    expect(screen.getByText('PROOF SHOULD SHOW')).toBeTruthy();
    expect(screen.getByText('A clear route photo')).toBeTruthy();
    const artefact = screen.getByLabelText(
      'Your promise: Walk after work. Daily minimum: Walk outside for 20 minutes. Proof should show: A clear route photo.'
    );
    expect(artefact).toHaveProp('accessibilityRole', 'summary');
  });

  it('exposes the artefact as the screen heading when asked', () => {
    render(
      <PromiseArtefact
        isHeading
        promise="Walk after work"
        countsWhen="Walk outside for 20 minutes"
        testID="heading-promise"
      />
    );

    expect(screen.getByTestId('heading-promise')).toHaveProp(
      'accessibilityRole',
      'header'
    );
  });

  it('uses the supplied equipped-theme accent on the detail artefact', () => {
    render(
      <PromiseArtefact
        accentColor="#F97316"
        promise="Walk after work"
        countsWhen="Walk outside for 20 minutes"
        testID="themed-promise"
      />
    );

    expect(screen.getByTestId('themed-promise-accent-rule')).toHaveStyle({
      backgroundColor: '#F97316',
    });
  });

  it('keeps both editable parts inside the same paper artefact', () => {
    const onChangePromise = jest.fn();
    const onChangeCountsWhen = jest.fn();

    render(
      <PromiseArtefact
        editable
        promise="Read before bed"
        countsWhen="Read ten pages"
        onChangePromise={onChangePromise}
        onChangeCountsWhen={onChangeCountsWhen}
        promiseInputTestID="promise-input"
        countsWhenInputTestID="counts-input"
        testID="editable-promise-artefact"
      />
    );

    fireEvent.changeText(screen.getByTestId('promise-input'), 'Read nightly');
    fireEvent.changeText(screen.getByTestId('counts-input'), 'Read 20 pages');

    expect(screen.getByLabelText('Your promise')).toBeTruthy();
    expect(screen.getByLabelText('Daily minimum')).toBeTruthy();
    expect(screen.getAllByText('Edit')).toHaveLength(2);
    expect(onChangePromise).toHaveBeenCalledWith('Read nightly');
    expect(onChangeCountsWhen).toHaveBeenCalledWith('Read 20 pages');
    expect(screen.getByTestId('promise-input')).toHaveProp(
      'returnKeyType',
      'next'
    );
    expect(screen.getByTestId('counts-input')).toHaveProp(
      'returnKeyType',
      'done'
    );
    expect(
      StyleSheet.flatten(screen.getByTestId('promise-input').props.style)
        .backgroundColor
    ).toBe('transparent');
    expect(
      StyleSheet.flatten(screen.getByTestId('counts-input').props.style)
        .backgroundColor
    ).toBe('transparent');
  });

  it('types template examples in a fixed frame until editing starts', () => {
    render(
      <PromiseArtefact
        editable
        promise=""
        countsWhen=""
        promisePlaceholders={['Move daily…', 'Study block…']}
        countsWhenPlaceholders={[
          'Move with intention each day…',
          'Complete one focused study block…',
        ]}
        promiseInputTestID="promise-input"
        countsWhenInputTestID="counts-input"
      />
    );

    expect(screen.getByTestId('promise-input')).toHaveProp('placeholder', '');
    expect(screen.getByTestId('counts-input')).toHaveProp('placeholder', '');
    expect(
      screen.getByTestId('promise-input-typing-placeholder', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(
      screen.getByTestId('counts-input-typing-placeholder', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();

    fireEvent(screen.getByTestId('promise-input'), 'focus');
    expect(screen.getByTestId('promise-input')).toHaveProp(
      'placeholder',
      'Type your promise…'
    );
    expect(
      screen.queryByTestId('promise-input-typing-placeholder', {
        includeHiddenElements: true,
      })
    ).toBeNull();
  });

  it('types one example once, then leaves the complete phrase still', () => {
    const examples = ['Move daily…', 'Study block…'];
    const firstTypeDuration = examples[0].length * 52;

    expect(resolveTypingPlaceholderFrame(examples, 0)).toBe('M');
    expect(resolveTypingPlaceholderFrame(examples, firstTypeDuration - 1)).toBe(
      examples[0]
    );
    expect(
      resolveTypingPlaceholderFrame(examples, firstTypeDuration + 10_000)
    ).toBe(examples[0]);
    expect(resolveTypingPlaceholderFrame(examples, 60_000)).toBe(examples[0]);
  });
});
