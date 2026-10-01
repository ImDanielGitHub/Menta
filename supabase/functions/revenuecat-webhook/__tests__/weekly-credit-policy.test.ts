import { evaluateWeeklyCreditReceipt } from '../weekly-credit-policy';

const trial = {
  type: 'INITIAL_PURCHASE',
  period_type: 'TRIAL',
  transaction_id: 'trial-transaction',
  price_in_purchased_currency: 0,
};

describe('weekly Pro billing credit eligibility', () => {
  it('includes the first confirmed free trial period', () => {
    expect(evaluateWeeklyCreditReceipt(trial).eligible).toBe(true);
  });

  it.each(['INITIAL_PURCHASE', 'RENEWAL'])(
    'keeps confirmed paid %s eligible',
    type => {
      expect(
        evaluateWeeklyCreditReceipt({
          type,
          period_type: 'NORMAL',
          price_in_purchased_currency: 4.99,
        }).eligible
      ).toBe(true);
    }
  );

  it.each([
    'RENEWAL',
    'UNCANCELLATION',
    'TEMPORARY_ENTITLEMENT_GRANT',
    'RESTORE',
  ])('does not create a free trial grant for %s', type => {
    expect(evaluateWeeklyCreditReceipt({ ...trial, type }).eligible).toBe(
      false
    );
  });

  it.each(['NORMAL', 'INTRO', undefined])(
    'rejects zero-price initial purchases without explicit TRIAL metadata (%s)',
    period_type => {
      expect(
        evaluateWeeklyCreditReceipt({ ...trial, period_type }).eligible
      ).toBe(false);
    }
  );

  it.each([undefined, '', '   '])(
    'requires a real trial transaction identity (%s)',
    transaction_id => {
      expect(
        evaluateWeeklyCreditReceipt({ ...trial, transaction_id }).eligible
      ).toBe(false);
    }
  );

  it.each([undefined, NaN, Infinity, -1])(
    'fails closed for missing or invalid trial price (%s)',
    price_in_purchased_currency => {
      expect(
        evaluateWeeklyCreditReceipt({ ...trial, price_in_purchased_currency })
          .eligible
      ).toBe(false);
    }
  );

  it('uses the fallback provider price when the purchased-currency price is absent', () => {
    expect(evaluateWeeklyCreditReceipt({ price: 4.99 }).eligible).toBe(true);
    expect(
      evaluateWeeklyCreditReceipt({
        ...trial,
        price_in_purchased_currency: undefined,
        price: 0,
      }).eligible
    ).toBe(true);
  });

  it('does not reinterpret a zero purchased-currency amount as a paid receipt', () => {
    expect(
      evaluateWeeklyCreditReceipt({
        type: 'RENEWAL',
        price_in_purchased_currency: 0,
        price: 4.99,
      }).eligible
    ).toBe(false);
  });
});
