import { backOrReplace } from '@/lib/navigation/safe-back';

describe('backOrReplace', () => {
  it('pops the stack for an ordinary in-app Back', () => {
    const router = {
      back: jest.fn(),
      canGoBack: jest.fn().mockReturnValue(true),
      replace: jest.fn(),
    };

    backOrReplace(router, '/(tabs)');

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('uses the fallback when a restored router does not expose canGoBack', () => {
    const router = {
      back: jest.fn(),
      replace: jest.fn(),
    };

    backOrReplace(router, '/(tabs)');

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('sends the person to a real destination when there is no history', () => {
    // A notification, an invite deep link, or a state restore after the app was
    // backgrounded can make this screen the first one of the session. Plain
    // router.back() is a silent no-op there, which reads as a dead button.
    const router = {
      back: jest.fn(),
      canGoBack: jest.fn().mockReturnValue(false),
      replace: jest.fn(),
    };

    backOrReplace(router, '/(tabs)');

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });
});
