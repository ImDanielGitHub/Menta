const listeners = new Set<() => void>();

/** Notify presentation readers after a confirmed receipt, without exposing its content. */
export const notifyWidgetProofChanged = () => {
  listeners.forEach(listener => listener());
};

export const subscribeWidgetProofChanges = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
