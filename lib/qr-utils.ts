import * as Clipboard from 'expo-clipboard';
import { Share, Platform } from 'react-native';

const qrDebugLog = (..._args: unknown[]) => {};

export type ShareTextResult = 'shared' | 'dismissed' | 'copied_fallback';

/**
 * Share text content with optional title
 */
export const shareText = async (
  message: string,
  title?: string
): Promise<ShareTextResult> => {
  try {
    const result = await Share.share(
      {
        message: message,
        title: title,
      },
      {
        dialogTitle: title,
        tintColor: '#667eea', // Your brand color
      }
    );

    if (result.action === Share.sharedAction) {
      qrDebugLog('Content shared successfully');
      return 'shared';
    } else if (result.action === Share.dismissedAction) {
      qrDebugLog('Share dialog dismissed');
      return 'dismissed';
    }
    return 'dismissed';
  } catch (error) {
    console.error('Error sharing text:', error);
    // More graceful fallback - copy to clipboard on error
    try {
      await Clipboard.setStringAsync(message);
      qrDebugLog('Sharing failed, copied to clipboard instead');
      return 'copied_fallback';
    } catch (clipboardError) {
      console.error('Error copying to clipboard:', clipboardError);
      throw new Error('Failed to share content');
    }
  }
};

/**
 * Generate a simple join code
 */
export const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await Clipboard.setStringAsync(text);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw new Error('Failed to copy to clipboard');
  }
};
