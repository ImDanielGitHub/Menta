import { translate } from '@/lib/localization';
import {
  getProofDueHelperCopy,
  getProofDueHelperKind,
  getProofDueRemainingCopy,
} from '../proof-due-copy';

describe('proof due countdown copy', () => {
  it('names remaining time without the English hour-minute clock', () => {
    expect(getProofDueRemainingCopy(2, 14)).toBe('2h 14m');
    expect(getProofDueRemainingCopy(12, 0)).toBe('12h');
    expect(getProofDueRemainingCopy(0, 1)).toBe('1 minute');
    expect(getProofDueRemainingCopy(0, 9)).toBe('9 minutes');
  });

  it('names the reminder as preferred time and midnight as what still counts', () => {
    expect(getProofDueHelperKind({ phase: 'due', target: 'reminder' })).toBe(
      'reminder'
    );
    expect(
      getProofDueHelperKind({ phase: 'last-chance', target: 'midnight' })
    ).toBe('midnight');
    expect(getProofDueHelperKind({ phase: 'due', target: 'midnight' })).toBe(
      'midnight'
    );
    expect(getProofDueHelperKind({ phase: 'due', target: 'extension' })).toBe(
      'extension'
    );

    expect(getProofDueHelperCopy('reminder', '8:00 PM')).toBe(
      'Preferred time: 8:00 PM. Proof counts until midnight.'
    );
    expect(getProofDueHelperCopy('midnight', '8:00 PM')).toBe(
      'Proof counts until midnight.'
    );
    expect(getProofDueHelperCopy('extension', '8:00 PM')).toBe(
      'Proof counts until your extension ends.'
    );
  });

  it('follows the chosen language instead of leftover English', () => {
    const t = (key: Parameters<typeof translate>[1], values = {}) =>
      translate('fr-FR', key, values);

    expect(getProofDueRemainingCopy(2, 14, t)).not.toBe('2 h 14 m');
    expect(getProofDueHelperCopy('midnight', '20:00', t)).not.toBe(
      'Proof still counts until midnight.'
    );
    expect(getProofDueHelperCopy('reminder', '20:00', t)).not.toMatch(
      /Aim to send by/i
    );
  });
});
