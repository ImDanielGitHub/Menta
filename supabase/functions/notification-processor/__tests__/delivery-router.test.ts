import { sendWithOneSignalCompatibilityFallback } from '../delivery-router.ts';
import { parseOneSignalSendResponse } from '../onesignal-sender.ts';

describe('notification delivery router', () => {
  it('uses Expo directly for Android and fail-safe routes', async () => {
    const sendExpo = jest.fn().mockResolvedValue({ kind: 'accepted' });
    const sendOneSignal = jest.fn();

    const result = await sendWithOneSignalCompatibilityFallback({
      providerName: 'expo',
      sendExpo,
      sendOneSignal,
    });

    expect(result).toEqual({
      fallbackReason: null,
      providerName: 'expo',
      result: { kind: 'accepted' },
    });
    expect(sendExpo).toHaveBeenCalledTimes(1);
    expect(sendOneSignal).not.toHaveBeenCalled();
  });

  it('uses Expo exactly once after a definitive no-subscription response', async () => {
    const sendExpo = jest.fn().mockResolvedValue({ kind: 'accepted' });
    const sendOneSignal = jest
      .fn()
      .mockResolvedValue({ kind: 'no-valid-subscription' });

    const result = await sendWithOneSignalCompatibilityFallback({
      providerName: 'onesignal',
      sendExpo,
      sendOneSignal,
    });

    expect(result).toEqual({
      fallbackReason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION',
      providerName: 'expo',
      result: { kind: 'accepted' },
    });
    expect(sendOneSignal).toHaveBeenCalledTimes(1);
    expect(sendExpo).toHaveBeenCalledTimes(1);
  });

  it('falls back when OneSignal reports every targeted subscription is off', async () => {
    const sendExpo = jest.fn().mockResolvedValue({
      kind: 'accepted',
      providerMessageId: 'expo-ticket',
    });

    await expect(
      sendWithOneSignalCompatibilityFallback({
        providerName: 'onesignal',
        sendExpo,
        sendOneSignal: async () =>
          parseOneSignalSendResponse({
            errors: ['All included players are not subscribed'],
          }),
      })
    ).resolves.toEqual({
      fallbackReason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION',
      providerName: 'expo',
      result: {
        kind: 'accepted',
        providerMessageId: 'expo-ticket',
      },
    });
    expect(sendExpo).toHaveBeenCalledTimes(1);
  });

  it('does not use Expo when the OneSignal result is accepted', async () => {
    const sendExpo = jest.fn();
    const sendOneSignal = jest.fn().mockResolvedValue({ kind: 'accepted' });

    await expect(
      sendWithOneSignalCompatibilityFallback({
        providerName: 'onesignal',
        sendExpo,
        sendOneSignal,
      })
    ).resolves.toEqual({
      fallbackReason: null,
      providerName: 'onesignal',
      result: { kind: 'accepted' },
    });
    expect(sendExpo).not.toHaveBeenCalled();
  });

  it('does not use Expo when OneSignal fails uncertainly', async () => {
    const sendExpo = jest.fn();
    const sendOneSignal = jest.fn().mockRejectedValue(new Error('timeout'));

    await expect(
      sendWithOneSignalCompatibilityFallback({
        providerName: 'onesignal',
        sendExpo,
        sendOneSignal,
      })
    ).rejects.toThrow('timeout');
    expect(sendExpo).not.toHaveBeenCalled();
  });
});
