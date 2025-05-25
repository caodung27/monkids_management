import { useCallback } from 'react';
import Logger from '../logger';
import { LogOptions, LogLevel } from '@/types';

export function useLogger(context: string) {
  const log = useCallback(
    (message: string, options: LogOptions = {}) => {
      const { level = 'info', data } = options;
      const logMessage = `[${context}] ${message}`;

      if (data) {
        Logger[level](logMessage, { data });
      } else {
        Logger[level](logMessage);
      }
    },
    [context]
  );

  const logError = useCallback(
    (error: Error | string, options: Omit<LogOptions, 'level'> = {}) => {
      const message = error instanceof Error ? error.message : error;
      log(message, { ...options, level: 'error' });
    },
    [log]
  );

  const logWarning = useCallback(
    (message: string, options: Omit<LogOptions, 'level'> = {}) => {
      log(message, { ...options, level: 'warn' });
    },
    [log]
  );

  const logInfo = useCallback(
    (message: string, options: Omit<LogOptions, 'level'> = {}) => {
      log(message, { ...options, level: 'info' });
    },
    [log]
  );

  const logDebug = useCallback(
    (message: string, options: Omit<LogOptions, 'level'> = {}) => {
      log(message, { ...options, level: 'debug' });
    },
    [log]
  );

  return {
    log,
    logError,
    logWarning,
    logInfo,
    logDebug,
  };
} 