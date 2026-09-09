import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import TransactionHistory from '@/components/momenta/TransactionHistory';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: () => ({
    transactions: [],
    isLoading: false,
    transactionHistoryError: null,
    fetchTransactions: jest.fn(),
    syncWithBackend: jest.fn(),
  }),
}));

describe('TransactionHistory', () => {
  it('uses its real section heading and one quiet progress region while loading', () => {
    render(
      <ThemeProvider>
        <TransactionHistory loading transactions={[]} title="Recent activity" />
      </ThemeProvider>
    );

    expect(screen.getByText('Recent activity')).toBeTruthy();
    expect(screen.getByTestId('wallet-activity-skeleton')).toBeTruthy();
    expect(screen.queryByText('Checking wallet activity')).toBeNull();
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
  });

  it('keeps transaction dates as sentence-case scan metadata', () => {
    render(
      <ThemeProvider>
        <TransactionHistory
          showRefresh={false}
          transactions={[
            {
              id: 'transaction-1',
              user_id: 'user-1',
              amount: 10,
              transaction_type: 'earned',
              description: 'Review reward',
              created_at: new Date().toISOString(),
            },
          ]}
        />
      </ThemeProvider>
    );

    const date = screen.getByText('Today');
    expect(StyleSheet.flatten(date.props.style)).toEqual(
      expect.objectContaining({ fontSize: 13, lineHeight: 18 })
    );
    expect(StyleSheet.flatten(date.props.style)).not.toEqual(
      expect.objectContaining({ textTransform: 'uppercase' })
    );
  });
});
