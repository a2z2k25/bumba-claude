/**
 * BUMBA 2.0 Intelligent Routing & Agent Spawning System
 * Routes tasks to appropriate agents and manages specialist spawning
 */

const { PredictiveOrchestrationEngine } = require('./intelligence/predictive-orchestration');
const ProductStrategistManager = require('./departments/product-strategist-manager');
const DesignEngineerManager = require('./departments/design-engineer-manager');
const BackendEngineerManager = require('./departments/backend-engineer-manager');

class BumbaIntelligentRouter {
  constructor() {
    this.departments = new Map();
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.predictiveEngine = new PredictiveEngine();
    this.spawningController = new SpecialistSpawningController();
    this.executiveController = new ExecutiveController();
    this.predictiveOrchestration = new PredictiveOrchestrationEngine();
    
    this.initializeDepartments();
    this.initializeRoutingRules();
  }

  initializeDepartments() {
    // Register the three core BUMBA department managers
    this.departments.set('strategic', new ProductStrategistManager());
    this.departments.set('experience', new DesignEngineerManager());
    this.departments.set('technical', new BackendEngineerManager());
  }

  initializeRoutingRules() {
    this.routingRules = {
      // Task complexity thresholds
      simple: 0.3,          // Single department manager handles
      moderate: 0.6,        // Department manager + 1-2 specialists
      complex: 0.8,         // Multiple departments + specialists
      enterprise: 0.9,      // Executive mode + full organization

      // Keyword-based department routing
      strategic_keywords: [
        'business', 'strategy', 'market', 'requirements', 'prd', 'roadmap',
        'stakeholder', 'competitor', 'revenue', 'pricing', 'user-story'
      ],
      experience_keywords: [
        'design', 'ui', 'ux', 'frontend', 'interface', 'component', 'figma',
        'accessibility', 'responsive', 'wireframe', 'prototype', 'visual'
      ],
      technical_keywords: [
        'backend', 'api', 'database', 'security', 'infrastructure', 'deployment',
        'performance', 'architecture', 'server', 'auth', 'integration'
      ],
      executive_keywords: [
        'enterprise', 'organization', 'platform', 'ecosystem', 'transformation',
        'initiative', 'company-wide', 'strategic-planning', 'resource-allocation'
      ]
    };
  }

  async routeCommand(command, args, context) {
    console.log(`🏁 BUMBA Router analyzing command: ${command}`);
    
    // Analyze task complexity and requirements
    const analysis = await this.analyzeTask(command, args, context);
    
    // Determine routing strategy
    const route = await this.determineRoute(analysis);
    
    // Execute routing strategy
    return await this.executeRoute(route, command, args, context);
  }

  async analyzeTask(command, args, context) {
    const complexity = await this.complexityAnalyzer.analyze(command, args, context);
    const departments = await this.identifyRequiredDepartments(command, args);
    const specialists = await this.identifyPotentialSpecialists(command, args, departments);
    const executiveNeed = await this.assessExecutiveNeed(command, args, complexity);
    
    // Predictive analysis for proactive preparation
    const predictions = await this.predictiveEngine.predictNextSteps(command, args, context);
    
    return {
      complexity,
      departments,
      specialists,
      executiveNeed,
      predictions,
      timestamp: Date.now(),
      sessionContext: context
    };
  }

  async identifyRequiredDepartments(command, args) {
    const requiredDepartments = new Set();
    const taskDescription = `${command} ${args.join(' ')}`.toLowerCase();
    
    // Check strategic department keywords
    if (this.routingRules.strategic_keywords.some(keyword => 
        taskDescription.includes(keyword))) {
      requiredDepartments.add('strategic');
    }
    
    // Check experience department keywords  
    if (this.routingRules.experience_keywords.some(keyword => 
        taskDescription.includes(keyword))) {
      requiredDepartments.add('experience');
    }
    
    // Check technical department keywords
    if (this.routingRules.technical_keywords.some(keyword => 
        taskDescription.includes(keyword))) {
      requiredDepartments.add('technical');
    }
    
    // Default to all departments for complex or ambiguous tasks
    if (requiredDepartments.size === 0) {
      requiredDepartments.add('strategic');
      requiredDepartments.add('experience'); 
      requiredDepartments.add('technical');
    }
    
    return Array.from(requiredDepartments);
  }

  async identifyPotentialSpecialists(command, args, departments) {
    const specialistMap = {};
    
    for (const dept of departments) {
      const deptManager = this.departments.get(dept);
      const specialists = await deptManager.identifyNeededSpecialists(command, args);
      specialistMap[dept] = specialists;
    }
    
    return specialistMap;
  }

  async assessExecutiveNeed(command, args, complexity) {
    const taskDescription = `${command} ${args.join(' ')}`.toLowerCase();
    
    // Check for executive-level keywords
    const hasExecutiveKeywords = this.routingRules.executive_keywords.some(keyword => 
      taskDescription.includes(keyword));
    
    // High complexity automatically triggers executive consideration
    const highComplexity = complexity > this.routingRules.complex;
    
    // Multi-department coordination needs
    const needsCoordination = taskDescription.includes('platform') || 
                             taskDescription.includes('system') ||
                             taskDescription.includes('complete');
    
    return hasExecutiveKeywords || highComplexity || needsCoordination;
  }

  async determineRoute(analysis) {
    const { complexity, departments, specialists, executiveNeed, predictions } = analysis;
    
    if (executiveNeed || complexity > this.routingRules.enterprise) {
      return {
        type: 'executive',
        mode: 'ceo',
        departments: departments,
        specialists: specialists,
        coordinator: this.executiveController
      };
    }
    
    if (complexity > this.routingRules.complex) {
      return {
        type: 'multi-department',
        departments: departments,
        specialists: specialists,
        coordination: 'peer-to-peer'
      };
    }
    
    if (complexity > this.routingRules.moderate) {
      return {
        type: 'department-with-specialists',
        primaryDepartment: departments[0],
        specialists: specialists[departments[0]] || [],
        supportDepartments: departments.slice(1)
      };
    }
    
    return {
      type: 'single-department',
      department: departments[0] || 'strategic',
      manager: this.departments.get(departments[0] || 'strategic')
    };
  }

  async executeRoute(route, command, args, context) {
    console.log(`🏁 Executing route type: ${route.type}`);
    
    switch (route.type) {
      case 'executive':
        return await this.executeExecutiveRoute(route, command, args, context);
        
      case 'multi-department':
        return await this.executeMultiDepartmentRoute(route, command, args, context);
        
      case 'department-with-specialists':
        return await this.executeDepartmentWithSpecialists(route, command, args, context);
        
      case 'single-department':
        return await this.executeSingleDepartment(route, command, args, context);
        
      default:
        throw new Error(`Unknown route type: ${route.type}`);
    }
  }

  async executeExecutiveRoute(route, command, args, context) {
    console.log('🏁 Executive Mode: CEO taking organizational control with predictive orchestration');
    
    // Activate Product-Strategist executive mode
    const strategicManager = this.departments.get('strategic');
    const executive = await strategicManager.activateExecutiveMode();
    
    // Prepare task for predictive orchestration
    const task = {
      description: `${command} ${args.join(' ')}`,
      command: command,
      args: args,
      type: 'executive_initiative',
      departments_involved: route.departments,
      specialist_requirements: route.specialists
    };
    
    // Use predictive orchestration for intelligent execution
    const orchestrationResult = await this.predictiveOrchestration.orchestrateWithPrediction(
      task, 
      this.departments, 
      {
        ...context,
        executive_mode: true,
        ceo_authority: true,
        organizational_scope: true
      }
    );
    
    return {
      type: 'executive_orchestration',
      executive_mode: 'activated',
      orchestration_result: orchestrationResult,
      departments_coordinated: route.departments,
      predictive_intelligence: 'engaged',
      consciousness_validation: orchestrationResult.consciousness_alignment
    };
  }

  async executeMultiDepartmentRoute(route, command, args, context) {
    console.log('🏁 Multi-Department Collaboration with predictive orchestration');
    
    // Prepare task for predictive orchestration
    const task = {
      description: `${command} ${args.join(' ')}`,
      command: command,
      args: args,
      type: 'multi_department_collaboration',
      departments_involved: route.departments,
      specialist_requirements: route.specialists,
      coordination_type: route.coordination
    };
    
    // Use predictive orchestration for optimal coordination
    const orchestrationResult = await this.predictiveOrchestration.orchestrateWithPrediction(
      task, 
      this.departments, 
      {
        ...context,
        multi_department: true,
        collaboration_mode: route.coordination,
        departments_involved: route.departments
      }
    );
    
    return {
      type: 'multi_department_orchestration',
      collaboration_mode: route.coordination,
      orchestration_result: orchestrationResult,
      departments_coordinated: route.departments,
      predictive_optimization: orchestrationResult.optimization_achieved,
      consciousness_validation: orchestrationResult.consciousness_alignment
    };
  }

  async executeDepartmentWithSpecialists(route, command, args, context) {
    console.log(`🏁 ${route.primaryDepartment} Department leading with specialist support`);
    
    const primaryDept = this.departments.get(route.primaryDepartment);
    
    // Spawn needed specialists
    const specialists = await this.spawnDepartmentSpecialists(primaryDept, route.specialists);
    
    // Execute with specialist team
    return await primaryDept.executeWithSpecialists(command, args, specialists, context);
  }

  async executeSingleDepartment(route, command, args, context) {
    console.log(`🏁 Single department execution: ${route.department}`);
    
    // Simple task - department manager handles directly
    return await route.manager.executeTask(command, args, context);
  }

  async spawnDepartmentSpecialists(department, specialistTypes) {
    if (!specialistTypes || specialistTypes.length === 0) {
      return [];
    }
    
    const specialists = [];
    for (const type of specialistTypes) {
      const specialist = await department.spawnSpecialist(type);
      specialists.push(specialist);
    }
    
    return specialists;
  }
}

class ComplexityAnalyzer {
  constructor() {
    this.complexityFactors = {
      // Command complexity indicators
      keywords: {
        'implement': 0.7,
        'create': 0.6,
        'build': 0.8,
        'design': 0.5,
        'analyze': 0.4,
        'complete': 0.9,
        'enterprise': 0.9,
        'platform': 0.8,
        'system': 0.7,
        'architecture': 0.8
      },
      
      // Scope indicators
      scope: {
        'single': 0.2,
        'multiple': 0.6,
        'complete': 0.9,
        'entire': 0.9,
        'full': 0.8,
        'comprehensive': 0.8
      },
      
      // Technology complexity
      technology: {
        'api': 0.5,
        'database': 0.6,
        'microservices': 0.8,
        'cloud': 0.7,
        'ai': 0.7,
        'machine-learning': 0.8,
        'blockchain': 0.9
      }
    };
  }

  async analyze(command, args, context) {
    const taskText = `${command} ${args.join(' ')}`.toLowerCase();
    let complexity = 0.3; // Base complexity
    
    // Analyze keywords
    for (const [keyword, weight] of Object.entries(this.complexityFactors.keywords)) {
      if (taskText.includes(keyword)) {
        complexity += weight * 0.3;
      }
    }
    
    // Analyze scope
    for (const [scope, weight] of Object.entries(this.complexityFactors.scope)) {
      if (taskText.includes(scope)) {
        complexity += weight * 0.2;
      }
    }
    
    // Analyze technology complexity
    for (const [tech, weight] of Object.entries(this.complexityFactors.technology)) {
      if (taskText.includes(tech)) {
        complexity += weight * 0.1;
      }
    }
    
    // Analyze argument count and detail
    complexity += Math.min(args.length * 0.05, 0.2);
    
    // Context complexity (previous tasks, session history)
    if (context && context.previousTasks) {
      complexity += Math.min(context.previousTasks.length * 0.02, 0.1);
    }
    
    return Math.min(complexity, 1.0); // Cap at 1.0
  }
}

class PredictiveEngine {
  constructor() {
    this.patternDatabase = new PatternDatabase();
    this.workflowPredictor = new WorkflowPredictor();
  }

  async predictNextSteps(command, args, context) {
    // Analyze patterns from previous similar tasks
    const patterns = await this.patternDatabase.findSimilarPatterns(command, args);
    
    // Generate predictions based on patterns
    const predictions = await this.workflowPredictor.predict(patterns, context);
    
    return {
      nextCommands: predictions.likely_next_commands,
      requiredTools: predictions.required_tools,
      potentialIssues: predictions.potential_issues,
      optimizations: predictions.suggested_optimizations,
      confidence: predictions.confidence_score
    };
  }
}

class SpecialistSpawningController {
  constructor() {
    this.activeSpecialists = new Map();
    this.spawningQueue = [];
    this.dissolutionScheduler = new DissolutionScheduler();
  }

  async spawnSpecialist(department, type, context) {
    const specialist = await department.spawnSpecialist(type, context);
    
    // Track active specialist
    this.activeSpecialists.set(specialist.id, specialist);
    
    // Schedule automatic dissolution if no activity
    this.dissolutionScheduler.scheduleAutoDissolution(specialist);
    
    return specialist;
  }

  async dissolveSpecialist(specialist) {
    await specialist.department.dissolveSpecialist(specialist);
    this.activeSpecialists.delete(specialist.id);
    
    console.log(`🏁 Specialist ${specialist.type} dissolved and knowledge transferred`);
  }
}

class PatternDatabase {
  constructor() {
    this.patterns = new Map();
    this.patternHistory = [];
  }

  async findSimilarPatterns(command, args) {
    // Mock pattern matching
    return {
      similar_commands: [command],
      frequency: Math.random(),
      success_rate: 0.8 + Math.random() * 0.2,
      patterns: []
    };
  }

  async storePattern(command, args, result) {
    const pattern = {
      command,
      args,
      result,
      timestamp: Date.now()
    };
    
    const key = `${command}-${args.join('-')}`;
    if (!this.patterns.has(key)) {
      this.patterns.set(key, []);
    }
    this.patterns.get(key).push(pattern);
    this.patternHistory.push(pattern);
    
    return true;
  }
}

class WorkflowPredictor {
  constructor() {
    this.models = new Map();
  }

  async predict(patterns, context) {
    // Mock prediction
    return {
      likely_next_commands: ['status', 'analyze'],
      required_tools: ['consciousness', 'coordination'],
      potential_issues: [],
      suggested_optimizations: ['parallel_execution'],
      confidence_score: 0.85
    };
  }
}

class DissolutionScheduler {
  constructor() {
    this.scheduledDissolutions = new Map();
  }

  scheduleAutoDissolution(specialist) {
    // Mock scheduling
    const timeout = setTimeout(() => {
      console.log(`🏁 Auto-dissolving idle specialist: ${specialist.type}`);
    }, 30 * 60 * 1000); // 30 minutes
    
    this.scheduledDissolutions.set(specialist.id, timeout);
  }

  cancelAutoDissolution(specialist) {
    const timeout = this.scheduledDissolutions.get(specialist.id);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledDissolutions.delete(specialist.id);
    }
  }
}

class ExecutiveController {
  constructor() {
    this.executiveMode = false;
    this.currentExecutive = null;
    this.executiveTasks = [];
    this.organizationalAuthority = false;
  }

  async activateExecutiveMode(executive, initiative, context = {}) {
    console.log(`🏁 Activating Executive Mode: ${executive.type} taking CEO role for ${initiative}`);
    
    this.executiveMode = true;
    this.currentExecutive = executive;
    this.organizationalAuthority = true;
    
    return {
      status: 'executive_mode_activated',
      executive: executive.type,
      initiative: initiative,
      timestamp: new Date().toISOString()
    };
  }

  async deactivateExecutiveMode() {
    if (this.executiveMode) {
      console.log(`🏁 Deactivating Executive Mode: ${this.currentExecutive.type} stepping down from CEO role`);
      
      this.executiveMode = false;
      this.currentExecutive = null;
      this.organizationalAuthority = false;
      this.executiveTasks = [];
    }
    
    return {
      status: 'executive_mode_deactivated',
      timestamp: new Date().toISOString()
    };
  }

  isExecutiveModeActive() {
    return this.executiveMode;
  }

  getCurrentExecutive() {
    return this.currentExecutive;
  }

  async delegateToExecutive(task, context) {
    if (!this.executiveMode || !this.currentExecutive) {
      throw new Error('Executive mode not active');
    }
    
    this.executiveTasks.push({
      task,
      context,
      timestamp: Date.now()
    });
    
    return await this.currentExecutive.executeExecutiveTask(task, context);
  }
}

module.exports = {
  BumbaIntelligentRouter,
  ComplexityAnalyzer,
  PredictiveEngine,
  SpecialistSpawningController,
  PatternDatabase,
  WorkflowPredictor,
  DissolutionScheduler,
  ExecutiveController
};