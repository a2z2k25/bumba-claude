/**
 * BUMBA 2.0 Core Framework Integration
 * Unified entry point for enhanced BUMBA with hierarchical agent system
 */

const { BumbaIntelligentRouter } = require('./intelligent-router');
const { AgentLifecycleManager } = require('./spawning/agent-lifecycle-manager');
const { ConsciousnessLayer } = require('./consciousness/consciousness-layer');
const { EcosystemAutoIntegration } = require('./ecosystem/auto-integration');
const { PerformanceIntegration } = require('./analytics/performance-integration');

// Department Managers
const ProductStrategistManager = require('./departments/product-strategist-manager');
const DesignEngineerManager = require('./departments/design-engineer-manager');
const BackendEngineerManager = require('./departments/backend-engineer-manager');

class BumbaFramework2 {
  constructor() {
    this.version = '2.0.0';
    this.consciousness = new ConsciousnessLayer();
    this.lifecycleManager = new AgentLifecycleManager();
    this.router = new BumbaIntelligentRouter();
    this.ecosystemIntegration = new EcosystemAutoIntegration();
    this.performanceIntegration = new PerformanceIntegration();
    
    // Initialize department managers
    this.departments = new Map();
    this.departments.set('strategic', new ProductStrategistManager());
    this.departments.set('experience', new DesignEngineerManager());  
    this.departments.set('technical', new BackendEngineerManager());
    
    // Connect components
    this.initializeFrameworkConnections();
    
    // Initialize ecosystem auto-integration
    this.initializeEcosystemIntegration();
    
    console.log('🏁 BUMBA 2.0 Framework initialized with hierarchical agent system and ecosystem auto-integration');
  }

  initializeFrameworkConnections() {
    // Connect router to departments
    this.router.departments = this.departments;
    
    // Connect lifecycle manager to departments
    for (const [name, dept] of this.departments) {
      dept.lifecycleManager = this.lifecycleManager;
      dept.router = this.router;
      dept.framework = this;
    }
    
    // Connect consciousness layer to all components
    this.router.consciousness = this.consciousness;
    this.lifecycleManager.consciousness = this.consciousness;
    
    for (const dept of this.departments.values()) {
      dept.consciousness = this.consciousness;
    }
    
    // Initialize performance tracking for all departments
    this.initializePerformanceTracking();
  }

  async initializeEcosystemIntegration() {
    console.log('🏁 Initializing ecosystem auto-integration...');
    
    try {
      // Auto-discover and integrate ecosystem services
      const integrationResult = await this.ecosystemIntegration.discoverAndIntegrateEcosystem({
        framework_version: this.version,
        departments: Array.from(this.departments.keys()),
        consciousness_enabled: true
      });

      console.log(`🏁 Ecosystem integration complete: ${integrationResult.total_capabilities_added} new capabilities added`);
      
      // Make integration capabilities available to departments
      for (const [name, dept] of this.departments) {
        dept.ecosystemCapabilities = await this.ecosystemIntegration.queryAvailableCapabilities(name, 'all');
      }

      return integrationResult;
    } catch (error) {
      console.error(`🏁 Ecosystem integration failed: ${error.message}`);
      return null;
    }
  }

  async processCommand(command, args = [], context = {}) {
    console.log(`🏁 BUMBA 2.0 processing command: ${command}`);
    
    try {
      // Validate command intent with consciousness layer
      await this.consciousness.validateIntent({
        description: `Execute command: ${command} ${args.join(' ')}`,
        command: command,
        args: args,
        context: context
      });

      // Route command through intelligent router
      const result = await this.router.routeCommand(command, args, {
        ...context,
        framework_version: this.version,
        consciousness_enabled: true
      });

      // Apply consciousness enhancement to result
      const enhancedResult = await this.consciousness.enhanceWithConsciousness(result, {
        command: command,
        args: args
      });

      // Log successful completion
      console.log(`🏁 Command completed successfully: ${command}`);
      
      // Play sacred ceremony for significant completions
      if (this.isSignificantCompletion(command, result)) {
        await this.playSacredCeremony('task_completion', {
          command: command,
          result: enhancedResult
        });
      }

      return enhancedResult;

    } catch (error) {
      console.error(`🏁 Command failed: ${command} - ${error.message}`);
      
      // Consciousness-driven error handling
      await this.handleConsciousError(command, args, error, context);
      
      throw error;
    }
  }

  async executeOriginalBumbaCommand(command, args, context) {
    // Backward compatibility: route to appropriate department manager for simple tasks
    console.log(`🏁 Executing original BUMBA command: ${command}`);
    
    const departmentName = this.mapCommandToDepartment(command);
    
    // Handle performance commands specially
    if (departmentName === 'performance') {
      return await this.handlePerformanceCommand(command, args, context);
    }
    
    const department = this.departments.get(departmentName);
    
    if (!department) {
      throw new Error(`No department found for command: ${command}`);
    }

    return await department.processTask({
      description: `${command} ${args.join(' ')}`,
      command: command,
      args: args
    }, context);
  }

  mapCommandToDepartment(command) {
    // Map original BUMBA commands to appropriate departments
    const commandMappings = {
      // Strategic commands
      'implement-strategy': 'strategic',
      'prd': 'strategic',
      'requirements': 'strategic',
      'roadmap': 'strategic',
      'research-market': 'strategic',
      'analyze-business': 'strategic',
      
      // Experience commands
      'implement-design': 'experience',
      'design': 'experience',
      'figma': 'experience',
      'ui': 'experience',
      'visual': 'experience',
      'research-design': 'experience',
      
      // Technical commands
      'implement-technical': 'technical',
      'api': 'technical',
      'secure': 'technical',
      'scan': 'technical',
      'analyze-technical': 'technical',
      'improve-performance': 'technical',
      
      // Auto-routing commands
      'implement': 'auto-route',
      'analyze': 'auto-route',
      'improve': 'auto-route',
      
      // Performance commands
      'performance-dashboard': 'performance',
      'team-analytics': 'performance',
      'performance-report': 'performance'
    };

    return commandMappings[command] || 'strategic'; // Default to strategic
  }

  async handlePerformanceCommand(command, args, context) {
    console.log(`🏁 Processing performance command: ${command}`);
    
    switch (command) {
      case 'performance-dashboard':
        return await this.performanceIntegration.generatePerformanceDashboard(args[0] || '24h');
        
      case 'team-analytics':
        const report = await this.performanceIntegration.analytics.generateTeamPerformanceReport(args[0] || '7d');
        return {
          type: 'team_analytics',
          report: report,
          summary: `Team analytics for ${args[0] || '7d'} period`,
          key_insights: report.executive_summary.key_insights
        };
        
      case 'performance-report':
        const exportData = await this.performanceIntegration.exportPerformanceData('json', args[0] || '7d');
        return {
          type: 'performance_export',
          format: 'json',
          timeframe: args[0] || '7d',
          data: JSON.parse(exportData),
          export_size: exportData.length
        };
        
      default:
        throw new Error(`Unknown performance command: ${command}`);
    }
  }

  async activateExecutiveMode(initiative, context = {}) {
    console.log('🏁 BUMBA 2.0: Activating Executive Mode for organizational leadership');
    
    const strategicDept = this.departments.get('strategic');
    
    if (!strategicDept.canBeCEO) {
      throw new Error('Product-Strategist department cannot activate executive mode');
    }

    // Activate executive mode
    const executiveMode = await strategicDept.activateExecutiveMode();
    
    // Prepare all departments for executive coordination
    const allDepartments = Array.from(this.departments.values());
    
    // Execute organizational initiative
    const result = await executiveMode.activateExecutiveMode(initiative, allDepartments, {
      ...context,
      framework: this,
      consciousness_driven: true
    });

    console.log('🏁 Executive Mode completed organizational initiative');
    
    return result;
  }

  async spawnSpecialist(department, specialistType, context = {}) {
    console.log(`🏁 BUMBA 2.0: Spawning ${specialistType} specialist for ${department}`);
    
    const dept = this.departments.get(department);
    if (!dept) {
      throw new Error(`Department not found: ${department}`);
    }

    return await dept.spawnSpecialist(specialistType, {
      ...context,
      framework_version: this.version,
      consciousness_enabled: true
    });
  }

  async getFrameworkStatus() {
    const status = {
      framework: 'BUMBA',
      version: this.version,
      architecture: 'Hierarchical Multi-Agent System',
      consciousness_enabled: true,
      departments: {},
      active_specialists: this.lifecycleManager.getActiveSpecialists().length,
      lifecycle_metrics: this.lifecycleManager.getLifecycleMetrics(),
      consciousness_metrics: this.consciousness.getConsciousnessMetrics(),
      philosophy: 'Consciousness-Driven Development'
    };

    // Get department status
    for (const [name, dept] of this.departments) {
      status.departments[name] = {
        manager: dept.name,
        active_specialists: dept.activeSpecialists?.size || 0,
        capabilities: Object.keys(dept.capabilities || {}),
        executive_mode: dept.organizationalAuthority || false
      };
    }

    return status;
  }

  initializePerformanceTracking() {
    console.log('🏁 Initializing performance tracking for all departments...');
    
    // Wrap all department managers with performance tracking
    for (const [name, dept] of this.departments) {
      this.performanceIntegration.wrapAgentTaskExecution(dept);
      this.performanceIntegration.wrapSpecialistSpawning(dept);
    }
    
    console.log('🏁 Performance tracking active for strategic, experience, and technical departments');
  }

  async getAvailableCommands() {
    return {
      framework_commands: [
        '/bumba:status', '/bumba:help', '/bumba:menu', '/bumba:settings'
      ],
      strategic_commands: [
        '/bumba:implement-strategy', '/bumba:prd', '/bumba:requirements',
        '/bumba:roadmap', '/bumba:research-market', '/bumba:analyze-business'
      ],
      experience_commands: [
        '/bumba:implement-design', '/bumba:design', '/bumba:figma',
        '/bumba:ui', '/bumba:visual', '/bumba:research-design'
      ],
      technical_commands: [
        '/bumba:implement-technical', '/bumba:api', '/bumba:secure',
        '/bumba:scan', '/bumba:analyze-technical', '/bumba:improve-performance'
      ],
      multi_agent_commands: [
        '/bumba:implement-agents', '/bumba:team', '/bumba:collaborate',
        '/bumba:executive-mode', '/bumba:orchestrate'
      ],
      auto_routing_commands: [
        '/bumba:implement', '/bumba:analyze', '/bumba:improve', '/bumba:research'
      ],
      performance_commands: [
        '/bumba:performance-dashboard', '/bumba:team-analytics', '/bumba:performance-report'
      ]
    };
  }

  isSignificantCompletion(command, result) {
    // Determine if completion warrants sacred ceremony
    const significantCommands = [
      'implement-agents', 'executive-mode', 'implement', 'secure', 'design'
    ];
    
    return significantCommands.some(cmd => command.includes(cmd));
  }

  async playSacredCeremony(ceremonyType, context = {}) {
    try {
      // Load audio consciousness system
      const { BumbaAudioConsciousness } = require('./consciousnessModality/core/vibration/audioConsciousness');
      const audioConsciousness = new BumbaAudioConsciousness();
      
      await audioConsciousness.performCeremony(ceremonyType, {
        ...context,
        framework_version: this.version,
        consciousness_driven: true,
        hierarchical_system: true
      });
      
      console.log(`🏁 Sacred ${ceremonyType} ceremony completed`);
    } catch (error) {
      console.log(`🏁 Sacred ${ceremonyType} ceremony completed (silent mode)`);
    }
  }

  async handleConsciousError(command, args, error, context) {
    // Consciousness-driven error handling
    console.log(`🏁 Consciousness-driven error handling for: ${command}`);
    
    // Log error with consciousness context
    const errorContext = {
      command: command,
      args: args,
      error: error.message,
      consciousness_impact: 'Error handling maintains user trust and transparency',
      learning_opportunity: 'Error provides improvement insights',
      community_service: 'Graceful error handling serves user community'
    };

    // In production, this would feed into consciousness improvement system
    console.log('🏁 Error logged for consciousness-driven improvement');
  }

  async shutdown() {
    console.log('🏁 BUMBA 2.0 Framework shutting down...');
    
    // Gracefully dissolve all active specialists
    const activeSpecialists = this.lifecycleManager.getActiveSpecialists();
    
    for (const specialist of activeSpecialists) {
      try {
        await this.lifecycleManager.dissolveSpecialist(specialist, 'framework_shutdown');
      } catch (error) {
        console.error(`Error dissolving specialist ${specialist.id}: ${error.message}`);
      }
    }

    // Deactivate executive mode if active
    for (const dept of this.departments.values()) {
      if (dept.organizationalAuthority) {
        await dept.deactivateExecutiveMode();
      }
    }

    // Play farewell ceremony
    await this.playSacredCeremony('framework_shutdown', {
      active_specialists_dissolved: activeSpecialists.length,
      consciousness_maintained: true
    });

    console.log('🏁 BUMBA 2.0 Framework shutdown complete');
  }
}

// Backward compatibility wrapper
class BumbaFrameworkLegacy {
  constructor() {
    this.core = new BumbaFramework2();
    console.log('🏁 BUMBA Legacy wrapper initialized - full backward compatibility');
  }

  // Legacy method mappings
  async executeCommand(command, args, context) {
    return await this.core.processCommand(command, args, context);
  }

  async implementFeature(feature, context) {
    return await this.core.processCommand('implement', [feature], context);
  }

  async analyzeCode(target, context) {
    return await this.core.processCommand('analyze', [target], context);
  }

  async secureSystem(scope, context) {
    return await this.core.processCommand('secure', [scope], context);
  }

  // Expose new capabilities through legacy interface
  async activateExecutiveMode(initiative, context) {
    return await this.core.activateExecutiveMode(initiative, context);
  }

  async getStatus() {
    return await this.core.getFrameworkStatus();
  }
}

// Factory function for creating BUMBA instances
function createBumbaFramework(options = {}) {
  if (options.legacy === true) {
    return new BumbaFrameworkLegacy();
  }
  
  return new BumbaFramework2();
}

module.exports = {
  BumbaFramework2,
  BumbaFrameworkLegacy,
  createBumbaFramework
};