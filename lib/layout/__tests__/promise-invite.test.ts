import { resolvePhoneLayout } from '@/constants/phone-layout';
import { resolvePromiseInviteGeometry } from '@/lib/layout/promise-invite';

describe('promise invite geometry', () => {
  it.each([
    [320, 568],
    [375, 667],
    [390, 844],
    [414, 896],
    [430, 932],
  ])('keeps the QR inside the dialog at %d×%d', (width, height) => {
    const layout = resolvePhoneLayout({ width, height, fontScale: 2 });
    const geometry = resolvePromiseInviteGeometry(layout);

    expect(geometry.dialogWidth).toBeLessThanOrEqual(
      width - layout.dialogGutter * 2
    );
    expect(
      geometry.qrSize + geometry.qrPadding * 2 + geometry.cardPadding * 2
    ).toBeLessThanOrEqual(geometry.dialogWidth);
    expect(geometry.maxHeight).toBeLessThan(height);
  });
});
