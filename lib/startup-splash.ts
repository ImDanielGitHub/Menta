import { AccessibilityInfo } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export const STARTUP_PREFERENCE_TIMEOUT_MS = 80;

/** Unknown preferences use the still frame; native promises cannot hold launch. */
export function resolveStartupReduceMotion(): Promise<boolean> {
  return new Promise(resolve => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(value);
    };
    const timeout = setTimeout(
      () => settle(true),
      STARTUP_PREFERENCE_TIMEOUT_MS
    );
    try {
      void AccessibilityInfo.isReduceMotionEnabled().then(settle, () =>
        settle(true)
      );
    } catch {
      settle(true);
    }
  });
}

/** Native hiding is synchronous: never await another potentially pending bridge call. */
export function hideNativeStartupSplash(): void {
  try {
    SplashScreen.setOptions({ duration: 0, fade: false });
  } finally {
    SplashScreen.hide();
  }
}

/** The recovery screen must remain reachable even if the overlay never commits. */
export function hideNativeStartupSplashAfterRenderError(): void {
  try {
    hideNativeStartupSplash();
  } catch {
    // A bridge failure must not throw from the error boundary's recovery path.
  }
}
