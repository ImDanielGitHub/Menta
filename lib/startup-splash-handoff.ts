export const STARTUP_FACE_INITIAL_SCALE = 0.86;
export const STARTUP_IMAGE_TIMEOUT_MS = 250;
export const STARTUP_REVEAL_TIMEOUT_MS = 650;

type HandoffOptions = {
  hideNative: () => void;
  animate: (complete: () => void) => () => void;
  onFinish: () => void;
  isActive: () => boolean;
};

/** Readiness, cancellation and independent escapes for one cold-start handoff. */
export function createStartupSplashHandoff(options: HandoffOptions) {
  let finished = false;
  let started = false;
  let hidden = false;
  let imageReady = false;
  let layoutReady = false;
  let preferenceReady = false;
  let stopAnimation: (() => void) | undefined;
  const hideNative = () => {
    if (hidden) return;
    hidden = true;
    try {
      options.hideNative();
    } catch {
      // Still remove the JS overlay if a native bridge operation fails.
    }
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(imageTimeout);
    clearTimeout(revealTimeout);
    try {
      stopAnimation?.();
    } finally {
      hideNative();
      options.onFinish();
    }
  };
  const imageTimeout = setTimeout(finish, STARTUP_IMAGE_TIMEOUT_MS);
  const revealTimeout = setTimeout(finish, STARTUP_REVEAL_TIMEOUT_MS);
  const attemptStart = () => {
    if (finished || started || !preferenceReady || !imageReady || !layoutReady)
      return;
    started = true;
    clearTimeout(imageTimeout);
    hideNative();
    if (!options.isActive()) {
      finish();
      return;
    }
    try {
      stopAnimation = options.animate(finish);
    } catch {
      finish();
    }
  };
  return {
    imageReady() {
      imageReady = true;
      attemptStart();
    },
    layoutReady() {
      layoutReady = true;
      attemptStart();
    },
    preferenceReady(reduceMotion: boolean) {
      if (finished) return;
      if (reduceMotion) {
        finish();
        return;
      }
      preferenceReady = true;
      attemptStart();
    },
    imageFailed: finish,
    backgrounded: finish,
    dispose: finish,
  };
}
