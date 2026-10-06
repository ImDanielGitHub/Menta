/** Native account changes share one admission boundary, including callbacks. */
export interface AuthTransition {
  readonly generation: number;
  readonly credentialChange: boolean;
}

let nextGeneration = 0;
let generation = 0;
let owner: AuthTransition | null = null;
let running = false;
const pending: (() => void)[] = [];

const enqueue = <T>(operation: () => Promise<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const start = () => {
      running = true;
      let result: Promise<T>;
      try {
        result = operation();
      } catch (error) {
        result = Promise.reject(error);
      }
      const release = () => {
        owner = null;
        const next = pending.shift();
        if (next) next();
        else running = false;
      };
      void result.then(
        value => {
          release();
          resolve(value);
        },
        error => {
          release();
          reject(error);
        }
      );
    };
    if (running) pending.push(start);
    else start();
  });

export const getAuthTransitionGeneration = (): number => generation;
export const ownsAuthTransition = (
  transition: AuthTransition | undefined
): boolean => Boolean(transition && owner === transition);
export const hasActiveAuthTransition = (): boolean => owner !== null;

/** Invalidate already-emitted events without changing the synchronous clear API. */
export const invalidateAuthTransitionEvents = (): void => {
  generation = ++nextGeneration;
};

export function runAuthTransition<T>(
  operation: (transition: AuthTransition) => Promise<T>
): Promise<T>;
export function runAuthTransition<T>(
  operation: (transition: AuthTransition) => Promise<T>,
  stillOwnsAccount: () => boolean
): Promise<T | undefined>;
export function runAuthTransition<T>(
  operation: (transition: AuthTransition) => Promise<T>,
  stillOwnsAccount?: () => boolean
): Promise<T | undefined> {
  // Reserve intent before any await; publish it only when admitted. An older
  // active grant may still finish and supersede a queued logout for account A.
  const reservedGeneration = ++nextGeneration;
  return enqueue(async () => {
    if (stillOwnsAccount && !stillOwnsAccount()) return undefined;
    generation = reservedGeneration;
    owner = Object.freeze({ generation, credentialChange: true });
    return operation(owner);
  });
}

/** SDK callbacks return immediately; deferred work must retain emission ownership. */
export const runAuthContinuation = <T>(
  emittedGeneration: number,
  operation: (transition: AuthTransition) => Promise<T>
): Promise<T | undefined> =>
  enqueue(async () => {
    if (generation !== emittedGeneration) return undefined;
    owner = Object.freeze({ generation, credentialChange: false });
    return operation(owner);
  });
