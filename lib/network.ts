import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { logError, addBreadcrumb } from './sentry';
import { isNetworkStateOnline } from './network-state';
import { translate } from '@/lib/localization';

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  isWifiEnabled?: boolean;
}

class NetworkManager {
  private listeners: ((state: NetworkState) => void)[] = [];
  private currentState: NetworkState = {
    isConnected: null,
    isInternetReachable: null,
    type: 'unknown',
  };
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Get initial network state
      const state = await NetInfo.fetch();
      this.updateState(state);

      // Subscribe to network state updates
      NetInfo.addEventListener(state => {
        this.updateState(state);
      });
    } catch (error) {
      logError(new Error('Failed to initialize network manager'), { error });
    }
  }

  private updateState(netInfoState: NetInfoState) {
    const newState: NetworkState = {
      isConnected: netInfoState.isConnected ?? null,
      isInternetReachable: netInfoState.isInternetReachable ?? null,
      type: netInfoState.type || 'unknown',
      isWifiEnabled:
        'isWifiEnabled' in netInfoState
          ? netInfoState.isWifiEnabled
          : undefined,
    };

    const wasConnected = this.currentState.isConnected;
    const isNowConnected = newState.isConnected;

    this.currentState = newState;
    this.initialized = true;

    // Log connectivity changes
    if (isNowConnected !== null && wasConnected !== isNowConnected) {
      addBreadcrumb(
        `Network ${isNowConnected ? 'connected' : 'disconnected'}`,
        {
          category: 'network',
          level: isNowConnected ? 'info' : 'warning',
          previousState: wasConnected,
          currentState: isNowConnected,
          type: newState.type,
        }
      );
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        logError(new Error('Network listener error'), { error });
      }
    });
  }

  public getState(): NetworkState {
    return { ...this.currentState };
  }

  public isOnline(): boolean {
    // Before we receive any NetInfo event, assume online to avoid false negatives
    if (!this.initialized) {
      return true;
    }

    return isNetworkStateOnline(this.currentState);
  }

  public addListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async checkConnectivity(): Promise<NetworkState> {
    try {
      const state = await NetInfo.refresh();
      this.updateState(state);
      return this.currentState;
    } catch (error) {
      logError(new Error('Failed to check connectivity'), { error });
      return this.currentState;
    }
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();

export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(
    networkManager.getState()
  );

  useEffect(() => {
    const unsubscribe = networkManager.addListener(setNetworkState);
    const appStateSubscription = AppState.addEventListener(
      'change',
      nextState => {
        if (nextState === 'active') {
          void networkManager.checkConnectivity();
        }
      }
    );
    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  return {
    ...networkState,
    isOnline: isNetworkStateOnline(networkState),
    refresh: () => networkManager.checkConnectivity(),
  };
};

// Network error handling utilities
export const handleNetworkError = (error: unknown): string => {
  if (!networkManager.isOnline()) {
    return translate('en-NZ', 'domain.network.no_connection');
  }

  const record =
    error && typeof error === 'object'
      ? (error as { code?: unknown; message?: unknown })
      : null;
  const message =
    typeof record?.message === 'string' ? record.message : String(error ?? '');
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('timeout')) {
    return translate('en-NZ', 'domain.network.request_timed_out');
  }

  if (normalizedMessage.includes('network')) {
    return translate('en-NZ', 'domain.network.error');
  }

  if (record?.code === 'NETWORK_ERROR') {
    return translate('en-NZ', 'domain.network.try_later');
  }

  // Common JSON parse error when an HTML error page is returned from server
  const msg = normalizedMessage;
  if (
    msg.includes('unexpected token <') ||
    (msg.includes('json') && msg.includes('parse')) ||
    msg.includes('in json at position')
  ) {
    return translate('en-NZ', 'domain.network.service_unavailable');
  }

  return message || translate('en-NZ', 'domain.network.generic_error');
};

// Retry mechanism for network requests
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  endpoint: string = 'unknown'
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error as Error;

      addBreadcrumb(`Retry attempt ${attempt}/${maxRetries}`, {
        category: 'network',
        endpoint,
        outcome: 'failed',
      });

      // Don't retry if offline
      if (!networkManager.isOnline()) {
        break;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

// Queue for offline operations
interface QueuedOperation {
  id: string;
  operation: () => Promise<unknown>;
  description: string;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;

  constructor() {
    // Process queue when coming back online
    networkManager.addListener(state => {
      if (state.isConnected && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  public add(operation: () => Promise<unknown>, description: string): string {
    const id = Date.now().toString();
    this.queue.push({
      id,
      operation,
      description,
      timestamp: Date.now(),
    });

    addBreadcrumb('Added operation to offline queue', {
      category: 'offline',
    });

    // Try to process immediately if online
    if (networkManager.isOnline()) {
      this.processQueue();
    }

    return id;
  }

  public remove(id: string): boolean {
    const index = this.queue.findIndex(op => op.id === id);
    if (index > -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public getQueuedOperations(): {
    id: string;
    description: string;
    timestamp: number;
  }[] {
    return this.queue.map(op => ({
      id: op.id,
      description: op.description,
      timestamp: op.timestamp,
    }));
  }

  private async processQueue() {
    if (this.isProcessing || !networkManager.isOnline()) {
      return;
    }

    this.isProcessing = true;

    addBreadcrumb('Processing offline queue', {
      category: 'offline',
      operation_count_bucket:
        this.queue.length <= 1
          ? '1'
          : this.queue.length <= 5
            ? '2_5'
            : '6_plus',
    });

    const operationsToProcess = [...this.queue];
    this.queue = [];

    for (const queuedOp of operationsToProcess) {
      if (!networkManager.isOnline()) {
        // Put remaining operations back in queue
        this.queue.unshift(queuedOp);
        break;
      }

      try {
        await queuedOp.operation();
        addBreadcrumb('Offline operation completed', {
          category: 'offline',
        });
      } catch (error) {
        logError(new Error('Offline operation failed'), { error });
        // Put failed operation back in queue for later retry
        this.queue.push(queuedOp);
      }
    }

    this.isProcessing = false;
  }
}

export const offlineQueue = new OfflineQueue();
