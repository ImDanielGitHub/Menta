import { nanoid } from 'nanoid/non-secure';

export type PaywallContext = 'challenge' | 'group' | 'member' | 'general';

export type PaywallOpenOptions = {
  context?: PaywallContext;
  shortfall?: number;
  /** Opens the confirmed-access view instead of purchase plans. */
  initialView?: 'plans' | 'active';
  /** Called only after the paywall has confirmed Pro access. */
  onProConfirmed?: () => void;
};

type Listener = (opts: PaywallOpenOptions & { id: string }) => void;
type VisibilityListener = (visible: boolean) => void;

class PaywallManager {
  private listeners: Set<Listener> = new Set();
  private visibilityListeners: Set<VisibilityListener> = new Set();
  private visible = false;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeVisibility(listener: VisibilityListener) {
    this.visibilityListeners.add(listener);
    listener(this.visible);
    return () => {
      this.visibilityListeners.delete(listener);
    };
  }

  get isVisible(): boolean {
    return this.visible;
  }

  setVisible(visible: boolean) {
    if (this.visible === visible) return;
    this.visible = visible;
    this.visibilityListeners.forEach(listener => {
      try {
        listener(visible);
      } catch {}
    });
  }

  open(options: PaywallOpenOptions = {}) {
    const payload = { id: nanoid(), ...options };
    this.listeners.forEach(l => {
      try {
        l(payload);
      } catch {}
    });
  }
}

export const paywallManager = new PaywallManager();

export function openPaywall(options: PaywallOpenOptions = {}) {
  paywallManager.open(options);
}
