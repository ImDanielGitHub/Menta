import { mentaSpacing } from '@/constants/MentaDesignSystem';
import type { PhoneLayoutMetrics } from '@/constants/phone-layout';

type PromiseInviteLayout = Pick<
  PhoneLayoutMetrics,
  'width' | 'height' | 'dialogGutter' | 'stackGap' | 'isCompactWidth'
>;

export const resolvePromiseInviteGeometry = (layout: PromiseInviteLayout) => {
  const cardPadding = layout.isCompactWidth ? mentaSpacing[4] : mentaSpacing[6];
  const qrPadding = layout.isCompactWidth ? mentaSpacing[3] : mentaSpacing[5];
  const dialogWidth = Math.max(
    0,
    Math.min(420, layout.width - layout.dialogGutter * 2)
  );
  const availableQrWidth = Math.max(
    0,
    dialogWidth - cardPadding * 2 - qrPadding * 2
  );

  return {
    cardPadding,
    dialogWidth,
    maxHeight: Math.max(0, layout.height - layout.stackGap * 2),
    qrPadding,
    qrSize: Math.min(200, Math.max(0, availableQrWidth)),
  };
};
