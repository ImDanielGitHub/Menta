import { useEffect, useRef, useState } from 'react';
import type { PromiseMutationResult } from '@/lib/promises/mutation-result';
import { withTimeout } from '@/utils/api';

type Scope = {
  owner: string | undefined;
  promise: string | undefined;
  active: boolean;
};
export function usePromiseMutationFlow(
  input: Scope & {
    close: () => void;
    onResult: (result: PromiseMutationResult) => void;
    onError: (error: unknown) => PromiseMutationResult;
  }
) {
  const scopeRef = useRef<Scope>(input);
  const callbacks = useRef(input);
  callbacks.current = input;
  if (
    scopeRef.current.owner !== input.owner ||
    scopeRef.current.promise !== input.promise ||
    scopeRef.current.active !== input.active
  )
    scopeRef.current = {
      owner: input.owner,
      promise: input.promise,
      active: input.active,
    };
  const [busyScope, setBusyScope] = useState<Scope | null>(null);
  const operationRef = useRef<Scope | null>(null);
  const pending = useRef<{
    scope: Scope;
    result: PromiseMutationResult;
  } | null>(null);
  const mounted = useRef(true);
  const previousScope = useRef(scopeRef.current);
  useEffect(() => {
    const scope = scopeRef.current;
    if (previousScope.current === scope) return;
    previousScope.current = scope;
    const receipt = pending.current;
    if (receipt) {
      if (operationRef.current === receipt.scope) operationRef.current = null;
      pending.current = null;
    }
    callbacks.current.close();
  }, [input.owner, input.promise, input.active]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.current = null;
    };
  }, []);
  const current = (scope: Scope) =>
    mounted.current && scope.active && scopeRef.current === scope;
  const run = async (
    operation: () => Promise<PromiseMutationResult>,
    waitForDismissal = true
  ) => {
    const scope = scopeRef.current;
    if (
      !current(scope) ||
      !scope.owner ||
      !scope.promise ||
      (operationRef.current?.owner === scope.owner &&
        operationRef.current?.promise === scope.promise)
    )
      return;
    operationRef.current = scope;
    setBusyScope(scope);
    let result: PromiseMutationResult;
    try {
      result = await withTimeout(operation(), 15_000, 'Promise action');
    } catch (error) {
      if (!current(scope)) {
        if (operationRef.current === scope) {
          operationRef.current = null;
          if (mounted.current) setBusyScope(null);
        }
        return;
      }
      result = callbacks.current.onError(error);
    }
    if (!current(scope)) {
      if (operationRef.current === scope) {
        operationRef.current = null;
        if (mounted.current) setBusyScope(null);
      }
      return;
    }
    if (result.outcome === 'confirmed' && waitForDismissal) {
      // Navigation can begin only once the native modal has dismissed.
      pending.current = { scope, result };
      callbacks.current.close();
      return;
    }
    callbacks.current.close();
    operationRef.current = null;
    setBusyScope(null);
    callbacks.current.onResult(result);
  };
  const dismissalScope = scopeRef.current;
  const onDismiss = () => {
    const receipt = pending.current;
    if (!receipt || receipt.scope !== dismissalScope) return;
    pending.current = null;
    if (!current(receipt.scope)) return;
    operationRef.current = null;
    setBusyScope(null);
    callbacks.current.onResult(receipt.result);
  };
  return {
    busy:
      busyScope === scopeRef.current ||
      Boolean(
        scopeRef.current.active &&
        operationRef.current?.owner === scopeRef.current.owner &&
        operationRef.current?.promise === scopeRef.current.promise
      ),
    run,
    onDismiss,
  };
}
