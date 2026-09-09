import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking } from 'react-native';
import { LegalDocumentLinks } from '@/components/legal/LegalDocumentLinks';

describe('LegalDocumentLinks', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps every onboarding document independently reachable', () => {
    const openUrl = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined as never);

    render(<LegalDocumentLinks presentation="onboarding" />);

    fireEvent.press(screen.getByTestId('legal-document-links-terms'));
    fireEvent.press(
      screen.getByTestId('legal-document-links-community_standards')
    );
    fireEvent.press(screen.getByTestId('legal-document-links-privacy'));

    expect(openUrl).toHaveBeenCalledTimes(3);
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('reports the exact document when the browser cannot open it', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('unavailable'));
    const onOpenError = jest.fn();

    render(
      <LegalDocumentLinks onOpenError={onOpenError} presentation="onboarding" />
    );

    fireEvent.press(screen.getByTestId('legal-document-links-privacy'));

    await waitFor(() =>
      expect(onOpenError).toHaveBeenCalledWith('Privacy Policy')
    );
  });
});
