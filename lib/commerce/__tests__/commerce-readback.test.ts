import {
  decodePowerUpUseResponse,
  decodeInventoryReadback,
  decodeMomentaBalance,
  decodeShopPurchaseResponse,
  didPurchaseReadbackAdvance,
} from '../commerce-readback';

describe('commerce server readback decoders', () => {
  const clientEventId = '11111111-1111-4111-8111-111111111111';
  const receipt = {
    success: true,
    client_event_id: clientEventId,
    item_id: 'item-1',
    item_name: 'Streak Freeze',
    item_sku: 'streak_freeze',
    cost: 240,
    new_balance: 60,
    quantity: 1,
  };

  it('only accepts a complete receipt for the requested item', () => {
    expect(
      decodeShopPurchaseResponse(receipt, 'item-1', clientEventId)
    ).toEqual({
      success: true,
      receipt: {
        clientEventId,
        itemId: 'item-1',
        itemName: 'Streak Freeze',
        itemSku: 'streak_freeze',
        cost: 240,
        newBalance: 60,
        quantity: 1,
      },
    });
    expect(
      decodeShopPurchaseResponse(
        { ...receipt, quantity: '1' },
        'item-1',
        clientEventId
      )
    ).toMatchObject({ success: false, outcome: 'unknown' });
    expect(
      decodeShopPurchaseResponse(
        { ...receipt, item_id: 'other' },
        'item-1',
        clientEventId
      )
    ).toMatchObject({ success: false, outcome: 'unknown' });
    expect(
      decodeShopPurchaseResponse(
        {
          ...receipt,
          client_event_id: '22222222-2222-4222-8222-222222222222',
        },
        'item-1',
        clientEventId
      )
    ).toMatchObject({ success: false, outcome: 'unknown' });
  });

  it('keeps definitive insufficient balance distinct from an unknown receipt', () => {
    expect(
      decodeShopPurchaseResponse(
        { success: false, error: 'INSUFFICIENT_BALANCE' },
        'item-1',
        clientEventId
      )
    ).toMatchObject({ success: false, outcome: 'insufficient-balance' });
    expect(
      decodeShopPurchaseResponse(null, 'item-1', clientEventId)
    ).toMatchObject({ success: false, outcome: 'unknown' });
  });

  it('turns request-key mismatch into direct user copy', () => {
    expect(
      decodeShopPurchaseResponse(
        { success: false, error: 'REQUEST_FACT_MISMATCH' },
        'item-1',
        clientEventId
      )
    ).toMatchObject({
      success: false,
      outcome: 'failed',
      message:
        'This purchase is no longer for the item shown. Close it and start again.',
    });
  });

  it('accepts only a complete, non-duplicated inventory readback', () => {
    expect(
      decodeInventoryReadback([{ item_sku: 'streak_freeze', quantity: 1 }])
    ).toEqual([{ item_sku: 'streak_freeze', quantity: 1 }]);
    expect(
      decodeInventoryReadback([{ item_sku: 'streak_freeze', quantity: -1 }])
    ).toBeNull();
    expect(decodeMomentaBalance(0)).toBe(0);
    expect(decodeMomentaBalance('0')).toBeNull();
    expect(
      decodeInventoryReadback([
        { item_sku: 'streak_freeze', quantity: 1 },
        { item_sku: 'streak_freeze', quantity: 2 },
      ])
    ).toBeNull();
  });

  it('only recovers an unknown result from a newly observed grant', () => {
    expect(
      didPurchaseReadbackAdvance({
        beforeOwned: false,
        beforeQuantity: 0,
        currentOwned: true,
        currentQuantity: 1,
      })
    ).toBe(true);
    expect(
      didPurchaseReadbackAdvance({
        beforeOwned: true,
        beforeQuantity: 1,
        currentOwned: true,
        currentQuantity: 1,
      })
    ).toBe(false);
  });

  it('accepts only a correlated extension receipt', () => {
    expect(
      decodePowerUpUseResponse(
        {
          success: true,
          client_event_id: clientEventId,
          item_sku: 'time_extension_1',
          effect_type: 'deadline_extension_12h',
          effects: { remaining: 1 },
        },
        clientEventId
      )
    ).toMatchObject({
      success: true,
      outcome: 'confirmed',
      clientEventId,
    });
    expect(
      decodePowerUpUseResponse(
        {
          success: true,
          client_event_id: '22222222-2222-4222-8222-222222222222',
          item_sku: 'time_extension_1',
          effect_type: 'deadline_extension_12h',
          effects: { remaining: 1 },
        },
        clientEventId
      )
    ).toMatchObject({ success: false, outcome: 'unknown' });
  });

  it('turns server power-up codes into plain user copy', () => {
    const decoded = decodePowerUpUseResponse(
      { success: false, error: 'NO_INVENTORY' },
      '11111111-1111-4111-8111-111111111111'
    );

    expect(decoded).toMatchObject({ success: false, outcome: 'failed' });
    expect(decoded.message).toContain('No extensions are available');
    expect(decoded.message).not.toContain('NO_INVENTORY');
  });
});
