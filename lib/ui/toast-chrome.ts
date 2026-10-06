import { showToast as uiShowToast } from '@/components/ui/Toast';

export type LegacyToastType = 'error' | 'success' | 'info';

/**
 * Present a one-line toast without an ornamental Error, Success, or Info
 * heading. The type already sets colour and icon; the message is the title.
 */
export function presentToastMessage(
  message: string,
  type: LegacyToastType = 'info'
): void {
  if (type === 'error') {
    uiShowToast.error(message);
    return;
  }
  if (type === 'success') {
    uiShowToast.success(message);
    return;
  }
  uiShowToast.info(message);
}
