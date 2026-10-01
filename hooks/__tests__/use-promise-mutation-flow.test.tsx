import { act, renderHook } from '@testing-library/react-native';
import { usePromiseMutationFlow } from '../use-promise-mutation-flow';
import {
  confirmedPromiseMutation,
  failedPromiseMutation,
  unknownPromiseMutation,
} from '@/lib/promises/mutation-result';

const confirmed = confirmedPromiseMutation({
  operation: 'delete',
  challengeId: 'promise-a',
  clientEventId: 'event-a',
  code: 'DELETE_CONFIRMED',
  message: 'Deleted',
  receiptId: 'receipt-a',
});
const setup = () => {
  const close = jest.fn();
  const result = jest.fn();
  const view = renderHook(
    ({ owner, promise, active }) =>
      usePromiseMutationFlow({
        owner,
        promise,
        active,
        close,
        onResult: result,
        onError: () =>
          unknownPromiseMutation({
            operation: 'delete',
            challengeId: promise,
            clientEventId: 'event-a',
            message: 'Unknown',
          }),
      }),
    { initialProps: { owner: 'account-a', promise: 'promise-a', active: true } }
  );
  return { ...view, close, delivered: result };
};
it('closes the modal before delivering confirmed navigation and consumes dismissal once', async () => {
  const view = setup();
  await act(async () => {
    await view.result.current.run(async () => confirmed);
  });
  expect(view.close).toHaveBeenCalledTimes(1);
  expect(view.delivered).not.toHaveBeenCalled();
  act(() => view.result.current.onDismiss());
  expect(view.delivered).toHaveBeenCalledWith(confirmed);
  act(() => view.result.current.onDismiss());
  expect(view.delivered).toHaveBeenCalledTimes(1);
});
it('blocks double taps while the request is pending and while dismissal is pending', async () => {
  const view = setup();
  let resolve!: (value: typeof confirmed) => void;
  const request = jest.fn(
    () =>
      new Promise<typeof confirmed>(r => {
        resolve = r;
      })
  );
  let first!: Promise<void>;
  act(() => {
    first = view.result.current.run(request);
    void view.result.current.run(request);
  });
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve(confirmed);
    await first;
    await view.result.current.run(request);
  });
  expect(request).toHaveBeenCalledTimes(1);
});
it.each(['owner', 'promise', 'active', 'unmount'] as const)(
  'ignores pending success after %s changes',
  async change => {
    const view = setup();
    let resolve!: (value: typeof confirmed) => void;
    let first!: Promise<void>;
    act(() => {
      first = view.result.current.run(
        () =>
          new Promise(r => {
            resolve = r;
          })
      );
    });
    if (change === 'unmount') view.unmount();
    else
      view.rerender({
        owner: change === 'owner' ? 'account-b' : 'account-a',
        promise: change === 'promise' ? 'promise-b' : 'promise-a',
        active: change !== 'active',
      });
    view.close.mockClear();
    await act(async () => {
      resolve(confirmed);
      await first;
    });
    expect(view.close).not.toHaveBeenCalled();
    expect(view.delivered).not.toHaveBeenCalled();
  }
);
it('does not navigate when the account changes after success but before dismissal', async () => {
  const view = setup();
  await act(async () => {
    await view.result.current.run(async () => confirmed);
  });
  view.rerender({ owner: 'account-b', promise: 'promise-a', active: true });
  act(() => view.result.current.onDismiss());
  expect(view.delivered).not.toHaveBeenCalled();
});
it('delivers a failed permission result without scheduling success navigation', async () => {
  const view = setup();
  const failed = failedPromiseMutation({
    operation: 'delete',
    challengeId: 'promise-a',
    clientEventId: 'event-a',
    code: 'NOT_AUTHORISED',
    message: 'Not changed',
  });
  await act(async () => {
    await view.result.current.run(async () => failed);
  });
  expect(view.delivered).toHaveBeenCalledWith(failed);
  act(() => view.result.current.onDismiss());
  expect(view.delivered).toHaveBeenCalledTimes(1);
});

it('bounds a never-settling request and offers receipt recovery without automatic retry', async () => {
  jest.useFakeTimers();
  const view = setup();
  const request = jest.fn(() => new Promise<typeof confirmed>(() => {}));
  let waiting!: Promise<void>;
  act(() => {
    waiting = view.result.current.run(request);
  });
  await act(async () => {
    jest.advanceTimersByTime(15_000);
    await waiting;
  });
  expect(view.delivered).toHaveBeenCalledWith(
    expect.objectContaining({ outcome: 'unknown' })
  );
  expect(view.result.current.busy).toBe(false);
  expect(request).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
it('recovers after rejected transport without leaving a blocking modal', async () => {
  const view = setup();
  await act(async () => {
    await view.result.current.run(async () => {
      throw new Error('network');
    });
  });
  expect(view.close).toHaveBeenCalled();
  expect(view.result.current.busy).toBe(false);
  expect(view.delivered).toHaveBeenCalledWith(
    expect.objectContaining({ outcome: 'unknown' })
  );
});

it('delivers status-check recovery immediately when no confirmation modal is presented', async () => {
  const view = setup();
  await act(async () => {
    await view.result.current.run(async () => confirmed, false);
  });
  expect(view.delivered).toHaveBeenCalledWith(confirmed);
  expect(view.result.current.busy).toBe(false);
});
it('does not let an old dismissal complete a newer account request', async () => {
  const view = setup();
  await act(async () => {
    await view.result.current.run(async () => confirmed);
  });
  const oldDismiss = view.result.current.onDismiss;
  view.rerender({ owner: 'account-b', promise: 'promise-b', active: true });
  await act(async () => {
    await view.result.current.run(async () => ({
      ...confirmed,
      challengeId: 'promise-b',
    }));
  });
  act(() => oldDismiss());
  expect(view.delivered).not.toHaveBeenCalled();
  expect(view.result.current.busy).toBe(true);
  act(() => view.result.current.onDismiss());
  expect(view.delivered).toHaveBeenCalledTimes(1);
});

it('keeps an owned pending request single-flight through blur/refocus and unlocks after its stale completion', async () => {
  const view = setup();
  let resolve!: (r: typeof confirmed) => void;
  const request = jest.fn(
    () =>
      new Promise<typeof confirmed>(r => {
        resolve = r;
      })
  );
  let first!: Promise<void>;
  act(() => {
    first = view.result.current.run(request);
  });
  view.rerender({ owner: 'account-a', promise: 'promise-a', active: false });
  view.rerender({ owner: 'account-a', promise: 'promise-a', active: true });
  await act(async () => {
    await view.result.current.run(request);
  });
  expect(request).toHaveBeenCalledTimes(1);
  expect(view.result.current.busy).toBe(true);
  await act(async () => {
    resolve(confirmed);
    await first;
  });
  expect(view.result.current.busy).toBe(false);
  expect(view.delivered).not.toHaveBeenCalled();
});
