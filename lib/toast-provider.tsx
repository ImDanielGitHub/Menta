import React, { createContext, useContext, ReactNode } from 'react';
import { ToastProvider as UIToastProvider } from '@/components/ui/Toast';
import { presentToastMessage } from '@/lib/ui/toast-chrome';

interface ToastContextType {
  showToast: (message: string, type?: 'error' | 'success' | 'info') => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // Prefer the shared non-blocking toast rail. The ToastManager queues items
  // before the visual provider subscribes, so a dialog fallback would only
  // steal context from the route that owns the action.
  const showToast = (
    message: string,
    type: 'error' | 'success' | 'info' = 'info'
  ) => {
    try {
      presentToastMessage(message, type);
    } catch (error) {
      console.warn('[ToastProvider] Failed to show toast:', error);
    }
  };

  const showError = (message: string) => {
    showToast(message, 'error');
  };

  const showSuccess = (message: string) => {
    showToast(message, 'success');
  };

  const value: ToastContextType = {
    showToast,
    showError,
    showSuccess,
  };

  return (
    <ToastContext.Provider value={value}>
      <UIToastProvider>{children}</UIToastProvider>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Global toast function for use outside of React components
let globalToastFunction:
  ((message: string, type?: 'error' | 'success' | 'info') => void) | null =
  null;

export const setGlobalToast = (
  toastFn: (message: string, type?: 'error' | 'success' | 'info') => void
) => {
  globalToastFunction = toastFn;
};

export const showGlobalToast = (
  message: string,
  type: 'error' | 'success' | 'info' = 'info'
) => {
  try {
    if (globalToastFunction) {
      globalToastFunction(message, type);
      return;
    }
    presentToastMessage(message, type);
  } catch (error) {
    console.warn('[ToastProvider] Failed to show global toast:', error);
  }
};
