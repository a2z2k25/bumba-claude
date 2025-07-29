/**
 * BUMBA Performance Metrics & Monitoring Dashboard
 * Comprehensive performance tracking with SLA monitoring
 */

const fs = require('fs');
const path = require('path');

/**
 * Performance Metrics Collection and Analysis
 */
class BumbaMetrics {
  constructor() {
    this.metrics = {
      commands: [],
      operations: [],
      errors: [],
      performance: [],
      system: []
    };
    
    this.targets = {
      installationSuccessRate: 95,    // Target: 95%
      commandReliability: 99,         // Target: 99%
      recoveryTime: 30,               // Target: 30 seconds
      memoryUsage: 512,               // Target: 512 MB max
      responseTime: 1000,             // Target: 1000ms p95
      errorRate: 0.1                  // Target: 0.1% of commands
    };
    
    this.currentPeriod = {
      startTime: Date.now(),
      commands: 0,
      errors: 0,
      totalResponseTime: 0,
      peakMemory: 0,
      recoveries: 0
    };
    
    this.historicalPeriods = [];
    this.alertRules = new Map();
    
    this.initializeAlertRules();
    this.startMetricsCollection();
  }

  /**
   * Initialize alert rules for SLA monitoring
   */
  initializeAlertRules() {
    this.alertRules.set('high_error_rate', {
      condition: (metrics) => metrics.errorRate > this.targets.errorRate * 10,
      severity: 'critical',
      message: 'Error rate exceeds acceptable threshold'
    });
    
    this.alertRules.set('slow_response_time', {
      condition: (metrics) => metrics.averageResponseTime > this.targets.responseTime * 2,
      severity: 'warning',
      message: 'Response times degraded significantly'
    });
    
    this.alertRules.set('memory_leak', {
      condition: (metrics) => metrics.memoryTrend > 1.5, // 50% increase trend
      severity: 'critical',
      message: 'Potential memory leak detected'
    });
    
    this.alertRules.set('command_failures', {
      condition: (metrics) => metrics.commandReliability < this.targets.commandReliability,
      severity: 'high',
      message: 'Command reliability below target'
    });
  }

  /**
   * Record command execution metrics
   */
  recordCommand(commandName, duration, success, context = {}) {
    const record = {
      timestamp: Date.now(),
      command: commandName,
      duration_ms: duration,
      success: success,
      memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
      context: context
    };
    
    this.metrics.commands.push(record);
    
    // Update current period
    this.currentPeriod.commands++;
    if (!success) this.currentPeriod.errors++;
    this.currentPeriod.totalResponseTime += duration;
    this.currentPeriod.peakMemory = Math.max(this.currentPeriod.peakMemory, record.memory_usage);
    
    // Keep only recent metrics (last 1000 commands)
    if (this.metrics.commands.length > 1000) {
      this.metrics.commands.shift();
    }
    
    console.log(`📊 Command recorded: ${commandName} (${duration}ms, ${success ? 'success' : 'failure'})`);
  }

  /**
   * Record operation performance
   */
  recordOperation(operationType, duration, details = {}) {
    const record = {
      timestamp: Date.now(),
      operation: operationType,
      duration_ms: duration,
      details: details,
      memory_before: details.memoryBefore || 0,
      memory_after: details.memoryAfter || process.memoryUsage().heapUsed / 1024 / 1024
    };
    
    this.metrics.operations.push(record);
    
    // Keep only recent operations (last 500)
    if (this.metrics.operations.length > 500) {
      this.metrics.operations.shift();
    }
  }

  /**
   * Record error occurrence
   */
  recordError(errorType, severity, context = {}) {
    const record = {
      timestamp: Date.now(),
      error_type: errorType,
      severity: severity,
      context: context,
      recovery_attempted: context.recoveryAttempted || false,
      recovery_successful: context.recoverySuccessful || false
    };
    
    this.metrics.errors.push(record);
    
    if (record.recovery_attempted) {
      this.currentPeriod.recoveries++;
    }
    
    // Keep only recent errors (last 200)
    if (this.metrics.errors.length > 200) {
      this.metrics.errors.shift();
    }
  }

  /**
   * Record system performance snapshot
   */
  recordSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const record = {
      timestamp: Date.now(),
      memory: {
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        external_mb: Math.round(memoryUsage.external / 1024 / 1024)
      },
      uptime_seconds: Math.round(process.uptime()),
      cpu_usage: process.cpuUsage(),
      event_loop_delay: 'not_measured' // Could be enhanced with actual measurement
    };
    
    this.metrics.system.push(record);
    
    // Keep only recent system metrics (last 288 = 24 hours at 5-minute intervals)
    if (this.metrics.system.length > 288) {
      this.metrics.system.shift();
    }
  }

  /**
   * Calculate current performance metrics
   */
  async collectMetrics() {
    const now = Date.now();
    const recentCommands = this.metrics.commands.filter(cmd => 
      now - cmd.timestamp < 60 * 60 * 1000 // Last hour
    );
    
    const recentErrors = this.metrics.errors.filter(err => 
      now - err.timestamp < 60 * 60 * 1000 // Last hour
    );
    
    const successfulCommands = recentCommands.filter(cmd => cmd.success);
    const failedCommands = recentCommands.filter(cmd => !cmd.success);
    
    const metrics = {
      // Installation success rate (simulated)
      installationSuccessRate: this.calculateInstallationSuccessRate(),
      
      // Command reliability
      commandReliability: recentCommands.length > 0 ? 
        (successfulCommands.length / recentCommands.length) * 100 : 100,
      
      // Average recovery time
      recoveryTime: this.calculateAverageRecoveryTime(),
      
      // Memory usage
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      
      // Response time (95th percentile)
      responseTime: this.calculatePercentile(
        recentCommands.map(cmd => cmd.duration_ms), 95
      ),
      
      // Error rate
      errorRate: recentCommands.length > 0 ? 
        (failedCommands.length / recentCommands.length) * 100 : 0,
      
      // Additional metrics
      averageResponseTime: recentCommands.length > 0 ?
        recentCommands.reduce((sum, cmd) => sum + cmd.duration_ms, 0) / recentCommands.length : 0,
      
      totalCommands: recentCommands.length,
      totalErrors: recentErrors.length,
      memoryTrend: this.calculateMemoryTrend(),
      
      // Period information
      period: {
        start: new Date(now - 60 * 60 * 1000).toISOString(),
        end: new Date(now).toISOString(),
        duration_minutes: 60
      }
    };
    
    return metrics;
  }

  /**
   * Calculate installation success rate (simulated)
   */
  calculateInstallationSuccessRate() {
    // This would be based on actual installation tracking
    // For now, simulate based on system health
    const systemHealth = this.getSystemHealthScore();
    return Math.max(85, systemHealth * 100); // Minimum 85% success rate
  }

  /**
   * Calculate average recovery time
   */
  calculateAverageRecoveryTime() {
    const recentRecoveries = this.metrics.errors.filter(err => 
      err.recovery_attempted && Date.now() - err.timestamp < 24 * 60 * 60 * 1000
    );
    
    if (recentRecoveries.length === 0) return 0;
    
    // Simulate recovery times (in production, this would be measured)
    return recentRecoveries.reduce((sum, recovery) => sum + 15, 0) / recentRecoveries.length;
  }

  /**
   * Calculate percentile for array of values
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Calculate memory usage trend
   */
  calculateMemoryTrend() {
    const recentSystem = this.metrics.system.slice(-10); // Last 10 measurements
    if (recentSystem.length < 2) return 1.0;
    
    const oldMemory = recentSystem[0].memory.heap_used_mb;
    const newMemory = recentSystem[recentSystem.length - 1].memory.heap_used_mb;
    
    return newMemory / oldMemory;
  }

  /**
   * Get system health score (0-1)
   */
  getSystemHealthScore() {
    const recentCommands = this.metrics.commands.slice(-50);
    if (recentCommands.length === 0) return 1.0;
    
    const successRate = recentCommands.filter(cmd => cmd.success).length / recentCommands.length;
    return successRate;
  }

  /**
   * Check SLA compliance
   */
  async checkSLAs() {
    const metrics = await this.collectMetrics();
    const violations = [];
    
    for (const [metric, target] of Object.entries(this.targets)) {
      const value = metrics[metric];
      let violated = false;
      let comparison = '';
      
      // Determine if target is met
      switch (metric) {
        case 'installationSuccessRate':
        case 'commandReliability':
          violated = value < target;
          comparison = `${value.toFixed(1)}% < ${target}%`;
          break;
        case 'responseTime':
        case 'recoveryTime':
        case 'memoryUsage':
          violated = value > target;
          comparison = `${value.toFixed(1)} > ${target}`;
          break;
        case 'errorRate':
          violated = value > target;
          comparison = `${value.toFixed(3)}% > ${target}%`;
          break;
      }
      
      if (violated) {
        violations.push({
          metric: metric,
          value: value,
          target: target,
          comparison: comparison,
          severity: this.getSLAViolationSeverity(metric, value, target)
        });
      }
    }
    
    return {
      sla_compliant: violations.length === 0,
      violations: violations,
      metrics: metrics,
      checked_at: new Date().toISOString()
    };
  }

  /**
   * Determine SLA violation severity
   */
  getSLAViolationSeverity(metric, value, target) {
    const ratio = metric.includes('Rate') || metric.includes('Reliability') ? 
      value / target : target / value;
    
    if (ratio < 0.5 || ratio > 2.0) return 'critical';
    if (ratio < 0.8 || ratio > 1.5) return 'high';
    return 'medium';
  }

  /**
   * Check alert conditions
   */
  async checkAlerts() {
    const metrics = await this.collectMetrics();
    const alerts = [];
    
    for (const [alertName, rule] of this.alertRules) {
      if (rule.condition(metrics)) {
        alerts.push({
          name: alertName,
          severity: rule.severity,
          message: rule.message,
          metrics: {
            errorRate: metrics.errorRate,
            averageResponseTime: metrics.averageResponseTime,
            memoryTrend: metrics.memoryTrend,
            commandReliability: metrics.commandReliability
          },
          triggered_at: new Date().toISOString()
        });
      }
    }
    
    return alerts;
  }

  /**
   * Generate performance dashboard data
   */
  async generateDashboard() {
    const metrics = await this.collectMetrics();
    const slaStatus = await this.checkSLAs();
    const alerts = await this.checkAlerts();
    
    return {
      title: 'BUMBA Performance Dashboard',
      generated_at: new Date().toISOString(),
      
      // Key Performance Indicators
      kpis: {
        installation_success_rate: {
          value: metrics.installationSuccessRate,
          target: this.targets.installationSuccessRate,
          status: metrics.installationSuccessRate >= this.targets.installationSuccessRate ? 'good' : 'poor',
          unit: '%'
        },
        command_reliability: {
          value: metrics.commandReliability,
          target: this.targets.commandReliability,
          status: metrics.commandReliability >= this.targets.commandReliability ? 'good' : 'poor',
          unit: '%'
        },
        response_time_p95: {
          value: metrics.responseTime,
          target: this.targets.responseTime,
          status: metrics.responseTime <= this.targets.responseTime ? 'good' : 'poor',
          unit: 'ms'
        },
        memory_usage: {
          value: Math.round(metrics.memoryUsage),
          target: this.targets.memoryUsage,
          status: metrics.memoryUsage <= this.targets.memoryUsage ? 'good' : 'poor',
          unit: 'MB'
        },
        error_rate: {
          value: metrics.errorRate,
          target: this.targets.errorRate,
          status: metrics.errorRate <= this.targets.errorRate ? 'good' : 'poor',
          unit: '%'
        }
      },
      
      // SLA Compliance
      sla_compliance: slaStatus,
      
      // Active Alerts
      alerts: alerts,
      
      // Detailed Metrics
      detailed_metrics: metrics,
      
      // Recent Activity Summary
      activity_summary: {
        total_commands_last_hour: metrics.totalCommands,
        successful_commands: Math.round(metrics.totalCommands * (metrics.commandReliability / 100)),
        failed_commands: metrics.totalErrors,
        average_response_time: Math.round(metrics.averageResponseTime),
        peak_memory_usage: Math.round(this.currentPeriod.peakMemory),
        recoveries_attempted: this.currentPeriod.recoveries
      },
      
      // Trends (last 24 hours)
      trends: this.calculateTrends(),
      
      // Recommendations
      recommendations: this.generateRecommendations(metrics, alerts)
    };
  }

  /**
   * Calculate performance trends
   */
  calculateTrends() {
    const hourlyMetrics = this.calculateHourlyMetrics();
    
    return {
      command_volume: hourlyMetrics.map(h => ({ hour: h.hour, commands: h.commands })),
      success_rate: hourlyMetrics.map(h => ({ hour: h.hour, rate: h.successRate })),
      response_time: hourlyMetrics.map(h => ({ hour: h.hour, time: h.avgResponseTime })),
      memory_usage: this.metrics.system.slice(-24).map(s => ({
        time: new Date(s.timestamp).toISOString(),
        memory: s.memory.heap_used_mb
      }))
    };
  }

  /**
   * Calculate hourly aggregated metrics
   */
  calculateHourlyMetrics() {
    const now = Date.now();
    const hourlyData = [];
    
    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000;
      const hourEnd = now - i * 60 * 60 * 1000;
      
      const hourCommands = this.metrics.commands.filter(cmd => 
        cmd.timestamp >= hourStart && cmd.timestamp < hourEnd
      );
      
      const successfulCommands = hourCommands.filter(cmd => cmd.success);
      
      hourlyData.push({
        hour: new Date(hourStart).getHours(),
        commands: hourCommands.length,
        successRate: hourCommands.length > 0 ? 
          (successfulCommands.length / hourCommands.length) * 100 : 100,
        avgResponseTime: hourCommands.length > 0 ?
          hourCommands.reduce((sum, cmd) => sum + cmd.duration_ms, 0) / hourCommands.length : 0
      });
    }
    
    return hourlyData;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics, alerts) {
    const recommendations = [];
    
    if (metrics.errorRate > this.targets.errorRate * 5) {
      recommendations.push({
        type: 'critical',
        title: 'High Error Rate',
        description: 'Error rate is significantly above target. Review error logs and implement additional error handling.',
        action: 'Investigate recent errors and improve error recovery mechanisms'
      });
    }
    
    if (metrics.responseTime > this.targets.responseTime * 1.5) {
      recommendations.push({
        type: 'performance',
        title: 'Slow Response Times',
        description: 'Response times are degraded. Consider performance optimization.',
        action: 'Enable resource pooling and implement caching strategies'
      });
    }
    
    if (metrics.memoryUsage > this.targets.memoryUsage * 0.8) {
      recommendations.push({
        type: 'resource',
        title: 'High Memory Usage',
        description: 'Memory usage is approaching limits. Implement more aggressive garbage collection.',
        action: 'Review memory allocation patterns and increase garbage collection frequency'
      });
    }
    
    if (metrics.memoryTrend > 1.3) {
      recommendations.push({
        type: 'critical',
        title: 'Potential Memory Leak',
        description: 'Memory usage is trending upward consistently. Investigate potential memory leaks.',
        action: 'Profile memory usage and identify objects that are not being released'
      });
    }
    
    if (alerts.length > 0) {
      recommendations.push({
        type: 'alert',
        title: 'Active Alerts',
        description: `${alerts.length} performance alerts are currently active.`,
        action: 'Address active alerts to maintain system stability'
      });
    }
    
    return recommendations;
  }

  /**
   * Start automatic metrics collection
   */
  startMetricsCollection() {
    // Collect system metrics every 5 minutes
    setInterval(() => {
      this.recordSystemMetrics();
    }, 5 * 60 * 1000);
    
    // Reset current period every hour
    setInterval(() => {
      this.historicalPeriods.push({ ...this.currentPeriod, endTime: Date.now() });
      this.currentPeriod = {
        startTime: Date.now(),
        commands: 0,
        errors: 0,
        totalResponseTime: 0,
        peakMemory: 0,
        recoveries: 0
      };
      
      // Keep only last 24 hours of historical periods
      if (this.historicalPeriods.length > 24) {
        this.historicalPeriods.shift();
      }
    }, 60 * 60 * 1000);
    
    console.log('📊 Performance metrics collection started');
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(filePath) {
    const dashboard = await this.generateDashboard();
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(dashboard, null, 2));
      console.log(`📊 Metrics exported to ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to export metrics: ${error.message}`);
      return false;
    }
  }

  /**
   * Get current metrics summary
   */
  async getMetricsSummary() {
    const metrics = await this.collectMetrics();
    
    return {
      performance_score: this.calculateOverallPerformanceScore(metrics),
      sla_compliance: (await this.checkSLAs()).sla_compliant,
      active_alerts: (await this.checkAlerts()).length,
      key_metrics: {
        command_reliability: `${metrics.commandReliability.toFixed(1)}%`,
        response_time_p95: `${metrics.responseTime.toFixed(0)}ms`,
        memory_usage: `${Math.round(metrics.memoryUsage)}MB`,
        error_rate: `${metrics.errorRate.toFixed(2)}%`
      },
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Calculate overall performance score (0-100)
   */
  calculateOverallPerformanceScore(metrics) {
    const scores = {
      reliability: Math.min(100, metrics.commandReliability),
      responseTime: Math.max(0, 100 - (metrics.responseTime / this.targets.responseTime * 100)),
      memoryUsage: Math.max(0, 100 - (metrics.memoryUsage / this.targets.memoryUsage * 100)),
      errorRate: Math.max(0, 100 - (metrics.errorRate / this.targets.errorRate * 1000))
    };
    
    // Weighted average
    const weights = { reliability: 0.3, responseTime: 0.3, memoryUsage: 0.2, errorRate: 0.2 };
    
    return Object.entries(scores).reduce((total, [metric, score]) => {
      return total + (score * weights[metric]);
    }, 0);
  }
}

// Export singleton instance
const bumbaMetrics = new BumbaMetrics();

module.exports = {
  BumbaMetrics,
  bumbaMetrics
};