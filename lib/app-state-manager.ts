import { AppState, AppStateStatus } from 'react-native';
import { supabase } from './supabase';

const appStateDebugLog = (..._args: unknown[]): void => undefined;

class AppStateManager {
  private static instance: AppStateManager;
  private listeners: ((state: AppStateStatus) => void)[] = [];
  private subscription: ReturnType<typeof AppState.addEventListener> | null =
    null;
  private isInitialized = false;
  private currentState: AppStateStatus = AppState.currentState;

  static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;

    this.currentState = AppState.currentState;
    this.isInitialized = true;
    this.applyAuthRefreshState(this.currentState);

    this.subscription = AppState.addEventListener('change', state => {
      // React Native can repeat the same status without a real foreground
      // transition. Do not turn duplicate notifications into refetches.
      if (state === this.currentState) return;
      this.currentState = state;
      this.handleAppStateChange(state);
    });

    appStateDebugLog('📱 AppStateManager initialized');
  }

  addListener(listener: (state: AppStateStatus) => void): () => void {
    this.listeners.push(listener);

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private handleAppStateChange(state: AppStateStatus): void {
    appStateDebugLog('📱 App state changed:', state);

    this.applyAuthRefreshState(state);

    // Notify all listeners
    this.listeners.slice().forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in AppState listener:', error);
      }
    });
  }

  private applyAuthRefreshState(state: AppStateStatus): void {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.listeners = [];
    this.isInitialized = false;
    this.currentState = AppState.currentState;
  }
}

export const appStateManager = AppStateManager.getInstance();
