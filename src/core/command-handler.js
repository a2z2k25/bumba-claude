/**
 * BUMBA 2.0 Command Handler
 * Integrates BUMBA 2.0 capabilities with existing command structure
 */

const { createBumbaFramework } = require('./bumba-framework-2');

class BumbaCommandHandler {
  constructor() {
    this.framework = createBumbaFramework({ legacy: false });
    this.initializeCommandMappings();
  }

  initializeCommandMappings() {
    this.commandMappings = {
      // Core BUMBA commands
      'implement': this.handleImplement.bind(this),
      'analyze': this.handleAnalyze.bind(this),
      'design': this.handleDesign.bind(this),
      'secure': this.handleSecure.bind(this),
      'improve': this.handleImprove.bind(this),
      
      // Department-specific commands
      'implement-strategy': this.handleImplementStrategy.bind(this),
      'implement-design': this.handleImplementDesign.bind(this),
      'implement-technical': this.handleImplementTechnical.bind(this),
      
      // Multi-agent commands
      'implement-agents': this.handleImplementAgents.bind(this),
      'team': this.handleTeam.bind(this),
      'collaborate': this.handleCollaborate.bind(this),
      
      // Executive commands
      'executive-mode': this.handleExecutiveMode.bind(this),
      'orchestrate': this.handleOrchestrate.bind(this),
      
      // BUMBA 2.0 New Commands
      // Predictive orchestration
      'predict': this.handlePredict.bind(this),
      'optimize': this.handleOptimize.bind(this),
      'adapt': this.handleAdapt.bind(this),
      
      // Agent management
      'spawn': this.handleSpawn.bind(this),
      'dissolve': this.handleDissolve.bind(this),
      'specialists': this.handleSpecialists.bind(this),
      
      // Ecosystem integration
      'ecosystem:discover': this.handleEcosystemDiscover.bind(this),
      'ecosystem:integrate': this.handleEcosystemIntegrate.bind(this),
      'ecosystem:status': this.handleEcosystemStatus.bind(this),
      
      // Learning and optimization
      'learn': this.handleLearn.bind(this),
      'learn:report': this.handleLearningReport.bind(this),
      'optimize:performance': this.handleOptimizePerformance.bind(this),
      'optimize:consciousness': this.handleOptimizeConsciousness.bind(this),
      
      // Coordination protocols
      'coord:sequential': this.handleCoordSequential.bind(this),
      'coord:parallel': this.handleCoordParallel.bind(this),
      'coord:collaborative': this.handleCoordCollaborative.bind(this),
      'coord:orchestrated': this.handleCoordOrchestrated.bind(this),
      
      // System commands
      'status': this.handleStatus.bind(this),
      'help': this.handleHelp.bind(this),
      'menu': this.handleMenu.bind(this),
      'settings': this.handleSettings.bind(this)
    };
  }

  async handleCommand(command, args = [], context = {}) {
    // Remove 'bumba:' prefix if present
    const cleanCommand = command.replace(/^bumba:/, '');
    
    const handler = this.commandMappings[cleanCommand];
    
    if (handler) {
      return await handler(args, context);
    } else {
      // Try processing through framework directly
      return await this.framework.processCommand(cleanCommand, args, context);
    }
  }

  async handleImplement(args, context) {
    const feature = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Implementing ${feature} with intelligent routing`);
    
    return await this.framework.processCommand('implement', args, context);
  }

  async handleImplementAgents(args, context) {
    const feature = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Multi-agent implementation of ${feature}`);
    
    // This will trigger executive mode if needed
    return await this.framework.processCommand('implement-agents', args, {
      ...context,
      multi_agent: true,
      collaboration_required: true
    });
  }

  async handleExecutiveMode(args, context) {
    const initiative = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Activating Executive Mode for ${initiative}`);
    
    return await this.framework.activateExecutiveMode(initiative, context);
  }

  async handleStatus(args, context) {
    console.log('🏁 BUMBA 2.0 Framework Status');
    
    const status = await this.framework.getFrameworkStatus();
    
    // Display formatted status
    this.displayFrameworkStatus(status);
    
    return status;
  }

  async handleMenu(args, context) {
    console.log('🏁 BUMBA 2.0 Command Menu');
    
    const commands = await this.framework.getAvailableCommands();
    
    // Display interactive menu
    this.displayCommandMenu(commands);
    
    return commands;
  }

  displayFrameworkStatus(status) {
    const Table = require('cli-table3');
    const chalk = require('chalk');
    
    console.log(chalk.bold('\n🏁 BUMBA Framework Status\n'));
    
    // Framework info
    const frameworkTable = new Table({
      head: ['Property', 'Value'],
      style: { head: [], border: [] }
    });
    
    frameworkTable.push(
      ['Framework', status.framework],
      ['Version', status.version],
      ['Architecture', status.architecture],
      ['Consciousness', status.consciousness_enabled ? '✓ Enabled' : '✗ Disabled'],
      ['Philosophy', status.philosophy]
    );
    
    console.log(frameworkTable.toString());
    
    // Department status
    if (status.departments) {
      console.log(chalk.bold('\n🏁 Department Status\n'));
      
      const deptTable = new Table({
        head: ['Department', 'Manager', 'Active Specialists', 'Executive Mode'],
        style: { head: [], border: [] }
      });
      
      for (const [name, dept] of Object.entries(status.departments)) {
        deptTable.push([
          name.charAt(0).toUpperCase() + name.slice(1),
          dept.manager,
          dept.active_specialists.toString(),
          dept.executive_mode ? '✓ Active' : '✗ Inactive'
        ]);
      }
      
      console.log(deptTable.toString());
    }
    
    // Active specialists
    if (status.active_specialists > 0) {
      console.log(chalk.bold(`\n🏁 Active Specialists: ${status.active_specialists}\n`));
    }
    
    // Consciousness metrics
    if (status.consciousness_metrics) {
      console.log(chalk.bold('\n🏁 Consciousness Metrics\n'));
      
      const consciousnessTable = new Table({
        head: ['Metric', 'Score'],
        style: { head: [], border: [] }
      });
      
      const metrics = status.consciousness_metrics;
      consciousnessTable.push(
        ['Overall Rating', `${(metrics.overall_consciousness_rating * 100).toFixed(1)}%`],
        ['Ethical Compliance', `${(metrics.ethical_compliance_rate * 100).toFixed(1)}%`],
        ['Sustainability Index', `${(metrics.sustainability_index * 100).toFixed(1)}%`],
        ['Community Benefit', `${(metrics.community_benefit_score * 100).toFixed(1)}%`]
      );
      
      console.log(consciousnessTable.toString());
    }
  }

  displayCommandMenu(commands) {
    const Table = require('cli-table3');
    const chalk = require('chalk');
    
    console.log(chalk.bold('\n🏁 BUMBA 2.0 Command Menu\n'));
    
    // Core commands
    console.log(chalk.bold('Core Development Commands:'));
    const coreTable = new Table({
      head: ['Command', 'Description'],
      style: { head: [], border: [] },
      colWidths: [30, 50]
    });
    
    coreTable.push(
      ['/bumba:implement [feature]', 'Intelligent feature development with auto-routing'],
      ['/bumba:analyze [target]', 'Multi-dimensional code analysis'],
      ['/bumba:design [workflow]', 'Designer-focused workflows'],
      ['/bumba:secure [scope]', 'Enhanced security validation']
    );
    
    console.log(coreTable.toString());
    
    // Multi-agent commands
    console.log(chalk.bold('\nMulti-Agent Collaboration:'));
    const multiAgentTable = new Table({
      head: ['Command', 'Description'],
      style: { head: [], border: [] },
      colWidths: [30, 50]
    });
    
    multiAgentTable.push(
      ['/bumba:implement-agents [feature]', 'Full team collaboration on complex features'],
      ['/bumba:executive-mode [initiative]', 'CEO-level organizational leadership'],
      ['/bumba:team [action]', 'Team coordination and management'],
      ['/bumba:collaborate [action]', 'Cross-department collaboration']
    );
    
    console.log(multiAgentTable.toString());
    
    // Department-specific commands
    console.log(chalk.bold('\nDepartment-Specific Commands:'));
    const deptTable = new Table({
      head: ['Command', 'Description'],
      style: { head: [], border: [] },
      colWidths: [30, 50]
    });
    
    deptTable.push(
      ['/bumba:implement-strategy [task]', 'Product-Strategist led implementation'],
      ['/bumba:implement-design [task]', 'Design-Engineer led implementation'],
      ['/bumba:implement-technical [task]', 'Backend-Engineer led implementation']
    );
    
    console.log(deptTable.toString());
    
    // System commands
    console.log(chalk.bold('\nSystem Commands:'));
    const systemTable = new Table({
      head: ['Command', 'Description'],
      style: { head: [], border: [] },
      colWidths: [30, 50]
    });
    
    systemTable.push(
      ['/bumba:status', 'Framework and department status'],
      ['/bumba:menu', 'This command menu'],
      ['/bumba:help [command]', 'Contextual help for specific commands'],
      ['/bumba:settings', 'Framework configuration']
    );
    
    console.log(systemTable.toString());
    
    console.log(chalk.dim('\n🏁 Use any command above or try "/bumba:help [command]" for detailed information\n'));
  }

  async handleHelp(args, context) {
    const command = args[0];
    
    if (!command) {
      return await this.handleMenu([], context);
    }
    
    // Provide help for specific command
    const helpText = this.getCommandHelp(command);
    console.log(helpText);
    
    return { command: command, help: helpText };
  }

  getCommandHelp(command) {
    const helpTexts = {
      'implement': `
🏁 /bumba:implement [feature]

Intelligent feature development with automatic routing to appropriate agents.

Examples:
  /bumba:implement user authentication
  /bumba:implement responsive dashboard
  /bumba:implement payment processing

The system will analyze complexity and route to:
- Single department for simple tasks
- Multiple departments for complex features
- Executive mode for organizational initiatives`,

      'implement-agents': `
🏁 /bumba:implement-agents [feature]

Full multi-agent collaboration for complex features requiring all departments.

Examples:
  /bumba:implement-agents e-commerce platform
  /bumba:implement-agents enterprise dashboard
  /bumba:implement-agents complete user system

This activates all three departments with specialist support as needed.`,

      'executive-mode': `
🏁 /bumba:executive-mode [initiative]

Activate CEO-level organizational leadership for complex initiatives.

Examples:
  /bumba:executive-mode platform transformation
  /bumba:executive-mode enterprise integration
  /bumba:executive-mode organizational restructure

Product-Strategist assumes CEO role with full organizational authority.`,

      'status': `
🏁 /bumba:status

Display comprehensive framework status including:
- Department manager status
- Active specialists count
- Executive mode status
- Consciousness metrics
- Performance indicators`
    };

    return helpTexts[command] || `🏁 No help available for command: ${command}`;
  }

  // Additional handlers for other commands...
  async handleAnalyze(args, context) {
    return await this.framework.processCommand('analyze', args, context);
  }

  async handleDesign(args, context) {
    return await this.framework.processCommand('design', args, context);
  }

  async handleSecure(args, context) {
    return await this.framework.processCommand('secure', args, context);
  }

  async handleImprove(args, context) {
    return await this.framework.processCommand('improve', args, context);
  }

  async handleImplementStrategy(args, context) {
    return await this.framework.processCommand('implement-strategy', args, context);
  }

  async handleImplementDesign(args, context) {
    return await this.framework.processCommand('implement-design', args, context);
  }

  async handleImplementTechnical(args, context) {
    return await this.framework.processCommand('implement-technical', args, context);
  }

  async handleTeam(args, context) {
    return await this.framework.processCommand('team', args, context);
  }

  async handleCollaborate(args, context) {
    return await this.framework.processCommand('collaborate', args, context);
  }

  async handleOrchestrate(args, context) {
    return await this.framework.processCommand('orchestrate', args, context);
  }

  async handleSettings(args, context) {
    return await this.framework.processCommand('settings', args, context);
  }

  // BUMBA 2.0 New Command Handlers

  async handlePredict(args, context) {
    const task = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Predicting orchestration for ${task}`);
    
    if (!this.framework.router.predictiveOrchestration) {
      return { error: 'Predictive orchestration not available' };
    }
    
    const taskData = {
      description: task,
      command: 'predict',
      args: args,
      type: 'prediction_request'
    };
    
    return await this.framework.router.predictiveOrchestration.analyzeTaskPredictively(taskData, context);
  }

  async handleOptimize(args, context) {
    const target = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Optimizing ${target}`);
    
    return await this.framework.processCommand('optimize', args, {
      ...context,
      optimization_request: true,
      predictive_optimization: true
    });
  }

  async handleAdapt(args, context) {
    const adaptation = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Adapting strategy for ${adaptation}`);
    
    return await this.framework.processCommand('adapt', args, {
      ...context,
      adaptation_request: true,
      real_time_adaptation: true
    });
  }

  async handleSpawn(args, context) {
    const [department, specialistType] = args;
    console.log(`🏁 BUMBA 2.0: Spawning ${specialistType} specialist for ${department}`);
    
    if (!department || !specialistType) {
      return { error: 'Usage: spawn <department> <specialist-type>' };
    }
    
    return await this.framework.spawnSpecialist(department, specialistType, context);
  }

  async handleDissolve(args, context) {
    const specialistId = args[0];
    console.log(`🏁 BUMBA 2.0: Dissolving specialist ${specialistId}`);
    
    if (!specialistId) {
      return { error: 'Usage: dissolve <specialist-id>' };
    }
    
    // Implementation would interface with lifecycle manager
    return { 
      message: `Dissolution request for ${specialistId} queued`,
      status: 'pending'
    };
  }

  async handleSpecialists(args, context) {
    const action = args[0] || 'list';
    console.log(`🏁 BUMBA 2.0: Managing specialists - ${action}`);
    
    const lifecycleManager = this.framework.lifecycleManager;
    
    switch (action) {
      case 'list':
        return {
          active_specialists: lifecycleManager.getActiveSpecialists(),
          metrics: lifecycleManager.getLifecycleMetrics()
        };
      case 'status':
        return lifecycleManager.getLifecycleMetrics();
      default:
        return { error: 'Available actions: list, status' };
    }
  }

  async handleEcosystemDiscover(args, context) {
    console.log('🏁 BUMBA 2.0: Discovering ecosystem services...');
    
    return await this.framework.ecosystemIntegration.discoverAndIntegrateEcosystem({
      ...context,
      discovery_only: true
    });
  }

  async handleEcosystemIntegrate(args, context) {
    const serviceName = args[0];
    const department = args[1] || 'general';
    
    console.log(`🏁 BUMBA 2.0: Integrating ${serviceName} for ${department}`);
    
    if (!serviceName) {
      return { error: 'Usage: ecosystem:integrate <service-name> [department]' };
    }
    
    return await this.framework.ecosystemIntegration.requestIntegration(
      serviceName,
      department,
      `Manual integration request from command line`
    );
  }

  async handleEcosystemStatus(args, context) {
    console.log('🏁 BUMBA 2.0: Ecosystem integration status');
    
    return {
      active_integrations: this.framework.ecosystemIntegration.getActiveIntegrations(),
      capability_registry: this.framework.ecosystemIntegration.getCapabilityRegistry(),
      integration_history: this.framework.ecosystemIntegration.getIntegrationHistory()
    };
  }

  async handleLearn(args, context) {
    const learningType = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Learning from ${learningType}`);
    
    // This would interface with the learning engine
    return {
      message: `Learning initiated for: ${learningType}`,
      status: 'in_progress'
    };
  }

  async handleLearningReport(args, context) {
    console.log('🏁 BUMBA 2.0: Generating learning report...');
    
    // This would interface with the learning engine
    return {
      learning_summary: 'Learning analytics not yet implemented in this build',
      performance_trends: {},
      optimization_impact: {},
      future_recommendations: []
    };
  }

  async handleOptimizePerformance(args, context) {
    const target = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Optimizing performance for ${target}`);
    
    return await this.framework.processCommand('optimize', args, {
      ...context,
      optimization_type: 'performance',
      performance_focus: true
    });
  }

  async handleOptimizeConsciousness(args, context) {
    const target = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Optimizing consciousness alignment for ${target}`);
    
    return await this.framework.processCommand('optimize', args, {
      ...context,
      optimization_type: 'consciousness',
      consciousness_focus: true
    });
  }

  async handleCoordSequential(args, context) {
    const task = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Sequential coordination for ${task}`);
    
    return await this.framework.processCommand('coordinate', args, {
      ...context,
      coordination_type: 'sequential'
    });
  }

  async handleCoordParallel(args, context) {
    const task = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Parallel coordination for ${task}`);
    
    return await this.framework.processCommand('coordinate', args, {
      ...context,
      coordination_type: 'parallel'
    });
  }

  async handleCoordCollaborative(args, context) {
    const task = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Collaborative coordination for ${task}`);
    
    return await this.framework.processCommand('coordinate', args, {
      ...context,
      coordination_type: 'collaborative'
    });
  }

  async handleCoordOrchestrated(args, context) {
    const task = args.join(' ');
    console.log(`🏁 BUMBA 2.0: Orchestrated coordination for ${task}`);
    
    return await this.framework.processCommand('coordinate', args, {
      ...context,
      coordination_type: 'orchestrated'
    });
  }
}

module.exports = BumbaCommandHandler;