import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType } from '@/components/Toast';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig>({
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = useCallback((newConfig: ToastConfig) => {
    setConfig({
      type: 'info',
      duration: 3000,
      ...newConfig,
    });
    setVisible(true);
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast({ message, type: 'success' });
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast({ message, type: 'error' });
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast({ message, type: 'info' });
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast({ message, type: 'warning' });
  }, [showToast]);

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      <Toast
        visible={visible}
        message={config.message}
        type={config.type}
        duration={config.duration}
        action={config.action}
        onDismiss={handleDismiss}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
