import {
  IPAD_PORTRAIT_WORKSPACE_MIN_WIDTH,
  shouldUseIPadPortraitWorkspace,
} from '../ipad-workspace';

describe('iPad portrait workspace', () => {
  it('activates for a full 13-inch portrait iPad window', () => {
    expect(IPAD_PORTRAIT_WORKSPACE_MIN_WIDTH).toBe(944);
    expect(shouldUseIPadPortraitWorkspace(1024, true)).toBe(true);
  });

  it('keeps narrow iPad and Split View windows stacked', () => {
    expect(shouldUseIPadPortraitWorkspace(944, true)).toBe(true);
    expect(shouldUseIPadPortraitWorkspace(943, true)).toBe(false);
    expect(shouldUseIPadPortraitWorkspace(900, true)).toBe(false);
    expect(shouldUseIPadPortraitWorkspace(820, true)).toBe(false);
  });

  it('never changes a non-iPad composition', () => {
    expect(shouldUseIPadPortraitWorkspace(1366, false)).toBe(false);
  });
});
