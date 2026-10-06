import {
  createStartupSplashHandoff,
  STARTUP_IMAGE_TIMEOUT_MS,
  STARTUP_REVEAL_TIMEOUT_MS,
} from '../startup-splash-handoff';

function createHandoff() {
  let complete = () => {};
  const stop = jest.fn();
  const hide = jest.fn();
  const finish = jest.fn();
  const active = jest.fn(() => true);
  const animate = jest.fn((callback: () => void) => {
    complete = callback;
    return stop;
  });
  const handoff = createStartupSplashHandoff({
    hideNative: hide,
    animate,
    onFinish: finish,
    isActive: active,
  });
  return {
    handoff,
    hide,
    finish,
    animate,
    stop,
    active,
    complete: () => complete(),
  };
}

describe('cold startup handoff', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('holds native until image decode, layout and motion readiness, then animates once', () => {
    const t = createHandoff();
    t.handoff.preferenceReady(false);
    t.handoff.imageReady();
    expect(t.hide).not.toHaveBeenCalled();
    t.handoff.layoutReady();
    expect(t.hide).toHaveBeenCalledTimes(1);
    expect(t.animate).toHaveBeenCalledTimes(1);
    t.handoff.imageReady();
    t.handoff.layoutReady();
    t.handoff.preferenceReady(false);
    expect(t.animate).toHaveBeenCalledTimes(1);
    t.complete();
    t.complete();
    t.handoff.dispose();
    expect(t.finish).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('skips scaling immediately for Reduce Motion, without waiting for image callbacks', () => {
    const t = createHandoff();
    t.handoff.preferenceReady(true);
    expect(t.hide).toHaveBeenCalledTimes(1);
    expect(t.finish).toHaveBeenCalledTimes(1);
    expect(t.animate).not.toHaveBeenCalled();
  });

  it('reveals the app when image decode or layout never arrives', () => {
    const t = createHandoff();
    t.handoff.preferenceReady(false);
    jest.advanceTimersByTime(STARTUP_IMAGE_TIMEOUT_MS);
    expect(t.hide).toHaveBeenCalledTimes(1);
    expect(t.finish).toHaveBeenCalledTimes(1);
    t.handoff.imageReady();
    t.handoff.layoutReady();
    expect(t.animate).not.toHaveBeenCalled();
  });

  it('escapes even if the native animation callback never arrives', () => {
    const t = createHandoff();
    t.handoff.imageReady();
    t.handoff.layoutReady();
    t.handoff.preferenceReady(false);
    jest.advanceTimersByTime(STARTUP_REVEAL_TIMEOUT_MS);
    expect(t.stop).toHaveBeenCalledTimes(1);
    expect(t.finish).toHaveBeenCalledTimes(1);
    expect(t.hide).toHaveBeenCalledTimes(1);
  });

  it('cancels safely in background and cannot replay on repeated readiness', () => {
    const t = createHandoff();
    t.handoff.imageReady();
    t.handoff.layoutReady();
    t.handoff.preferenceReady(false);
    t.handoff.backgrounded();
    t.handoff.preferenceReady(false);
    t.handoff.imageReady();
    t.complete();
    expect(t.stop).toHaveBeenCalledTimes(1);
    expect(t.finish).toHaveBeenCalledTimes(1);
    expect(t.animate).toHaveBeenCalledTimes(1);
  });

  it('unmount cancellation hides native once and clears both escapes', () => {
    const t = createHandoff();
    t.handoff.dispose();
    t.handoff.dispose();
    expect(t.hide).toHaveBeenCalledTimes(1);
    expect(t.finish).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('skips animation when the app is already backgrounded', () => {
    const t = createHandoff();
    t.active.mockReturnValue(false);
    t.handoff.imageReady();
    t.handoff.layoutReady();
    t.handoff.preferenceReady(false);
    expect(t.animate).not.toHaveBeenCalled();
    expect(t.finish).toHaveBeenCalledTimes(1);
  });

  it('removes the overlay even when native hiding throws', () => {
    const t = createHandoff();
    t.hide.mockImplementation(() => {
      throw new Error('bridge');
    });
    t.handoff.preferenceReady(true);
    expect(t.finish).toHaveBeenCalledTimes(1);
  });
});
