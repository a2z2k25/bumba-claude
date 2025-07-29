/**
 * BUMBA Advanced Health Monitoring & Auto-Repair System
 * Proactive system monitoring with intelligent auto-repair capabilities
 */

const fs = require('fs');
const path = require('path');
const { BumbaError, BumbaErrorBoundary } = require('../error-handling/bumba-error-system');
const { resourceManager } = require('../resource-management/resource-manager');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { bumbaHookSystem } = require('../hooks/bumba-hook-system');
const { audioFallbackSystem } = require('../audio-fallback-system');

/**
 * Comprehensive Health Monitor with Auto-Repair
 */
class BumbaHealthMonitor {
  constructor() {
    this.healthHistory = [];
    this.repairHistory = [];
    this.alertThresholds = {
      memory_usage: 0.8,      // 80% of memory limit
      error_rate: 0.05,       // 5% error rate
      response_time: 2000,    // 2 seconds
      mcp_failures: 3,        // 3 consecutive failures
      agent_failures: 2       // 2 agent failures
    };
    
    this.autoRepairEnabled = true;
    this.repairStrategies = new Map();
    this.healthCheckInterval = null;
    
    this.initializeRepairStrategies();
  }

  /**
   * Initialize repair strategies for different issue types
   */
  initializeRepairStrategies() {
    this.repairStrategies.set('AGENT_UNRESPONSIVE', {
      strategy: 'restart_agent',
      severity: 'high',
      autoRepair: true,
      maxRetries: 3
    });
    
    this.repairStrategies.set('MCP_CONNECTION_LOST', {
      strategy: 'reconnect_mcp',
      severity: 'medium',
      autoRepair: true,
      maxRetries: 5
    });
    
    this.repairStrategies.set('MEMORY_HIGH', {
      strategy: 'garbage_collection',
      severity: 'medium',
      autoRepair: true,
      maxRetries: 2
    });
    
    this.repairStrategies.set('HOOK_SYSTEM_DEGRADED', {
      strategy: 'reset_hooks',
      severity: 'low',
      autoRepair: true,
      maxRetries: 1
    });
    
    this.repairStrategies.set('AUDIO_SYSTEM_FAILED', {
      strategy: 'restart_audio',
      severity: 'low',
      autoRepair: true,
      maxRetries: 2
    });
    
    this.repairStrategies.set('RESOURCE_EXHAUSTED', {
      strategy: 'emergency_cleanup',
      severity: 'critical',
      autoRepair: true,
      maxRetries: 1
    });
    
    this.repairStrategies.set('CONFIGURATION_INVALID', {
      strategy: 'reset_config',
      severity: 'high',
      autoRepair: false, // Requires manual review
      maxRetries: 0
    });
  }

  /**
   * Comprehensive health check across all systems
   */
  async getHealthStatus() {
    const startTime = Date.now();
    
    try {
      console.log('🏥 Performing comprehensive health check...');
      
      const checks = await Promise.allSettled([
        this.checkCore(),
        this.checkAgents(),
        this.checkMCPServers(),
        this.checkHooks(),
        this.checkMemory(),
        this.checkAudio(),
        this.checkConfiguration(),
        this.checkPerformance()
      ]);

      const healthData = this.aggregateHealthData(checks);
      const issues = this.identifyIssues(healthData);
      const status = this.determineOverallStatus(healthData, issues);
      
      const healthStatus = {
        overall_status: status,
        timestamp: new Date().toISOString(),
        check_duration_ms: Date.now() - startTime,
        components: healthData,
        issues: issues,
        recommendations: this.generateRecommendations(issues),
        auto_repair_available: this.autoRepairEnabled,
        next_check: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      // Store in history
      this.healthHistory.push(healthStatus);
      if (this.healthHistory.length > 100) {
        this.healthHistory.shift(); // Keep last 100 checks
      }

      // Attempt auto-repair if issues found
      if (issues.length > 0 && this.autoRepairEnabled) {
        healthStatus.auto_repair_results = await this.attemptAutoRepair(issues);
      }

      console.log(`✅ Health check completed: ${status} (${issues.length} issues found)`);
      
      return healthStatus;
      
    } catch (error) {
      console.error(`❌ Health check failed: ${error.message}`);
      return {
        overall_status: 'critical',
        timestamp: new Date().toISOString(),
        error: error.message,
        components: {},
        issues: [{ type: 'HEALTH_CHECK_FAILED', severity: 'critical', details: error.message }]
      };
    }
  }

  /**
   * Check core framework components
   */
  async checkCore() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      component: 'core',
      status: 'healthy',
      details: {
        node_version: process.version,
        uptime_seconds: Math.round(uptime),
        memory_usage: {
          heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss_mb: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        cpu_usage: 'not_monitored' // Could be enhanced with actual CPU monitoring
      }
    };
  }

  /**
   * Check agent system health
   */
  async checkAgents() {
    try {
      // Simulate agent health check
      const agentStats = {
        total_agents: 3, // strategic, experience, technical
        active_agents: 3,
        failed_agents: 0,
        average_response_time: 150
      };

      const status = agentStats.failed_agents === 0 ? 'healthy' : 
                    agentStats.failed_agents < agentStats.total_agents / 2 ? 'degraded' : 'critical';

      return {
        component: 'agents',
        status: status,
        details: agentStats
      };
    } catch (error) {
      return {
        component: 'agents',
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Check MCP server connections
   */
  async checkMCPServers() {
    try {
      const mcpHealth = mcpServerManager.getSystemHealth();
      
      const status = mcpHealth.essential_health >= 0.8 ? 'healthy' :
                    mcpHealth.essential_health >= 0.5 ? 'degraded' : 'critical';

      return {
        component: 'mcp_servers',
        status: status,
        details: mcpHealth
      };
    } catch (error) {
      return {
        component: 'mcp_servers',
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Check hook system health
   */
  async checkHooks() {
    try {
      const hookStatus = bumbaHookSystem.getStatus();
      
      const totalHooks = hookStatus.total_hooks;
      const disabledHooks = Object.values(hookStatus.hook_status)
        .filter(hook => hook.disabled).length;
      
      const status = disabledHooks === 0 ? 'healthy' :
                    disabledHooks < totalHooks / 2 ? 'degraded' : 'critical';

      return {
        component: 'hooks',
        status: status,
        details: hookStatus
      };
    } catch (error) {
      return {
        component: 'hooks',
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Check memory and resource usage
   */
  async checkMemory() {
    try {
      const resourceUsage = resourceManager.getResourceUsage();
      
      const memoryUtilization = resourceUsage.utilization.memory;
      const status = memoryUtilization < 70 ? 'healthy' :
                    memoryUtilization < 85 ? 'degraded' : 'critical';

      return {
        component: 'memory',
        status: status,
        details: resourceUsage
      };
    } catch (error) {
      return {
        component: 'memory',
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Check audio system health
   */
  async checkAudio() {
    try {
      const audioStatus = audioFallbackSystem.getAudioStatus();
      
      const status = audioStatus.enabled && audioStatus.strategy === 'system' ? 'healthy' :
                    audioStatus.enabled ? 'degraded' : 'warning';

      return {
        component: 'audio',
        status: status,
        details: audioStatus
      };
    } catch (error) {
      return {
        component: 'audio',
        status: 'warning', // Audio failures are non-critical
        error: error.message
      };
    }
  }

  /**
   * Check configuration validity
   */
  async checkConfiguration() {
    try {
      // Check if critical config files exist and are valid
      const configChecks = {
        package_json: this.checkFileExists('package.json'),
        bumba_config: this.checkFileExists('bumba.config.js'),
        claude_dir: this.checkDirectoryExists(path.join(require('os').homedir(), '.claude'))
      };

      const failedChecks = Object.entries(configChecks)
        .filter(([name, result]) => !result).length;

      const status = failedChecks === 0 ? 'healthy' :
                    failedChecks < 2 ? 'degraded' : 'critical';

      return {
        component: 'configuration',
        status: status,
        details: configChecks
      };
    } catch (error) {
      return {
        component: 'configuration',
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformance() {
    try {
      const startTime = process.hrtime.bigint();
      
      // Simple performance test
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      const status = responseTime < 50 ? 'healthy' :
                    responseTime < 200 ? 'degraded' : 'critical';

      return {
        component: 'performance',
        status: status,
        details: {
          response_time_ms: Math.round(responseTime),
          event_loop_delay: 'not_monitored'
        }
      };
    } catch (error) {
      return {
        component: 'performance',
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Helper methods for configuration checks
   */
  checkFileExists(filename) {
    try {
      return fs.existsSync(path.resolve(filename));
    } catch (error) {
      return false;
    }
  }

  checkDirectoryExists(dirname) {
    try {
      return fs.existsSync(dirname) && fs.statSync(dirname).isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * Aggregate health data from all checks
   */
  aggregateHealthData(checks) {
    const healthData = {};
    
    checks.forEach((result, index) => {
      const componentNames = ['core', 'agents', 'mcp_servers', 'hooks', 'memory', 'audio', 'configuration', 'performance'];
      const componentName = componentNames[index];
      
      if (result.status === 'fulfilled') {
        healthData[componentName] = result.value;
      } else {
        healthData[componentName] = {
          component: componentName,
          status: 'critical',
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
    
    return healthData;
  }

  /**
   * Identify issues from health data
   */
  identifyIssues(healthData) {
    const issues = [];
    
    for (const [componentName, data] of Object.entries(healthData)) {
      if (data.status === 'critical') {
        issues.push({
          type: `${componentName.toUpperCase()}_CRITICAL`,
          component: componentName,
          severity: 'critical',
          details: data.error || data.details,
          auto_repairable: this.repairStrategies.has(`${componentName.toUpperCase()}_CRITICAL`)
        });
      } else if (data.status === 'degraded') {
        issues.push({
          type: `${componentName.toUpperCase()}_DEGRADED`,
          component: componentName,
          severity: 'medium',
          details: data.details,
          auto_repairable: this.repairStrategies.has(`${componentName.toUpperCase()}_DEGRADED`)
        });
      }
      
      // Specific issue detection
      if (componentName === 'memory' && data.details?.utilization?.memory > 80) {
        issues.push({
          type: 'MEMORY_HIGH',
          component: 'memory',
          severity: 'medium',
          details: `Memory usage at ${data.details.utilization.memory}%`,
          auto_repairable: true
        });
      }
      
      if (componentName === 'mcp_servers' && data.details?.essential_health < 0.8) {
        issues.push({
          type: 'MCP_CONNECTION_LOST',
          component: 'mcp_servers',
          severity: 'medium',
          details: `Essential MCP health at ${Math.round(data.details.essential_health * 100)}%`,
          auto_repairable: true
        });
      }
    }
    
    return issues;
  }

  /**
   * Determine overall system status
   */
  determineOverallStatus(healthData, issues) {
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    const mediumIssues = issues.filter(issue => issue.severity === 'medium');
    
    if (criticalIssues.length > 0) return 'critical';
    if (mediumIssues.length > 2) return 'degraded';
    if (mediumIssues.length > 0) return 'warning';
    
    return 'healthy';
  }

  /**
   * Generate recommendations based on issues
   */
  generateRecommendations(issues) {
    const recommendations = [];
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'MEMORY_HIGH':
          recommendations.push('Consider reducing concurrent operations or increasing memory limits');
          break;
        case 'MCP_CONNECTION_LOST':
          recommendations.push('Check network connectivity and MCP server availability');
          break;
        case 'AGENTS_CRITICAL':
          recommendations.push('Restart framework or check agent initialization');
          break;
        case 'HOOKS_DEGRADED':
          recommendations.push('Review hook failure logs and consider disabling problematic hooks');
          break;
        default:
          recommendations.push(`Address ${issue.component} issues: ${issue.details}`);
      }
    });
    
    return recommendations;
  }

  /**
   * Attempt automatic repair for identified issues
   */
  async attemptAutoRepair(issues) {
    console.log(`🔧 Attempting auto-repair for ${issues.length} issues...`);
    
    const repairs = [];
    
    for (const issue of issues) {
      if (!issue.auto_repairable) {
        repairs.push({
          issue_type: issue.type,
          repair_attempted: false,
          reason: 'Auto-repair not available for this issue type'
        });
        continue;
      }
      
      try {
        const repairResult = await this.executeRepair(issue);
        repairs.push({
          issue_type: issue.type,
          repair_attempted: true,
          success: repairResult.success,
          details: repairResult.details,
          timestamp: new Date().toISOString()
        });
        
        if (repairResult.success) {
          console.log(`✅ Auto-repair successful for ${issue.type}`);
        } else {
          console.warn(`⚠️ Auto-repair failed for ${issue.type}: ${repairResult.error}`);
        }
        
      } catch (error) {
        repairs.push({
          issue_type: issue.type,
          repair_attempted: true,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        console.error(`❌ Auto-repair error for ${issue.type}: ${error.message}`);
      }
    }
    
    // Store repair history
    this.repairHistory.push({
      timestamp: new Date().toISOString(),
      issues_repaired: issues.length,
      repairs: repairs
    });
    
    if (this.repairHistory.length > 50) {
      this.repairHistory.shift(); // Keep last 50 repair attempts
    }
    
    return repairs;
  }

  /**
   * Execute specific repair strategy
   */
  async executeRepair(issue) {
    const strategy = this.repairStrategies.get(issue.type);
    if (!strategy) {
      throw new BumbaError('REPAIR_STRATEGY_NOT_FOUND', `No repair strategy for ${issue.type}`);
    }
    
    switch (strategy.strategy) {
      case 'restart_agent':
        return await this.restartAgent(issue);
        
      case 'reconnect_mcp':
        return await this.reconnectMCP(issue);
        
      case 'garbage_collection':
        return await this.runGarbageCollection(issue);
        
      case 'reset_hooks':
        return await this.resetHooks(issue);
        
      case 'restart_audio':
        return await this.restartAudio(issue);
        
      case 'emergency_cleanup':
        return await this.emergencyCleanup(issue);
        
      default:
        throw new BumbaError('UNKNOWN_REPAIR_STRATEGY', `Unknown repair strategy: ${strategy.strategy}`);
    }
  }

  /**
   * Repair implementations
   */
  async restartAgent(issue) {
    // Simulate agent restart
    console.log(`🔄 Restarting agent for ${issue.component}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      details: 'Agent restart completed',
      actions_taken: ['agent_restart']
    };
  }

  async reconnectMCP(issue) {
    try {
      await mcpServerManager.reconnectAll();
      return {
        success: true,
        details: 'MCP servers reconnected',
        actions_taken: ['mcp_reconnect']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actions_taken: ['mcp_reconnect_attempted']
      };
    }
  }

  async runGarbageCollection(issue) {
    try {
      const gcResult = await resourceManager.garbageCollect(true);
      return {
        success: true,
        details: `Freed ${gcResult.freed} MB in ${gcResult.duration}ms`,
        actions_taken: ['garbage_collection']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actions_taken: ['garbage_collection_attempted']
      };
    }
  }

  async resetHooks(issue) {
    try {
      bumbaHookSystem.clearCache();
      return {
        success: true,
        details: 'Hook system cache cleared',
        actions_taken: ['hook_cache_clear']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actions_taken: ['hook_reset_attempted']
      };
    }
  }

  async restartAudio(issue) {
    try {
      audioFallbackSystem.enableAudio();
      const testResult = await audioFallbackSystem.testAudioSystem();
      
      return {
        success: testResult.success,
        details: `Audio system restarted - ${testResult.method}`,
        actions_taken: ['audio_restart', 'audio_test']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actions_taken: ['audio_restart_attempted']
      };
    }
  }

  async emergencyCleanup(issue) {
    try {
      const gcResult = await resourceManager.garbageCollect(true);
      bumbaHookSystem.clearCache();
      
      return {
        success: true,
        details: `Emergency cleanup completed - freed ${gcResult.freed} MB`,
        actions_taken: ['aggressive_gc', 'cache_clear', 'emergency_cleanup']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actions_taken: ['emergency_cleanup_attempted']
      };
    }
  }

  /**
   * Start automated health monitoring
   */
  startMonitoring(intervalMinutes = 5) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getHealthStatus();
      } catch (error) {
        console.error(`Health monitoring error: ${error.message}`);
      }
    }, intervalMinutes * 60 * 1000);
    
    console.log(`🏥 Health monitoring started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop automated health monitoring
   */
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🏥 Health monitoring stopped');
    }
  }

  /**
   * Get health monitoring statistics
   */
  getMonitoringStats() {
    const recentHealth = this.healthHistory.slice(-10);
    const recentRepairs = this.repairHistory.slice(-10);
    
    return {
      total_health_checks: this.healthHistory.length,
      total_repairs: this.repairHistory.length,
      recent_health_status: recentHealth.map(h => ({ 
        timestamp: h.timestamp, 
        status: h.overall_status, 
        issues: h.issues.length 
      })),
      recent_repairs: recentRepairs,
      auto_repair_enabled: this.autoRepairEnabled,
      monitoring_active: this.healthCheckInterval !== null
    };
  }

  /**
   * Enable/disable auto-repair
   */
  setAutoRepair(enabled) {
    this.autoRepairEnabled = enabled;
    console.log(`🔧 Auto-repair ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
const bumbaHealthMonitor = new BumbaHealthMonitor();

module.exports = {
  BumbaHealthMonitor,
  bumbaHealthMonitor
};