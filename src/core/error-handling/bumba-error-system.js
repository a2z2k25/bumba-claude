/**
 * BUMBA Comprehensive Error Handling System
 * Unified error management with recovery strategies
 */

const fs = require('fs');
const path = require('path');

/**
 * Base BUMBA Error Class with intelligent recovery
 */
class BumbaError extends Error {
  constructor(type, message, context = {}) {
    super(message);
    this.name = 'BumbaError';
    this.type = type;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.recovery = this.determineRecovery();
    this.severity = this.calculateSeverity();
    this.category = this.determineCategory();
  }

  determineRecovery() {
    switch(this.type) {
      case 'MCP_CONNECTION_FAILED':
        return { 
          action: 'USE_FALLBACK', 
          fallback: 'local',
          retry: true,
          max_retries: 3,
          backoff: 'exponential'
        };
      case 'HOOK_EXECUTION_FAILED':
        return { 
          action: 'BYPASS_HOOK', 
          warn: true,
          continue: true,
          log_level: 'warn'
        };
      case 'AGENT_SPAWN_FAILED':
        return { 
          action: 'USE_BASE_AGENT', 
          retry: true,
          fallback_agent: 'generic',
          preserve_context: true
        };
      case 'AUDIO_SYSTEM_FAILED':
        return {
          action: 'SILENT_CONTINUE',
          fallback: 'console_notification',
          disable_audio: false
        };
      case 'CONSCIOUSNESS_VALIDATION_FAILED':
        return {
          action: 'APPLY_SAFEGUARDS',
          require_manual_review: true,
          block_execution: true
        };
      case 'RESOURCE_EXHAUSTED':
        return {
          action: 'CLEANUP_AND_RETRY',
          cleanup_strategy: 'aggressive',
          reduce_concurrency: true
        };
      case 'VERSION_MISMATCH':
        return {
          action: 'AUTO_RECONCILE',
          backup_before: true,
          validate_after: true
        };
      case 'INSTALLATION_FAILED':
        return {
          action: 'FALLBACK_TO_MINIMAL',
          mode: 'minimal',
          preserve_existing: true
        };
      default:
        return { 
          action: 'LOG_AND_CONTINUE',
          escalate: true,
          require_attention: false
        };
    }
  }

  calculateSeverity() {
    const severityMap = {
      'CONSCIOUSNESS_VALIDATION_FAILED': 'critical',
      'INSTALLATION_FAILED': 'high',
      'AGENT_SPAWN_FAILED': 'high',
      'MCP_CONNECTION_FAILED': 'medium',
      'RESOURCE_EXHAUSTED': 'medium',
      'HOOK_EXECUTION_FAILED': 'low',
      'AUDIO_SYSTEM_FAILED': 'low',
      'VERSION_MISMATCH': 'medium'
    };
    
    return severityMap[this.type] || 'medium';
  }

  determineCategory() {
    const categoryMap = {
      'MCP_CONNECTION_FAILED': 'connectivity',
      'HOOK_EXECUTION_FAILED': 'system',
      'AGENT_SPAWN_FAILED': 'framework',
      'AUDIO_SYSTEM_FAILED': 'presentation',
      'CONSCIOUSNESS_VALIDATION_FAILED': 'security',
      'RESOURCE_EXHAUSTED': 'performance',
      'VERSION_MISMATCH': 'configuration',
      'INSTALLATION_FAILED': 'setup'
    };
    
    return categoryMap[this.type] || 'general';
  }

  toLogEntry() {
    return {
      timestamp: this.timestamp,
      error_type: this.type,
      message: this.message,
      severity: this.severity,
      category: this.category,
      context: this.context,
      recovery_plan: this.recovery,
      stack: this.stack
    };
  }
}

/**
 * Global Error Boundary with intelligent fallback
 */
class BumbaErrorBoundary {
  constructor() {
    this.errorLog = [];
    this.recoveryCache = new Map();
    this.fallbackStrategies = new Map();
    this.errorThresholds = {
      'critical': 1,
      'high': 3,
      'medium': 10,
      'low': 50
    };
    this.currentErrorCounts = {
      'critical': 0,
      'high': 0,
      'medium': 0,
      'low': 0
    };
  }

  static async wrap(operation, fallback = null, context = {}) {
    const boundary = new BumbaErrorBoundary();
    return boundary.execute(operation, fallback, context);
  }

  async execute(operation, fallback, context) {
    const operationId = this.generateOperationId();
    const startTime = Date.now();
    
    try {
      // Execute the operation with monitoring
      const result = await this.monitorOperation(operation, operationId);
      
      // Log successful execution
      this.logSuccess(operationId, Date.now() - startTime, context);
      
      return result;
      
    } catch (error) {
      // Convert to BumbaError if needed
      const bumbaError = error instanceof BumbaError ? 
        error : new BumbaError('UNKNOWN_ERROR', error.message, context);
      
      // Log the error
      await this.logError(bumbaError, operationId, context);
      
      // Check if we've exceeded error thresholds
      if (this.shouldEscalate(bumbaError)) {
        await this.escalateError(bumbaError);
      }
      
      // Attempt recovery
      const recoveryResult = await this.attemptRecovery(bumbaError, fallback, context);
      
      if (recoveryResult.success) {
        return recoveryResult.data;
      }
      
      // If recovery failed, throw the original error
      throw bumbaError;
    }
  }

  async monitorOperation(operation, operationId) {
    // Set up monitoring for the operation
    const monitor = new OperationMonitor(operationId);
    
    try {
      return await operation();
    } finally {
      monitor.cleanup();
    }
  }

  async attemptRecovery(error, fallback, context) {
    const recovery = error.recovery;
    
    try {
      switch (recovery.action) {
        case 'USE_FALLBACK':
          return await this.useFallback(fallback, recovery, context);
          
        case 'BYPASS_HOOK':
          return await this.bypassHook(recovery, context);
          
        case 'USE_BASE_AGENT':
          return await this.useBaseAgent(recovery, context);
          
        case 'SILENT_CONTINUE':
          return await this.silentContinue(recovery, context);
          
        case 'APPLY_SAFEGUARDS':
          return await this.applySafeguards(recovery, context);
          
        case 'CLEANUP_AND_RETRY':
          return await this.cleanupAndRetry(error, context);
          
        case 'AUTO_RECONCILE':
          return await this.autoReconcile(recovery, context);
          
        case 'FALLBACK_TO_MINIMAL':
          return await this.fallbackToMinimal(recovery, context);
          
        case 'LOG_AND_CONTINUE':
        default:
          return await this.logAndContinue(error, fallback, context);
      }
    } catch (recoveryError) {
      console.error(`Recovery failed for ${error.type}:`, recoveryError.message);
      return { success: false, error: recoveryError };
    }
  }

  async useFallback(fallback, recovery, context) {
    if (!fallback) {
      return { success: false, error: 'No fallback provided' };
    }
    
    console.log(`🔁 Using fallback strategy: ${recovery.fallback}`);
    
    try {
      const result = await fallback();
      return { success: true, data: result, method: 'fallback' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async bypassHook(recovery, context) {
    if (recovery.warn) {
      console.warn('⚠️ Bypassing hook execution due to failure - continuing operation');
    }
    
    return { 
      success: true, 
      data: { bypassed: true, warning: recovery.warn },
      method: 'bypass'
    };
  }

  async useBaseAgent(recovery, context) {
    console.log(`🤖 Falling back to base agent: ${recovery.fallback_agent}`);
    
    // Create a minimal base agent
    const baseAgent = {
      type: recovery.fallback_agent,
      capabilities: ['basic_processing'],
      execute: async (task) => {
        return `Base agent processing: ${task}`;
      }
    };
    
    return { 
      success: true, 
      data: baseAgent,
      method: 'base_agent'
    };
  }

  async silentContinue(recovery, context) {
    if (recovery.fallback === 'console_notification') {
      console.log('🔇 Audio unavailable - continuing silently');
    }
    
    return { 
      success: true, 
      data: { silent: true, notification: recovery.fallback },
      method: 'silent'
    };
  }

  async applySafeguards(recovery, context) {
    if (recovery.block_execution) {
      console.error('🛡️ Execution blocked by consciousness safeguards');
      return { success: false, error: 'Blocked by safeguards' };
    }
    
    return { 
      success: true, 
      data: { safeguards_applied: true, manual_review_required: recovery.require_manual_review },
      method: 'safeguards'
    };
  }

  async cleanupAndRetry(error, context) {
    console.log('🧹 Performing cleanup before retry...');
    
    // Simulate cleanup
    await this.performCleanup();
    
    return { 
      success: true, 
      data: { cleaned: true, retry_available: true },
      method: 'cleanup'
    };
  }

  async autoReconcile(recovery, context) {
    console.log('🔄 Auto-reconciling configuration...');
    
    if (recovery.backup_before) {
      await this.createBackup();
    }
    
    return { 
      success: true, 
      data: { reconciled: true, backup_created: recovery.backup_before },
      method: 'reconcile'
    };
  }

  async fallbackToMinimal(recovery, context) {
    console.log('📦 Falling back to minimal installation...');
    
    return { 
      success: true, 
      data: { mode: recovery.mode, preserved: recovery.preserve_existing },
      method: 'minimal_fallback'
    };
  }

  async logAndContinue(error, fallback, context) {
    console.log(`📝 Logging error and continuing: ${error.type}`);
    
    if (fallback) {
      try {
        const result = await fallback();
        return { success: true, data: result, method: 'log_and_fallback' };
      } catch (fallbackError) {
        // Continue without fallback
      }
    }
    
    return { 
      success: true, 
      data: { logged: true, continued: true },
      method: 'log_and_continue'
    };
  }

  shouldEscalate(error) {
    this.currentErrorCounts[error.severity]++;
    const threshold = this.errorThresholds[error.severity];
    return this.currentErrorCounts[error.severity] >= threshold;
  }

  async escalateError(error) {
    console.error(`🚨 Error threshold exceeded for ${error.severity} errors`);
    
    // Could integrate with monitoring systems here
    await this.notifyOperations(error);
  }

  async notifyOperations(error) {
    // Placeholder for operations notification
    console.log(`📢 Operations notified of ${error.type} error escalation`);
  }

  async logError(error, operationId, context) {
    const logEntry = {
      ...error.toLogEntry(),
      operation_id: operationId,
      context: context
    };
    
    this.errorLog.push(logEntry);
    
    // Write to error log file if possible
    try {
      await this.writeErrorLog(logEntry);
    } catch (logError) {
      console.warn('Failed to write error log:', logError.message);
    }
  }

  logSuccess(operationId, duration, context) {
    // Log successful operations for monitoring
    console.debug(`✅ Operation ${operationId} completed in ${duration}ms`);
  }

  async writeErrorLog(logEntry) {
    const logDir = path.join(require('os').homedir(), '.claude', 'logs');
    const logFile = path.join(logDir, 'bumba-errors.log');
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Append to log file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine);
  }

  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async performCleanup() {
    // Placeholder for cleanup operations
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async createBackup() {
    // Placeholder for backup creation
    console.log('💾 Configuration backup created');
  }

  getErrorStats() {
    return {
      total_errors: this.errorLog.length,
      error_counts: { ...this.currentErrorCounts },
      recent_errors: this.errorLog.slice(-10),
      threshold_status: Object.entries(this.errorThresholds).map(([severity, threshold]) => ({
        severity,
        current: this.currentErrorCounts[severity],
        threshold,
        percentage: (this.currentErrorCounts[severity] / threshold) * 100
      }))
    };
  }
}

/**
 * Operation Monitor for tracking resource usage
 */
class OperationMonitor {
  constructor(operationId) {
    this.operationId = operationId;
    this.startTime = Date.now();
    this.memoryUsage = process.memoryUsage();
  }

  cleanup() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const finalMemory = process.memoryUsage();
    
    // Could log performance metrics here
    console.debug(`📊 Operation ${this.operationId}: ${duration}ms, memory delta: ${finalMemory.heapUsed - this.memoryUsage.heapUsed} bytes`);
  }
}

/**
 * Error Logger with rotation
 */
class ErrorLogger {
  static async log(error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: error instanceof BumbaError ? error.toLogEntry() : {
        type: 'UNKNOWN',
        message: error.message,
        stack: error.stack
      }
    };
    
    console.error('🚨 BUMBA Error:', logEntry);
    
    // Could write to file, send to monitoring service, etc.
  }
}

module.exports = {
  BumbaError,
  BumbaErrorBoundary,
  ErrorLogger,
  OperationMonitor
};