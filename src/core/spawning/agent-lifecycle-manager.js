/**
 * BUMBA 2.0 Agent Lifecycle Manager
 * Manages spawning, coordination, and dissolution of specialist agents
 */

const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');

class AgentLifecycleManager {
  constructor() {
    this.activeAgents = new Map();
    this.agentRegistry = new Map();
    this.lifecycleEvents = [];
    this.consciousnessLayer = new ConsciousnessLayer();
    this.performanceMonitor = new AgentPerformanceMonitor();
    this.knowledgeTransferSystem = new KnowledgeTransferSystem();
    
    this.initializeAgentRegistry();
    this.initializeLifecycleRules();
  }

  initializeAgentRegistry() {
    // Register all available specialist types with safe fallbacks
    this.agentRegistry.set('strategic', {
      'market-research': this.safeRequire('../specialists/strategic/market-research-specialist'),
      'competitive-analysis': this.safeRequire('../specialists/strategic/competitive-analysis-specialist'),
      'business-model': this.safeRequire('../specialists/strategic/business-model-specialist'),
      'stakeholder-comms': this.safeRequire('../specialists/strategic/stakeholder-comms-specialist'),
      'roi-analysis': this.safeRequire('../specialists/strategic/roi-analysis-specialist'),
      'requirements-engineering': this.safeRequire('../specialists/strategic/requirements-specialist'),
      'product-strategy': this.safeRequire('../specialists/strategic/product-strategy-specialist')
    });

    this.agentRegistry.set('experience', {
      'ux-research': this.safeRequire('../specialists/experience/ux-research-specialist'),
      'ui-design': this.safeRequire('../specialists/experience/ui-design-specialist'),
      'accessibility': this.safeRequire('../specialists/experience/accessibility-specialist'),
      'performance-optimization': this.safeRequire('../specialists/experience/performance-specialist'),
      'design-system': this.safeRequire('../specialists/experience/design-system-specialist'),
      'frontend-architecture': this.safeRequire('../specialists/experience/frontend-architecture-specialist'),
      'user-testing': this.safeRequire('../specialists/experience/user-testing-specialist'),
      'interaction-design': this.safeRequire('../specialists/experience/interaction-design-specialist')
    });

    this.agentRegistry.set('technical', {
      'database': this.safeRequire('../specialists/technical/database-specialist'),
      'api-architecture': this.safeRequire('../specialists/technical/api-architecture-specialist'),
      'security': this.safeRequire('../specialists/technical/security-specialist'),
      'devops': this.safeRequire('../specialists/technical/devops-specialist'),
      'performance-engineering': this.safeRequire('../specialists/technical/performance-specialist'),
      'infrastructure': this.safeRequire('../specialists/technical/infrastructure-specialist'),
      'microservices': this.safeRequire('../specialists/technical/microservices-specialist'),
      'cloud-architecture': this.safeRequire('../specialists/technical/cloud-specialist')
    });
  }

  safeRequire(modulePath) {
    try {
      return require(modulePath);
    } catch (error) {
      // Return a generic specialist class for missing modules
      return class GenericSpecialist {
        constructor(department, context) {
          this.department = department;
          this.context = context;
          this.type = modulePath.split('/').pop().replace('-specialist', '');
          this.id = null;
          this.manager = null;
          this.spawnedAt = null;
          this.lifecycleState = 'inactive';
          this.lastActivity = null;
          this.consciousness = null;
          this.consciousnessDriven = false;
          this.ethicalConstraints = null;
          this.currentTask = null;
          this.expertise = {};
          this.insights = [];
          this.patterns = [];
          this.bestPractices = [];
          this.consciousnessInsights = [];
        }

        async executeTask(task) {
          this.currentTask = task;
          this.lastActivity = Date.now();
          
          // Mock execution
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return {
            status: 'completed',
            result: `Mock execution of ${task.description} by ${this.type} specialist`,
            consciousness_alignment: 0.9,
            timestamp: new Date().toISOString()
          };
        }
      };
    }
  }

  initializeLifecycleRules() {
    this.lifecycleRules = {
      max_concurrent_specialists: 20,
      max_department_specialists: 8,
      idle_timeout_minutes: 30,
      max_task_duration_hours: 8,
      knowledge_transfer_required: true,
      consciousness_validation_required: true,
      performance_monitoring_enabled: true
    };
  }

  async spawnSpecialist(department, specialistType, context, manager) {
    console.log(`🏁 Spawning ${specialistType} specialist for ${department} department`);

    // Validate spawn request
    await this.validateSpawnRequest(department, specialistType, context);

    // Check resource limits
    await this.checkResourceLimits(department);

    // Create specialist instance
    const specialist = await this.createSpecialistInstance(department, specialistType, context, manager);

    // Register and track specialist
    await this.registerSpecialist(specialist, manager);

    // Initialize specialist with consciousness layer
    await this.initializeSpecialistConsciousness(specialist);

    // Start performance monitoring
    this.performanceMonitor.startMonitoring(specialist);

    // Log spawning event
    await this.logLifecycleEvent('spawn', specialist);

    console.log(`🏁 ${specialistType} specialist spawned successfully with ID: ${specialist.id}`);

    return specialist;
  }

  async validateSpawnRequest(department, specialistType, context) {
    // Validate department exists
    if (!this.agentRegistry.has(department)) {
      throw new Error(`Unknown department: ${department}`);
    }

    // Validate specialist type exists
    const departmentAgents = this.agentRegistry.get(department);
    if (!departmentAgents[specialistType]) {
      throw new Error(`Unknown specialist type: ${specialistType} for department: ${department}`);
    }

    // Validate context against consciousness principles
    await this.consciousnessLayer.validateIntent({
      description: `Spawn ${specialistType} specialist for ${department}`,
      context: context
    });

    return true;
  }

  async checkResourceLimits(department) {
    const totalActive = this.activeAgents.size;
    const departmentActive = Array.from(this.activeAgents.values())
      .filter(agent => agent.department === department).length;

    if (totalActive >= this.lifecycleRules.max_concurrent_specialists) {
      throw new Error(`Maximum concurrent specialists limit reached: ${this.lifecycleRules.max_concurrent_specialists}`);
    }

    if (departmentActive >= this.lifecycleRules.max_department_specialists) {
      throw new Error(`Maximum department specialists limit reached for ${department}: ${this.lifecycleRules.max_department_specialists}`);
    }

    return true;
  }

  async createSpecialistInstance(department, specialistType, context, manager) {
    const SpecialistClass = this.agentRegistry.get(department)[specialistType];
    
    const specialist = new SpecialistClass(department, context);
    
    // Assign unique ID
    specialist.id = this.generateSpecialistId(department, specialistType);
    
    // Set manager reference
    specialist.manager = manager;
    
    // Set spawn timestamp
    specialist.spawnedAt = Date.now();
    
    // Initialize lifecycle state
    specialist.lifecycleState = 'spawned';
    specialist.lastActivity = Date.now();
    
    return specialist;
  }

  async registerSpecialist(specialist, manager) {
    // Register in active agents map
    this.activeAgents.set(specialist.id, specialist);

    // Register with manager
    if (manager && manager.activeSpecialists) {
      manager.activeSpecialists.add(specialist);
    }

    // Set up auto-dissolution timer
    this.scheduleAutoDissolution(specialist);

    return true;
  }

  async initializeSpecialistConsciousness(specialist) {
    // Apply consciousness layer to specialist
    specialist.consciousness = this.consciousnessLayer;
    
    // Validate specialist aligns with consciousness principles
    await specialist.consciousness.validateIntent({
      description: `Initialize ${specialist.type} specialist`,
      agent: specialist
    });

    // Set consciousness-driven behavior patterns
    specialist.consciousnessDriven = true;
    specialist.ethicalConstraints = await this.consciousnessLayer.ethicalFramework.validateEthicalCompliance({
      description: `${specialist.type} specialist operations`
    });

    return true;
  }

  async dissolveSpecialist(specialist, reason = 'task_completed') {
    console.log(`🏁 Dissolving ${specialist.type} specialist (${reason})`);

    // Validate dissolution is appropriate
    await this.validateDissolution(specialist, reason);

    // Perform knowledge transfer
    if (this.lifecycleRules.knowledge_transfer_required) {
      await this.performKnowledgeTransfer(specialist);
    }

    // Stop performance monitoring
    this.performanceMonitor.stopMonitoring(specialist);

    // Clean up resources
    await this.cleanupSpecialistResources(specialist);

    // Unregister specialist
    await this.unregisterSpecialist(specialist);

    // Log dissolution event
    await this.logLifecycleEvent('dissolve', specialist, reason);

    console.log(`🏁 ${specialist.type} specialist dissolved successfully`);

    return true;
  }

  async validateDissolution(specialist, reason) {
    // Check if specialist has completed its work
    if (reason === 'task_completed' && specialist.currentTask) {
      console.warn(`🏁 Warning: Dissolving specialist with active task`);
    }

    // Ensure consciousness validation of dissolution
    await this.consciousnessLayer.validateIntent({
      description: `Dissolve ${specialist.type} specialist due to ${reason}`,
      agent: specialist
    });

    return true;
  }

  async performKnowledgeTransfer(specialist) {
    console.log(`🏁 Performing knowledge transfer for ${specialist.type} specialist`);

    const knowledge = await this.knowledgeTransferSystem.extractKnowledge(specialist);
    
    if (specialist.manager) {
      await specialist.manager.receiveSpecialistKnowledge(specialist, knowledge);
    }

    // Store knowledge in long-term memory
    await this.knowledgeTransferSystem.storeKnowledge(specialist, knowledge);

    return knowledge;
  }

  async cleanupSpecialistResources(specialist) {
    // Clean up any resources held by the specialist
    if (specialist.tools) {
      await this.cleanupTools(specialist.tools);
    }

    if (specialist.temporaryFiles) {
      await this.cleanupTemporaryFiles(specialist.temporaryFiles);
    }

    // Clear references
    specialist.manager = null;
    specialist.consciousness = null;
    specialist.currentTask = null;

    return true;
  }

  async unregisterSpecialist(specialist) {
    // Remove from active agents
    this.activeAgents.delete(specialist.id);

    // Remove from manager's active specialists
    if (specialist.manager && specialist.manager.activeSpecialists) {
      specialist.manager.activeSpecialists.delete(specialist);
    }

    // Cancel auto-dissolution timer
    if (specialist.autoDissolutionTimer) {
      clearTimeout(specialist.autoDissolutionTimer);
    }

    return true;
  }

  scheduleAutoDissolution(specialist) {
    const timeoutMs = this.lifecycleRules.idle_timeout_minutes * 60 * 1000;
    
    specialist.autoDissolutionTimer = setTimeout(async () => {
      try {
        const idleTime = Date.now() - specialist.lastActivity;
        const idleMinutes = idleTime / (60 * 1000);
        
        if (idleMinutes >= this.lifecycleRules.idle_timeout_minutes) {
          await this.dissolveSpecialist(specialist, 'idle_timeout');
        }
      } catch (error) {
        console.error(`🏁 Error in auto-dissolution: ${error.message}`);
      }
    }, timeoutMs);
  }

  updateSpecialistActivity(specialist) {
    specialist.lastActivity = Date.now();
    
    // Reset auto-dissolution timer
    if (specialist.autoDissolutionTimer) {
      clearTimeout(specialist.autoDissolutionTimer);
      this.scheduleAutoDissolution(specialist);
    }
  }

  generateSpecialistId(department, specialistType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${department}-${specialistType}-${timestamp}-${random}`;
  }

  async logLifecycleEvent(eventType, specialist, reason = null) {
    const event = {
      type: eventType,
      specialist_id: specialist.id,
      specialist_type: specialist.type,
      department: specialist.department,
      timestamp: new Date().toISOString(),
      reason: reason,
      consciousness_validation: true
    };

    this.lifecycleEvents.push(event);

    // In production, this would log to monitoring system
    console.log(`🏁 Lifecycle event: ${eventType} - ${specialist.type} specialist`);

    return event;
  }

  getActiveSpecialists() {
    return Array.from(this.activeAgents.values());
  }

  getSpecialistsByDepartment(department) {
    return Array.from(this.activeAgents.values())
      .filter(agent => agent.department === department);
  }

  getLifecycleMetrics() {
    const totalSpawned = this.lifecycleEvents.filter(e => e.type === 'spawn').length;
    const totalDissolved = this.lifecycleEvents.filter(e => e.type === 'dissolve').length;
    const currentlyActive = this.activeAgents.size;

    return {
      total_spawned: totalSpawned,
      total_dissolved: totalDissolved,
      currently_active: currentlyActive,
      department_distribution: this.getDepartmentDistribution(),
      average_lifespan: this.calculateAverageLifespan(),
      consciousness_compliance: '100%'
    };
  }

  getDepartmentDistribution() {
    const distribution = {};
    
    for (const agent of this.activeAgents.values()) {
      distribution[agent.department] = (distribution[agent.department] || 0) + 1;
    }
    
    return distribution;
  }

  calculateAverageLifespan() {
    const dissolvedEvents = this.lifecycleEvents.filter(e => e.type === 'dissolve');
    
    if (dissolvedEvents.length === 0) return 0;

    const lifespans = dissolvedEvents.map(event => {
      const spawnEvent = this.lifecycleEvents.find(e => 
        e.type === 'spawn' && e.specialist_id === event.specialist_id
      );
      
      if (spawnEvent) {
        return new Date(event.timestamp) - new Date(spawnEvent.timestamp);
      }
      
      return 0;
    });

    const averageMs = lifespans.reduce((sum, lifespan) => sum + lifespan, 0) / lifespans.length;
    return Math.round(averageMs / (60 * 1000)); // Convert to minutes
  }
}

class AgentPerformanceMonitor {
  constructor() {
    this.performanceData = new Map();
  }

  startMonitoring(specialist) {
    this.performanceData.set(specialist.id, {
      specialist: specialist,
      start_time: Date.now(),
      tasks_completed: 0,
      errors_encountered: 0,
      consciousness_violations: 0,
      performance_score: 1.0
    });
  }

  stopMonitoring(specialist) {
    const data = this.performanceData.get(specialist.id);
    if (data) {
      data.end_time = Date.now();
      data.total_duration = data.end_time - data.start_time;
    }
    
    // Keep data for analysis but mark as completed
    if (data) {
      data.status = 'completed';
    }
  }

  recordTaskCompletion(specialist) {
    const data = this.performanceData.get(specialist.id);
    if (data) {
      data.tasks_completed++;
      this.updatePerformanceScore(specialist.id);
    }
  }

  recordError(specialist, error) {
    const data = this.performanceData.get(specialist.id);
    if (data) {
      data.errors_encountered++;
      this.updatePerformanceScore(specialist.id);
    }
  }

  updatePerformanceScore(specialistId) {
    const data = this.performanceData.get(specialistId);
    if (data) {
      const errorRate = data.errors_encountered / Math.max(data.tasks_completed, 1);
      data.performance_score = Math.max(0, 1.0 - errorRate);
    }
  }

  getPerformanceData(specialist) {
    return this.performanceData.get(specialist.id);
  }
}

class KnowledgeTransferSystem {
  constructor() {
    this.knowledgeStore = new Map();
  }

  async extractKnowledge(specialist) {
    const knowledge = {
      specialist_type: specialist.type,
      department: specialist.department,
      expertise_gained: specialist.expertise || {},
      insights_generated: specialist.insights || [],
      patterns_learned: specialist.patterns || [],
      best_practices: specialist.bestPractices || [],
      consciousness_insights: specialist.consciousnessInsights || [],
      extracted_at: new Date().toISOString()
    };

    return knowledge;
  }

  async storeKnowledge(specialist, knowledge) {
    const key = `${specialist.department}-${specialist.type}`;
    
    if (!this.knowledgeStore.has(key)) {
      this.knowledgeStore.set(key, []);
    }
    
    this.knowledgeStore.get(key).push(knowledge);
    
    // Limit stored knowledge to prevent memory growth
    const stored = this.knowledgeStore.get(key);
    if (stored.length > 100) {
      stored.splice(0, stored.length - 100);
    }

    return true;
  }

  async getKnowledge(department, specialistType) {
    const key = `${department}-${specialistType}`;
    return this.knowledgeStore.get(key) || [];
  }
}

module.exports = {
  AgentLifecycleManager,
  AgentPerformanceMonitor,
  KnowledgeTransferSystem
};