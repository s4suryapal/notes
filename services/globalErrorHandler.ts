import crashlytics from './crashlytics';

export function initGlobalErrorHandler() {
  try {
    const ErrorUtilsRef: any = (global as any).ErrorUtils;
    const prevHandler = ErrorUtilsRef?.getGlobalHandler?.();

    const handler = (error: any, isFatal?: boolean) => {
      try {
        const err = error instanceof Error ? error : new Error(String(error));
        crashlytics.logMessage(`[JS] Global error${isFatal ? ' (fatal)' : ''}`);
        crashlytics.logError(err, 'GlobalError');
      } catch {}
      // Call previous handler to keep RN redbox behavior in dev
      try { prevHandler?.(error, isFatal); } catch {}
    };

    ErrorUtilsRef?.setGlobalHandler?.(handler);
    console.log('[ERROR_HANDLER] Global error handler initialized');
  } catch (e) {
    console.log('[ERROR_HANDLER] Failed to initialize global error handler:', e);
  }

  // Unhandled promise rejections
  try {
    (global as any).onunhandledrejection = (e: any) => {
      try {
        const reason = e?.reason ?? e;
        const err = reason instanceof Error ? reason : new Error(String(reason));
        crashlytics.logMessage('[JS] Unhandled promise rejection');
        crashlytics.logError(err, 'UnhandledPromiseRejection');
      } catch {}
    };
    console.log('[ERROR_HANDLER] Unhandled rejection handler initialized');
  } catch (e) {
    console.log('[ERROR_HANDLER] Failed to initialize rejection handler:', e);
  }
}
