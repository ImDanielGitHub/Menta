import { translate } from '@/lib/localization/translate';

describe('Today, promise, proof, and review catalogue', () => {
  it('interpolates a complete message without joining translated fragments', () => {
    expect(
      translate('en-NZ', 'todayProof.today.risk_title', {
        count: 2,
        group: 'Morning runners',
      })
    ).toBe('2 check-ins due in Morning runners');
    expect(
      translate('en-NZ', 'todayProof.proof.meta', {
        type: 'Photo proof',
        time: '8:00 pm',
      })
    ).toBe('Photo proof · 8:00 pm');
  });

  it('selects singular and plural English forms from the count', () => {
    expect(
      translate('en-NZ', 'todayProof.solo.freezes_left', { count: 1 })
    ).toBe('1 freeze left');
    expect(
      translate('en-NZ', 'todayProof.solo.freezes_left', { count: 3 })
    ).toBe('3 freezes left');
    expect(
      translate('en-NZ', 'todayProof.today.group_needs_checkin', { count: 1 })
    ).toBe('1 check-in is needed');
  });

  it('keeps user-authored promise and reviewer content as values', () => {
    expect(
      translate('en-NZ', 'todayProof.review.checked_in', {
        name: 'Aroha',
      })
    ).toBe('Aroha checked in');
    expect(
      translate('en-NZ', 'todayProof.promise.joined_on', {
        date: '31 Aug',
      })
    ).toBe('Joined 31 Aug');
  });

  it('localises promise accountability proof and review copy in German', () => {
    expect(
      translate(
        'de-DE',
        'todayProof.source.accountability.media_accessibility_with_state',
        {
          type: 'Foto-Nachweis',
          name: 'Alex',
          submitted: 'Heute',
          state: 'Bestätigt',
        }
      )
    ).toBe('Foto-Nachweis von Alex, Heute, Bestätigt');
    expect(
      translate('de-DE', 'todayProof.source.accountability.report_context', {
        name: 'Alex',
        promise: 'Morgenspaziergang',
      })
    ).toBe('Nachweis von Alex für Morgenspaziergang');
  });
});
