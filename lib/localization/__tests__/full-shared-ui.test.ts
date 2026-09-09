import { enNZ } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

describe('shared UI localisation', () => {
  it('keeps shared dynamic copy in one translatable template', () => {
    expect(
      translate('en-NZ', 'shared.accessibility.tabSelected', {
        label: 'Today',
      })
    ).toBe('Today is selected.');
    expect(
      translate('en-NZ', 'shared.error.networkHandler.server.withStatus', {
        status: 503,
      })
    ).toBe(
      'The server returned 503. Retry in a moment; your place in Menta is still here.'
    );
  });

  it('exposes every shared catalogue key through the typed English catalogue', () => {
    expect(enNZ['shared.confirm.typeToConfirmAccessibility']).toBe(
      'Type {name} to confirm'
    );
    expect(enNZ['shared.timeline.context']).toBe('{challenge} in {group}');
  });
});
