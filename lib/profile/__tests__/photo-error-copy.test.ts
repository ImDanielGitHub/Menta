import { describeProfilePhotoError } from '../photo-error-copy';

describe('profile photo picker errors', () => {
  it('names a closed library without claiming the photo changed', () => {
    const copy = describeProfilePhotoError('library');

    expect(copy.title).toBe('Choose a profile photo');
    expect(copy.description).toBe(
      'Menta could not open your photo library. Try again.'
    );
    expect(copy.description).not.toContain('Photo not changed');
  });

  it('names an unsupported file as a different photo, not a save result', () => {
    const copy = describeProfilePhotoError('type');

    expect(copy.title).toBe('Choose a different photo.');
    expect(copy.description).toBe(
      'Choose a JPEG, PNG, or WebP image for your profile photo.'
    );
    expect(copy.description).not.toContain('Photo not changed');
  });

  it('names the 5 MB limit without wrapping it in a save receipt', () => {
    const copy = describeProfilePhotoError('size');

    expect(copy.title).toBe('Choose a different photo.');
    expect(copy.description).toBe('Choose a photo smaller than 5 MB.');
    expect(copy.description).not.toContain('Photo not changed');
  });
});
