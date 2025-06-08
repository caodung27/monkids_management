const Logger = {
  info: (...args: any[]): void => console.info('[INFO]', ...args),
  warn: (...args: any[]): void => console.warn('[WARN]', ...args),
  error: (...args: any[]): void => console.error('[ERROR]', ...args),
  debug: (...args: any[]): void => console.debug('[DEBUG]', ...args),
};

export default Logger; 