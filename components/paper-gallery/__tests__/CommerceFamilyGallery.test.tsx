import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  CommerceFamilyStatePreview,
  type CommerceGalleryPrices,
} from '@/components/paper-gallery/CommerceFamilyGallery';
import { ThemeProvider } from '@/constants/ThemeContext';

const renderState = (
  stateId: Parameters<typeof CommerceFamilyStatePreview>[0]['stateId'],
  options: {
    prices?: CommerceGalleryPrices;
    onAction?: Parameters<typeof CommerceFamilyStatePreview>[0]['onAction'];
  } = {}
) =>
  render(
    <ThemeProvider>
      <CommerceFamilyStatePreview
        onAction={options.onAction}
        prices={options.prices}
        stateId={stateId}
      />
    </ThemeProvider>
  );

describe('CommerceFamilyStatePreview', () => {
  it('uses structure-shaped skeletons for live-plan loading', () => {
    renderState('PAY-02');

    expect(screen.getByTestId('commerce-paper-PAY-02-skeleton')).toBeTruthy();
    expect(screen.queryByText('Monthly')).toBeNull();
    expect(screen.getByText('Loading plans…')).toBeTruthy();
  });

  it('does not enable checkout without a supplied live price', () => {
    renderState('PAY-03B');

    const action = screen.getByTestId('commerce-paper-PAY-03B-primary');
    expect(action.props.accessibilityState?.disabled).toBe(true);
    expect(screen.getAllByText('Live price unavailable')).toHaveLength(2);
  });

  it('delegates a selected plan action only after live prices are supplied', () => {
    const onAction = jest.fn();
    renderState('PAY-03B', {
      prices: { monthly: 'NZ$9.99', annual: 'NZ$99.99' },
      onAction,
    });

    expect(screen.getByText('NZ$9.99')).toBeTruthy();
    expect(
      screen.getByText('Supplied by the current store offering · selected')
    ).toBeTruthy();
    fireEvent.press(screen.getByText('Continue with monthly'));

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'buy-monthly' }),
      expect.objectContaining({ id: 'PAY-03B' })
    );
  });

  it('labels confirmed states as fixtures and keeps the server boundary visible', () => {
    renderState('SHP-08');

    expect(screen.getByText('DETERMINISTIC GALLERY FIXTURE')).toBeTruthy();
    expect(screen.getByText('Item added to your kit.')).toBeTruthy();
    expect(
      screen.getByText('Requires an account-matching purchase receipt.')
    ).toBeTruthy();
    expect(screen.getAllByText('Server confirmed')).toHaveLength(2);
  });

  it('keeps unknown ownership distinct from an empty inventory', () => {
    renderState('INV-05');

    expect(screen.getByText('Your kit is unavailable.')).toBeTruthy();
    expect(screen.queryByText('No items ready yet.')).toBeNull();
    expect(screen.getByText('Ownership not confirmed')).toBeTruthy();
  });
});
