import {
  getCreateIntensityShopNote,
  listCreateIntensityOptions,
} from '@/lib/commitments/create-intensity-copy';

describe('create intensity copy', () => {
  it('does not claim numbered deadline extensions or streak freezes', () => {
    const notes = listCreateIntensityOptions('en-NZ').map(
      option => option.note
    );

    expect(notes).toEqual([
      'Easier to keep on a busy week.',
      'A normal daily promise.',
      'The most demanding of the three.',
    ]);
    expect(notes.join(' ')).not.toMatch(/extend/i);
    expect(notes.join(' ')).not.toMatch(/freeze/i);
    expect(getCreateIntensityShopNote('en-NZ')).toBe(
      'A 12-hour deadline extension or streak freeze is bought in the shop, not chosen here.'
    );
  });

  it('keeps the stored difficulty values used by promise creation', () => {
    expect(listCreateIntensityOptions('en-NZ')).toMatchObject([
      { id: 'easy', label: 'Flexible', maxExtensions: 3, points: 100 },
      { id: 'medium', label: 'Standard', maxExtensions: 2, points: 200 },
      { id: 'hard', label: 'Fixed', maxExtensions: 0, points: 500 },
    ]);
  });

  it("labels the options in the person's app language", () => {
    const labels = listCreateIntensityOptions('fr-FR').map(
      option => option.label
    );

    expect(labels).not.toEqual(['Flexible', 'Standard', 'Fixed']);
  });
});
