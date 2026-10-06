import { getTodayLedgerScopeLabel } from '../today-ledger-copy';

describe('today ledger scope label', () => {
  it('keeps a named group and uses Solo when the proof is personal', () => {
    expect(getTodayLedgerScopeLabel('Morning walk')).toBe('Morning walk');
    expect(getTodayLedgerScopeLabel('  ')).toBe('Solo');
    expect(getTodayLedgerScopeLabel(null)).toBe('Solo');
    expect(getTodayLedgerScopeLabel(undefined)).toBe('Solo');
  });
});
