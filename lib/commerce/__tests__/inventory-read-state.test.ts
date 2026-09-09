import {
  getInventoryReadState,
  isCurrentInventoryAccount,
} from '../inventory-read-state';

describe('getInventoryReadState', () => {
  const confirmedEmpty = {
    loading: false,
    hasConfirmedSnapshot: true,
    loadError: null,
    itemCount: 0,
    visibleItemCount: 0,
  };

  it('does not turn an unconfirmed or failed read into an empty inventory', () => {
    expect(
      getInventoryReadState({
        ...confirmedEmpty,
        hasConfirmedSnapshot: false,
      })
    ).toBe('unavailable');
    expect(
      getInventoryReadState({
        ...confirmedEmpty,
        loadError: 'Network request failed',
      })
    ).toBe('unavailable');
  });

  it('uses the empty state only after a confirmed read', () => {
    expect(getInventoryReadState(confirmedEmpty)).toBe('empty');
  });

  it('keeps a confirmed snapshot visible while a refresh error is non-fatal', () => {
    expect(
      getInventoryReadState({
        ...confirmedEmpty,
        itemCount: 2,
        visibleItemCount: 2,
      })
    ).toBe('ready');
  });

  it('keeps loading and category-filter states distinct', () => {
    expect(
      getInventoryReadState({
        ...confirmedEmpty,
        loading: true,
      })
    ).toBe('loading');
    expect(
      getInventoryReadState({
        ...confirmedEmpty,
        itemCount: 2,
      })
    ).toBe('filtered-empty');
  });

  it('only confirms a snapshot for the account that requested it', () => {
    expect(isCurrentInventoryAccount('user-1', 'user-1')).toBe(true);
    expect(isCurrentInventoryAccount('user-1', 'user-2')).toBe(false);
    expect(isCurrentInventoryAccount('user-1', null)).toBe(false);
    expect(isCurrentInventoryAccount(null, null)).toBe(false);
  });
});
