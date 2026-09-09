import {
  getCommerceNotice,
  getStorePurchaseState,
  isOfflineCommerceError,
} from '../commerce-state';

describe('commerce proof-boundary states', () => {
  it('keeps loading copy separate from fetch errors and purchase history', () => {
    expect(getCommerceNotice('loading')).toMatchObject({
      title: 'Checking the latest details',
      message: 'Loading your balance and items.',
    });
  });

  it('keeps a returned StoreKit handoff pending until Menta confirms the receipt', () => {
    const state = getStorePurchaseState({
      success: true,
      receiptPending: true,
      storeTransactionCompleted: true,
    });

    expect(state).toBe('store-receipt-pending');
    expect(getCommerceNotice(state)).toMatchObject({
      kind: 'info',
      title: 'Checking your Momenta',
    });
    expect(getCommerceNotice(state).message).toContain(
      'Your Momenta will appear'
    );
    expect(getCommerceNotice(state).facts).toContainEqual({
      label: 'Momenta',
      value: 'Waiting',
    });
  });

  it('blocks duplicate submissions when the result cannot be proven', () => {
    const state = getStorePurchaseState({
      success: false,
      storeTransactionCompleted: true,
    });

    expect(state).toBe('unknown-result');
    const notice = getCommerceNotice(state);
    expect(notice.message).toContain("Don't buy it again yet");
    expect(notice.refreshActionTitle).toBe('Check status');
    expect(notice.facts).toContainEqual({
      label: 'Buy again',
      value: 'Wait until checked',
    });
  });

  it('keeps cancellation, insufficient balance, and server receipts distinct', () => {
    expect(getStorePurchaseState({ success: false, cancelled: true })).toBe(
      'cancelled'
    );
    expect(
      getCommerceNotice('insufficient-balance', { shortfall: 80 }).message
    ).toContain('need 80 more Momenta');
    expect(
      getCommerceNotice('server-receipt-confirmed', {
        itemName: 'Streak Freeze',
      }).title
    ).toBe('Purchase complete');
  });

  it('recognises offline failures without treating every failure as offline', () => {
    expect(isOfflineCommerceError(new Error('Network request failed'))).toBe(
      true
    );
    expect(isOfflineCommerceError(new Error('permission denied'))).toBe(false);
  });
});
