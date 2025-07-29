/**
 * BUMBA Global Error Boundary
 * Catches and handles all unhandled errors and promise rejections
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class GlobalErrorBoundary {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.errorHandlers = new Map();
    this.recoveryStrategies = new Map();
    this.isShuttingDown = false;
    
    // Error categorization
    this.errorCategories = {
      ASYNC_ERROR: 'async_error',
      PROMISE_REJECTION: 'promise_rejection',
      SYNC_ERROR: 'sync_error',
      SYSTEM_ERROR: 'system_error',
      SECURITY_ERROR: 'security_error',
      VALIDATION_ERROR: 'validation_error'
    };
    
    this.setupGlobalHandlers();
    this.setupDefaultRecoveryStrategies();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error, origin) => {
      this.handleError(error, {
        category: this.errorCategories.SYNC_ERROR,
        origin,
        fatal: true
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.handleError(reason, {
        category: this.errorCategories.PROMISE_REJECTION,
        promise,
        fatal: false
      });
    });

    // Handle warnings
    process.on('warning', (warning) => {
      this.handleWarning(warning);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  /**
   * Setup default recovery strategies
   */
  setupDefaultRecoveryStrategies() {
    // Network errors - retry with exponential backoff
    this.recoveryStrategies.set('ECONNREFUSED', async (error, context) => {
      if (context.retryCount < 3) {
        const delay = Math.pow(2, context.retryCount) * 1000;
        await this.delay(delay);
        return { retry: true, delay };
      }
      return { retry: false };
    });

    // File system errors - create directory if missing
    this.recoveryStrategies.set('ENOENT', async (error, context) => {
      if (context.operation === 'write' && error.path) {
        try {
          const dir = path.dirname(error.path);
          await fs.mkdir(dir, { recursive: true });
          return { retry: true, recovered: true };
        } catch (mkdirError) {
          return { retry: false, error: mkdirError };
        }
      }
      return { retry: false };
    });

    // Memory errors - trigger garbage collection
    this.recoveryStrategies.set('ENOMEM', async (error, context) => {
      if (global.gc) {
        global.gc();
        return { retry: true, gcTriggered: true };
      }
      return { retry: false };
    });
  }

  /**
   * Wrap async function with error boundary
   */
  async wrapAsync(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      return await this.handleError(error, {
        ...context,
        category: this.errorCategories.ASYNC_ERROR,
        wrapped: true
      });
    }
  }

  /**
   * Wrap sync function with error boundary
   */
  wrapSync(fn, context = {}) {
    try {
      return fn();
    } catch (error) {
      return this.handleError(error, {
        ...context,
        category: this.errorCategories.SYNC_ERROR,
        wrapped: true
      });
    }
  }

  /**
   * Central error handler
   */
  async handleError(error, context = {}) {
    // Prevent recursive error handling
    if (error._handled) return;
    error._handled = true;

    // Create error record
    const errorRecord = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      code: error.code,
      category: context.category || this.errorCategories.SYSTEM_ERROR,
      context: this.sanitizeContext(context),
      pid: process.pid,
      platform: os.platform(),
      nodeVersion: process.version
    };

    // Log error
    this.logError(errorRecord);

    // Try recovery strategy
    const recovered = await this.attemptRecovery(error, context);
    if (recovered) {
      errorRecord.recovered = true;
      return recovered;
    }

    // Execute registered error handlers
    for (const [pattern, handler] of this.errorHandlers) {
      if (this.matchesPattern(error, pattern)) {
        try {
          const result = await handler(error, context);
          if (result && result.handled) {
            errorRecord.handledBy = pattern;
            return result;
          }
        } catch (handlerError) {
          console.error('Error handler failed:', handlerError);
        }
      }
    }

    // Write to error log file
    await this.writeErrorLog(errorRecord);

    // Fatal error handling
    if (context.fatal || this.isFatalError(error)) {
      await this.handleFatalError(error, errorRecord);
    }

    return { error: errorRecord, handled: true };
  }

  /**
   * Attempt to recover from error
   */
  async attemptRecovery(error, context) {
    const strategy = this.recoveryStrategies.get(error.code);
    if (!strategy) return null;

    try {
      const result = await strategy(error, {
        ...context,
        retryCount: context.retryCount || 0
      });

      if (result.retry && context.retryFunction) {
        return await this.wrapAsync(
          context.retryFunction,
          {
            ...context,
            retryCount: (context.retryCount || 0) + 1
          }
        );
      }

      return result.recovered ? result : null;
    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError);
      return null;
    }
  }

  /**
   * Handle warnings
   */
  handleWarning(warning) {
    const warningRecord = {
      timestamp: new Date().toISOString(),
      type: 'warning',
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    };

    this.logError(warningRecord);
  }

  /**
   * Log error to memory (with size limit)
   */
  logError(errorRecord) {
    this.errorLog.push(errorRecord);
    
    // Maintain size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * Write error to log file
   */
  async writeErrorLog(errorRecord) {
    try {
      const logDir = path.join(os.homedir(), '.claude', 'logs');
      await fs.mkdir(logDir, { recursive: true });
      
      const logFile = path.join(logDir, `bumba-errors-${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = JSON.stringify(errorRecord) + '\n';
      
      await fs.appendFile(logFile, logEntry);
    } catch (writeError) {
      // Silently fail - don't want to create error loop
      console.error('Failed to write error log:', writeError.message);
    }
  }

  /**
   * Determine if error is fatal
   */
  isFatalError(error) {
    const fatalCodes = ['EACCES', 'EPERM', 'ENOSPC'];
    const fatalPatterns = [/out of memory/i, /maximum call stack/i];
    
    if (fatalCodes.includes(error.code)) return true;
    
    return fatalPatterns.some(pattern => 
      pattern.test(error.message || '')
    );
  }

  /**
   * Handle fatal errors
   */
  async handleFatalError(error, errorRecord) {
    console.error('\n🚨 FATAL ERROR DETECTED 🚨');
    console.error('Error:', error.message);
    console.error('Category:', errorRecord.category);
    
    // Try to save state before exit
    await this.saveEmergencyState(errorRecord);
    
    // Graceful shutdown
    await this.gracefulShutdown('FATAL_ERROR');
  }

  /**
   * Save emergency state
   */
  async saveEmergencyState(errorRecord) {
    try {
      const stateFile = path.join(os.tmpdir(), `bumba-crash-${Date.now()}.json`);
      const state = {
        error: errorRecord,
        errorLog: this.errorLog.slice(-10), // Last 10 errors
        timestamp: new Date().toISOString(),
        recovery: 'Restart BUMBA and check logs'
      };
      
      await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
      console.log(`Emergency state saved to: ${stateFile}`);
    } catch (saveError) {
      console.error('Failed to save emergency state:', saveError.message);
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    console.log(`\n🏁 Graceful shutdown initiated (${signal})...`);
    
    try {
      // Give async operations time to complete
      await this.delay(1000);
      
      // Final log
      console.log('🏁 BUMBA shutdown complete');
      
      process.exit(signal === 'FATAL_ERROR' ? 1 : 0);
    } catch (shutdownError) {
      console.error('Shutdown error:', shutdownError);
      process.exit(1);
    }
  }

  /**
   * Register custom error handler
   */
  registerErrorHandler(pattern, handler) {
    this.errorHandlers.set(pattern, handler);
  }

  /**
   * Register recovery strategy
   */
  registerRecoveryStrategy(errorCode, strategy) {
    this.recoveryStrategies.set(errorCode, strategy);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byCategory: {},
      byCode: {},
      recovered: 0,
      fatal: 0
    };

    for (const error of this.errorLog) {
      // By category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      
      // By code
      if (error.code) {
        stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      }
      
      // Recovered
      if (error.recovered) stats.recovered++;
      
      // Fatal
      if (error.category === 'fatal') stats.fatal++;
    }

    return stats;
  }

  /**
   * Utility: Check if error matches pattern
   */
  matchesPattern(error, pattern) {
    if (typeof pattern === 'string') {
      return error.code === pattern || error.message?.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(error.message || '');
    }
    return false;
  }

  /**
   * Utility: Sanitize context for logging
   */
  sanitizeContext(context) {
    const sanitized = { ...context };
    
    // Remove sensitive data
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    
    // Remove circular references
    try {
      JSON.stringify(sanitized);
      return sanitized;
    } catch {
      return { note: 'Context contained circular references' };
    }
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let instance = null;

module.exports = {
  GlobalErrorBoundary,
  
  // Get singleton instance
  getInstance() {
    if (!instance) {
      instance = new GlobalErrorBoundary();
    }
    return instance;
  },
  
  // Convenience exports
  wrapAsync: async (fn, context) => {
    return getInstance().wrapAsync(fn, context);
  },
  
  wrapSync: (fn, context) => {
    return getInstance().wrapSync(fn, context);
  }
};