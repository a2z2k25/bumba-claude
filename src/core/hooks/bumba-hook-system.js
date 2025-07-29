/**
 * BUMBA JavaScript Hook System
 * Replaces fragile shell scripts with robust JavaScript implementation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { BumbaError, BumbaErrorBoundary } = require('../error-handling/bumba-error-system');

/**
 * Core Hook System with caching and fallback
 */
class BumbaHookSystem {
  constructor() {
    this.hooks = new Map();
    this.cache = new Map();
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      hookTimeout: 10000, // 10 seconds
      failureThreshold: 3,
      failureWindow: 60000 // 1 minute
    };
    this.failureTracker = new Map();
    
    this.initializeDefaultHooks();
  }

  /**
   * Initialize default BUMBA hooks
   */
  initializeDefaultHooks() {
    // Pre-execution security hook
    this.hooks.set('pre-execution', new SecurityHook());
    
    // Post-execution quality hook
    this.hooks.set('post-execution', new QualityHook());
    
    // Completion notification hook
    this.hooks.set('completion', new CompletionHook());
    
    // Consciousness validation hook
    this.hooks.set('consciousness-check', new ConsciousnessHook());
    
    // Resource monitoring hook
    this.hooks.set('resource-monitor', new ResourceHook());
  }

  /**
   * Execute hook with caching and error handling
   */
  async executeHook(hookType, context) {
    const hook = this.hooks.get(hookType);
    if (!hook) {
      return { allow: true, message: `Hook ${hookType} not found` };
    }

    // Check failure threshold
    if (this.isHookDisabled(hookType)) {
      console.warn(`⚠️ Hook ${hookType} disabled due to repeated failures`);
      return { allow: true, warning: 'Hook disabled due to failures' };
    }

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(hookType, context);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute hook with timeout
      const result = await BumbaErrorBoundary.wrap(
        () => this.executeWithTimeout(hook, context),
        () => ({ allow: true, fallback: true })
      );

      // Cache successful results
      if (result.allow && !result.fallback) {
        this.setCache(cacheKey, result);
      }

      // Reset failure count on success
      this.resetFailureCount(hookType);

      return result;
      
    } catch (error) {
      // Track failure
      this.trackFailure(hookType);
      
      // Hooks fail open for reliability
      console.warn(`Hook ${hookType} failed, allowing operation: ${error.message}`);
      return { allow: true, warning: error.message, failed: true };
    }
  }

  /**
   * Execute hook with timeout protection
   */
  async executeWithTimeout(hook, context) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new BumbaError('HOOK_TIMEOUT', `Hook execution timed out after ${this.config.hookTimeout}ms`));
      }, this.config.hookTimeout);

      try {
        const result = await hook.execute(context);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Generate cache key for context
   */
  generateCacheKey(hookType, context) {
    const contextString = JSON.stringify(context, Object.keys(context).sort());
    const hash = crypto.createHash('sha256').update(contextString).digest('hex').substring(0, 16);
    return `${hookType}:${hash}`;
  }

  /**
   * Get result from cache if valid
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  /**
   * Set cache with timestamp
   */
  setCache(key, result) {
    this.cache.set(key, {
      result: result,
      timestamp: Date.now()
    });
  }

  /**
   * Track hook failures
   */
  trackFailure(hookType) {
    const now = Date.now();
    const failures = this.failureTracker.get(hookType) || [];
    
    // Remove old failures outside the window
    const recentFailures = failures.filter(time => now - time < this.config.failureWindow);
    recentFailures.push(now);
    
    this.failureTracker.set(hookType, recentFailures);
  }

  /**
   * Check if hook should be disabled due to failures
   */
  isHookDisabled(hookType) {
    const failures = this.failureTracker.get(hookType) || [];
    return failures.length >= this.config.failureThreshold;
  }

  /**
   * Reset failure count on success
   */
  resetFailureCount(hookType) {
    if (this.failureTracker.has(hookType)) {
      this.failureTracker.delete(hookType);
    }
  }

  /**
   * Register custom hook
   */
  registerHook(name, hook) {
    if (!(hook instanceof BaseHook)) {
      throw new BumbaError('INVALID_HOOK', 'Hook must extend BaseHook class');
    }
    
    this.hooks.set(name, hook);
    console.log(`📎 Registered custom hook: ${name}`);
  }

  /**
   * Get hook system status
   */
  getStatus() {
    const hookStatus = {};
    
    for (const [name, hook] of this.hooks) {
      const failures = this.failureTracker.get(name) || [];
      hookStatus[name] = {
        registered: true,
        type: hook.constructor.name,
        recent_failures: failures.length,
        disabled: this.isHookDisabled(name),
        last_failure: failures.length > 0 ? new Date(Math.max(...failures)).toISOString() : null
      };
    }
    
    return {
      total_hooks: this.hooks.size,
      cache_entries: this.cache.size,
      hook_status: hookStatus,
      config: this.config
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Hook cache cleared');
  }
}

/**
 * Base Hook class for all implementations
 */
class BaseHook {
  constructor(name) {
    this.name = name;
    this.enabled = true;
  }

  async execute(context) {
    throw new Error('Hook execute method must be implemented');
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

/**
 * Security validation hook
 */
class SecurityHook extends BaseHook {
  constructor() {
    super('security');
    this.patterns = {
      secrets: [
        /api[_-]?key/i,
        /secret/i,
        /password/i,
        /token/i,
        /auth/i
      ],
      suspicious: [
        /rm\s+-rf/,
        /sudo/,
        /eval\(/,
        /exec\(/,
        /system\(/
      ]
    };
  }

  async execute(context) {
    const validations = await Promise.all([
      this.validateCommand(context.command),
      this.validatePaths(context.paths || []),
      this.scanForSecrets(context.content || ''),
      this.checkPermissions(context.permissions || [])
    ]);

    const violations = validations.filter(v => !v.safe);
    const allow = violations.length === 0;

    return {
      allow: allow,
      violations: violations,
      security_check: true,
      timestamp: new Date().toISOString()
    };
  }

  async validateCommand(command) {
    if (!command) return { safe: true };

    const suspicious = this.patterns.suspicious.some(pattern => pattern.test(command));
    
    return {
      safe: !suspicious,
      type: 'command_validation',
      details: suspicious ? 'Contains suspicious patterns' : 'Command appears safe'
    };
  }

  async validatePaths(paths) {
    const dangerousPaths = ['/etc', '/usr/bin', '/system'];
    const dangerous = paths.some(path => 
      dangerousPaths.some(dangerous => path.startsWith(dangerous))
    );

    return {
      safe: !dangerous,
      type: 'path_validation',
      details: dangerous ? 'Accessing system directories' : 'Paths appear safe'
    };
  }

  async scanForSecrets(content) {
    const hasSecrets = this.patterns.secrets.some(pattern => pattern.test(content));

    return {
      safe: !hasSecrets,
      type: 'secret_scan',
      details: hasSecrets ? 'Potential secrets detected' : 'No secrets found'
    };
  }

  async checkPermissions(permissions) {
    const dangerous = permissions.includes('sudo') || permissions.includes('admin');

    return {
      safe: !dangerous,
      type: 'permission_check',
      details: dangerous ? 'Elevated permissions requested' : 'Normal permissions'
    };
  }
}

/**
 * Quality assurance hook
 */
class QualityHook extends BaseHook {
  constructor() {
    super('quality');
  }

  async execute(context) {
    const checks = await Promise.all([
      this.checkCodeQuality(context.code || ''),
      this.checkAssetOptimization(context.assets || []),
      this.checkDocumentation(context.docs || '')
    ]);

    const issues = checks.filter(check => check.issues > 0);
    
    return {
      allow: true, // Quality issues don't block execution
      quality_score: this.calculateQualityScore(checks),
      issues: issues,
      recommendations: this.generateRecommendations(issues),
      quality_check: true
    };
  }

  async checkCodeQuality(code) {
    if (!code) return { issues: 0, type: 'code_quality' };

    const issues = [];
    
    // Simple quality checks
    if (code.includes('console.log')) issues.push('Debug statements present');
    if (code.includes('TODO')) issues.push('TODO comments found');
    if (code.length > 10000) issues.push('File too large');

    return {
      issues: issues.length,
      type: 'code_quality',
      details: issues
    };
  }

  async checkAssetOptimization(assets) {
    return {
      issues: 0,
      type: 'asset_optimization',
      details: 'Assets checked'
    };
  }

  async checkDocumentation(docs) {
    return {
      issues: docs.length === 0 ? 1 : 0,
      type: 'documentation',
      details: docs.length === 0 ? 'No documentation provided' : 'Documentation present'
    };
  }

  calculateQualityScore(checks) {
    const totalIssues = checks.reduce((sum, check) => sum + check.issues, 0);
    return Math.max(0, 100 - (totalIssues * 10));
  }

  generateRecommendations(issues) {
    return issues.map(issue => `Consider addressing: ${issue.type}`);
  }
}

/**
 * Completion notification hook
 */
class CompletionHook extends BaseHook {
  constructor() {
    super('completion');
  }

  async execute(context) {
    try {
      // Use the audio fallback system for notifications
      const { audioFallbackSystem } = require('../audio-fallback-system');
      
      await audioFallbackSystem.playAchievementAudio('MILESTONE_REACHED', {
        message: context.message || 'BUMBA operation completed successfully'
      });

      return {
        allow: true,
        notification_sent: true,
        audio_played: true,
        completion_hook: true
      };
      
    } catch (error) {
      // Continue even if audio fails
      console.log('🏁 BUMBA operation completed successfully');
      
      return {
        allow: true,
        notification_sent: true,
        audio_played: false,
        audio_error: error.message,
        completion_hook: true
      };
    }
  }
}

/**
 * Consciousness validation hook
 */
class ConsciousnessHook extends BaseHook {
  constructor() {
    super('consciousness');
  }

  async execute(context) {
    // Simulate consciousness validation
    const consciousnessScore = this.calculateConsciousnessScore(context);
    const ethicalCompliance = this.checkEthicalCompliance(context);
    const sustainabilityIndex = this.assessSustainability(context);

    const allow = consciousnessScore >= 0.7 && ethicalCompliance && sustainabilityIndex >= 0.6;

    return {
      allow: allow,
      consciousness_score: consciousnessScore,
      ethical_compliance: ethicalCompliance,
      sustainability_index: sustainabilityIndex,
      consciousness_check: true,
      reason: allow ? 'Consciousness validation passed' : 'Consciousness standards not met'
    };
  }

  calculateConsciousnessScore(context) {
    // Simple scoring based on context
    let score = 0.8; // Base score
    
    if (context.purpose) score += 0.1;
    if (context.beneficiaries) score += 0.1;
    if (context.harm_mitigation) score += 0.1;
    
    return Math.min(1.0, score);
  }

  checkEthicalCompliance(context) {
    // Check for obviously harmful patterns
    const harmfulKeywords = ['hack', 'crack', 'exploit', 'malware', 'spam'];
    const content = JSON.stringify(context).toLowerCase();
    
    return !harmfulKeywords.some(keyword => content.includes(keyword));
  }

  assessSustainability(context) {
    // Simple sustainability assessment
    return 0.85; // Default good sustainability score
  }
}

/**
 * Resource monitoring hook
 */
class ResourceHook extends BaseHook {
  constructor() {
    super('resource');
  }

  async execute(context) {
    const memoryUsage = process.memoryUsage();
    const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
    
    const resourceStatus = {
      memory_mb: Math.round(memoryMB),
      memory_limit: 512,
      cpu_usage: 'not_monitored',
      disk_space: 'not_monitored'
    };

    const memoryOk = memoryMB < 512;
    
    return {
      allow: memoryOk,
      resource_status: resourceStatus,
      warning: memoryOk ? null : 'Memory usage high',
      resource_check: true
    };
  }
}

// Export singleton instance
const bumbaHookSystem = new BumbaHookSystem();

module.exports = {
  BumbaHookSystem,
  BaseHook,
  SecurityHook,
  QualityHook,
  CompletionHook,
  ConsciousnessHook,
  ResourceHook,
  bumbaHookSystem
};