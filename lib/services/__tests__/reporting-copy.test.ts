import { getReportReceiptCopy } from '../reporting-copy';

describe('getReportReceiptCopy', () => {
  it('names an unverified receipt without leftover English', () => {
    expect(getReportReceiptCopy('unverified')).toBe(
      'Menta could not confirm the server response. Retry uses the same report reference.'
    );
    expect(getReportReceiptCopy('unverified')).not.toMatch(
      /verify the report receipt|server language|RPC/i
    );
  });

  it('names a report that never left the phone', () => {
    expect(getReportReceiptCopy('not_sent')).toBe(
      'Your report remains on this phone. Nothing was delivered to support.'
    );
  });

  it('names a missing session as a saved draft that was not sent', () => {
    expect(getReportReceiptCopy('sign_in')).toBe(
      'Sign in again before sending this private report. Nothing was sent.'
    );
  });

  it('names an account change without asking the person to complete a send', () => {
    expect(getReportReceiptCopy('account_changed')).toBe(
      'This report belongs to another account'
    );
    expect(getReportReceiptCopy('account_changed_after_send')).toBe(
      'Return to Support, then start a new report for this account.'
    );
  });

  it('uses the active translator', () => {
    const t = jest.fn(() => 'El informe no se envió.');
    expect(getReportReceiptCopy('not_sent', t)).toBe('El informe no se envió.');
    expect(t).toHaveBeenCalledWith('domain.report.remains_on_phone');
  });
});
