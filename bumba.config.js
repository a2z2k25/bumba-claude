/**
 * BUMBA Framework Configuration
 * 
 * This file defines the default configuration for the BUMBA Framework.
 * Users can override these settings through environment variables or
 * local configuration files.
 */

module.exports = {
  // Framework Information
  framework: {
    name: 'BUMBA Claude Framework',
    version: '1.0.0',
    description: 'BUMBA 1.0: Revolutionary consciousness-driven AI framework with hierarchical multi-agent system, predictive orchestration, and ecosystem auto-integration'
  },

  // Installation Configuration
  installation: {
    targetDirectory: '~/.claude',
    backupDirectory: '~/.claude/backup',
    templateDirectory: './src/templates',
    hooksDirectory: './src/templates/hooks'
  },

  // MCP Server Configuration
  mcpServers: {
    // Product Strategy & Management
    notion: {
      enabled: true,
      package: '@modelcontextprotocol/server-notion',
      description: 'Comprehensive project management with timeline integration, workflow automation, and collaborative PRD editing',
      capabilities: {
        timeline_integration: true,
        workflow_automation: true,
        project_tracking: true,
        stakeholder_collaboration: true,
        document_templates: true,
        progress_monitoring: true
      }
    },
    airtable: {
      enabled: true,
      package: '@modelcontextprotocol/server-airtable',
      description: 'Project tracking and analytics integration'
    },

    // Design & Development
    figmaDevMode: {
      enabled: true,
      package: '@modelcontextprotocol/server-figma-dev-mode',
      description: 'Direct design-to-code workflows (Private Alpha)'
    },
    figmaContext: {
      enabled: true,
      package: '@modelcontextprotocol/server-figma-context',
      description: 'Layout analysis and design token extraction'
    },
    magicUI: {
      enabled: true,
      package: '@modelcontextprotocol/server-magic-ui',
      description: 'Modern UI component generation'
    },
    playwright: {
      enabled: true,
      package: '@modelcontextprotocol/server-playwright',
      description: 'Browser automation and testing'
    },

    // Intelligence & Quality
    context7: {
      enabled: true,
      package: '@modelcontextprotocol/server-context7',
      description: 'Official library docs lookup'
    },
    ref: {
      enabled: true,
      package: 'ref-tools-mcp',
      description: 'Token-efficient documentation search with 1000s of repos, 60-95% fewer tokens than Context7',
      installCommand: 'npx ref-tools-mcp',
      transport: 'stdio',
      environment: {
        REF_API_KEY: '<Required: Get from https://ref.tools>'
      },
      useCase: 'Development intelligence, documentation lookup, reducing hallucinations',
      category: 'documentation'
    },
    pieces: {
      enabled: true,
      package: 'pieces-mcp',
      description: 'Developer knowledge management and context-aware code snippet organization',
      installCommand: 'npx pieces-mcp',
      transport: 'stdio',
      environment: {
        PIECES_API_KEY: '<Optional: Enhanced features with Pieces account>'
      },
      useCase: 'Code snippet management, context-aware suggestions, developer workflow optimization',
      category: 'knowledge-management'
    },
    exa: {
      enabled: true,
      package: 'exa-mcp',
      description: 'AI-optimized search engine for high-quality semantic research and content discovery',
      installCommand: 'npx exa-mcp',
      transport: 'stdio',
      environment: {
        EXA_API_KEY: '<Required: Get from https://exa.ai>'
      },
      useCase: 'Semantic research, high-quality content retrieval, AI-optimized search beyond web crawling',
      category: 'research'
    },
    semgrep: {
      enabled: true,
      package: 'semgrep-mcp',
      description: 'Security vulnerability scanning with 5,000+ rules and static analysis',
      installCommand: 'uvx semgrep-mcp',
      transport: 'stdio',
      environment: {
        SEMGREP_APP_TOKEN: '<Optional: For Semgrep AppSec Platform integration>'
      },
      useCase: 'Security scanning, code quality enforcement, vulnerability detection',
      category: 'security'
    },
    sequentialThinking: {
      enabled: true,
      package: '@modelcontextprotocol/server-sequential-thinking',
      description: 'Complex multi-step reasoning'
    },
    memory: {
      enabled: true,
      package: '@modelcontextprotocol/server-memory',
      description: 'Enhanced context preservation'
    },
    filesystem: {
      enabled: true,
      package: '@modelcontextprotocol/server-filesystem',
      description: 'File operations with validation'
    },

    // Essential Servers
    github: {
      enabled: true,
      package: '@modelcontextprotocol/server-github',
      description: 'GitHub integration'
    },
    fetch: {
      enabled: true,
      package: '@modelcontextprotocol/server-fetch',
      description: 'Web content fetching'
    },
    braveSearch: {
      enabled: true,
      package: '@modelcontextprotocol/server-brave-search',
      description: 'Web search capabilities'
    },
    postgres: {
      enabled: true,
      package: '@modelcontextprotocol/server-postgres',
      description: 'PostgreSQL relational database integration'
    },
    mongodb: {
      enabled: true,
      package: 'mongodb-mcp-server',
      repository: 'https://github.com/mongodb-js/mongodb-mcp-server',
      description: 'MongoDB NoSQL database integration with document storage, aggregation pipelines, and flexible schema support',
      capabilities: {
        document_operations: true,
        aggregation_pipelines: true,
        indexing: true,
        transactions: true,
        change_streams: true,
        full_text_search: true,
        geospatial_queries: true,
        time_series: true
      }
    },
    supabase: {
      enabled: true,
      package: '@supabase/mcp-server',
      repository: 'https://supabase.com/docs/guides/getting-started/mcp#claude-code',
      description: 'Supabase backend-as-a-service integration with PostgreSQL, Auth, Storage, Edge Functions, and Real-time subscriptions',
      capabilities: {
        database_management: true,
        authentication: true,
        storage: true,
        edge_functions: true,
        real_time: true,
        vector_embeddings: true,
        row_level_security: true,
        api_generation: true
      }
    }
  },

  // Command Configuration
  commands: {
    namespace: 'bumba',
    prefix: '/bumba:',
    
    // Product Strategy Commands
    productStrategy: {
      'prd': {
        description: 'Create comprehensive PRD',
        template: 'commands/prd.md',
        category: 'strategy'
      },
      'requirements': {
        description: 'Discover and analyze requirements',
        template: 'commands/requirements.md',
        category: 'strategy'
      },
      'roadmap': {
        description: 'Strategic planning and roadmapping',
        template: 'commands/roadmap.md',
        category: 'strategy'
      }
    },

    // Development Commands
    development: {
      'implement': {
        description: 'Smart development implementation',
        template: 'commands/implement.md',
        category: 'development'
      },
      'implement-agents': {
        description: 'Multi-agent collaborative development',
        template: 'commands/implement-agents.md',
        category: 'development'
      },
      'implement-strategy': {
        description: 'Product-Strategist optimized implementation',
        template: 'commands/implement-strategy.md',
        category: 'development'
      },
      'implement-design': {
        description: 'Design-Engineer optimized implementation',
        template: 'commands/implement-design.md',
        category: 'development'
      },
      'implement-technical': {
        description: 'Backend-Engineer optimized implementation',
        template: 'commands/implement-technical.md',
        category: 'development'
      },
      'analyze': {
        description: 'Multi-dimensional code analysis',
        template: 'commands/analyze.md',
        category: 'development'
      },
      // Domain-specific analysis commands
      'analyze-business': {
        description: 'Product-Strategist business impact analysis',
        template: 'commands/analyze-business.md',
        category: 'strategy',
        primary_agent: 'Product-Strategist'
      },
      'analyze-ux': {
        description: 'Design-Engineer UX/accessibility analysis',
        template: 'commands/analyze-ux.md',
        category: 'design',
        primary_agent: 'Design-Engineer'
      },
      'analyze-technical': {
        description: 'Backend-Engineer technical architecture analysis',
        template: 'commands/analyze-technical.md',
        category: 'development',
        primary_agent: 'Backend-Engineer'
      },
      'api': {
        description: 'API development automation',
        template: 'commands/api.md',
        category: 'development'
      },
      'secure': {
        description: 'Security validation and enforcement',
        template: 'commands/secure.md',
        category: 'development'
      },
      'scan': {
        description: 'Advanced code security scanning with Semgrep',
        template: 'commands/scan.md',
        category: 'development'
      },
      'docs': {
        description: 'Intelligent documentation lookup with Ref',
        template: 'commands/docs.md',
        category: 'development'
      },
      // Domain-specific documentation commands
      'docs-business': {
        description: 'Product-Strategist business documentation lookup',
        template: 'commands/docs-business.md',
        category: 'strategy',
        primary_agent: 'Product-Strategist'
      },
      'docs-design': {
        description: 'Design-Engineer design system documentation',
        template: 'commands/docs-design.md',
        category: 'design',
        primary_agent: 'Design-Engineer'
      },
      'docs-technical': {
        description: 'Backend-Engineer technical documentation',
        template: 'commands/docs-technical.md',
        category: 'development',
        primary_agent: 'Backend-Engineer'
      },
      'snippets': {
        description: 'Intelligent code snippet management with Pieces',
        template: 'commands/snippets.md',
        category: 'development'
      },
      'research': {
        description: 'AI-optimized semantic research with Exa',
        template: 'commands/research.md',
        category: 'development'
      },
      // Domain-specific research commands
      'research-market': {
        description: 'Product-Strategist market research and competitive analysis',
        template: 'commands/research-market.md',
        category: 'strategy',
        primary_agent: 'Product-Strategist'
      },
      'research-design': {
        description: 'Design-Engineer design patterns and UX research',
        template: 'commands/research-design.md',
        category: 'design',
        primary_agent: 'Design-Engineer'
      },
      'research-technical': {
        description: 'Backend-Engineer technical architecture research',
        template: 'commands/research-technical.md',
        category: 'development',
        primary_agent: 'Backend-Engineer'
      },
      // Domain-specific improvement commands
      'improve-strategy': {
        description: 'Product-Strategist business strategy optimization',
        template: 'commands/improve-strategy.md',
        category: 'strategy',
        primary_agent: 'Product-Strategist'
      },
      'improve-design': {
        description: 'Design-Engineer UX/UI optimization',
        template: 'commands/improve-design.md',
        category: 'design',
        primary_agent: 'Design-Engineer'
      },
      'improve-performance': {
        description: 'Backend-Engineer performance and scalability optimization',
        template: 'commands/improve-performance.md',
        category: 'development',
        primary_agent: 'Backend-Engineer'
      },
      'conscious': {
        description: 'Consciousness-driven development',
        template: 'commands/conscious.md',
        category: 'development'
      },
      // Lean QA Commands (Intelligent Routing)
      'test': {
        description: 'Intelligent testing with automatic agent routing',
        template: 'commands/test.md',
        category: 'quality',
        routing: 'intelligent', // Auto-routes based on scope
        agents: {
          'ui': 'Design-Engineer',
          'ux': 'Design-Engineer', 
          'design': 'Design-Engineer',
          'api': 'Backend-Engineer',
          'security': 'Backend-Engineer',
          'performance': 'Backend-Engineer',
          'requirements': 'Product-Strategist',
          'business': 'Product-Strategist',
          'uat': 'Product-Strategist'
        }
      },
      'validate': {
        description: 'Comprehensive validation with scope-based routing',
        template: 'commands/validate.md', 
        category: 'quality',
        routing: 'intelligent', // Auto-routes based on target
        agents: {
          'design': 'Design-Engineer',
          'accessibility': 'Design-Engineer',
          'ux': 'Design-Engineer',
          'security': 'Backend-Engineer', 
          'performance': 'Backend-Engineer',
          'technical': 'Backend-Engineer',
          'business': 'Product-Strategist',
          'requirements': 'Product-Strategist',
          'compliance': 'Product-Strategist'
        }
      },
      // Enhanced Communication Commands
      'urgent': {
        description: 'Emergency priority routing with conflict detection',
        template: 'commands/urgent.md',
        category: 'communication',
        routing: 'priority_override', // Bypasses normal queues
        priority: 'urgent'
      },
      'handoff': {
        description: 'Enhanced agent handoff with rich context',
        template: 'commands/handoff.md', 
        category: 'communication',
        context_preservation: true
      }
    },

    // Design Commands
    design: {
      'figma': {
        description: 'Figma Dev Mode integration',
        template: 'commands/figma.md',
        category: 'design'
      },
      'design': {
        description: 'Design workflow automation',
        template: 'commands/design.md',
        category: 'design'
      },
      'visual': {
        description: 'Visual asset optimization',
        template: 'commands/visual.md',
        category: 'design'
      },
      'ui': {
        description: 'UI component generation',
        template: 'commands/ui.md',
        category: 'design'
      }
    },

    // Git & Collaboration Commands
    git: {
      'commit': {
        description: 'Lightweight git commit for team checkpoints',
        template: 'commands/commit.md',
        category: 'collaboration'
      },
      'checkpoint': {
        description: 'Comprehensive analysis commit with team context',
        template: 'commands/checkpoint.md',
        category: 'collaboration'
      },
      'publish': {
        description: 'Professional GitHub publishing for adopters',
        template: 'commands/publish.md',
        category: 'deployment'
      },
      'team': {
        description: 'Multi-agent team collaboration status and management',
        template: 'commands/team.md',
        category: 'collaboration'
      }
    },

    // System Commands
    system: {
      'menu': {
        description: 'Interactive command discovery',
        template: 'commands/menu.md',
        category: 'system'
      },
      'help': {
        description: 'Contextual assistance',
        template: 'commands/help.md',
        category: 'system'
      },
      'settings': {
        description: 'Framework configuration',
        template: 'commands/settings.md',
        category: 'system'
      },
      'status': {
        description: 'System health check',
        template: 'commands/status.md',
        category: 'system'
      }
    },

    // Workflow & Automation Commands
    workflow: {
      'chain': {
        description: 'Start intelligent command chains for multi-step workflows',
        template: 'commands/chain.md',
        category: 'automation'
      },
      'workflow': {
        description: 'Generate optimized workflows for complex tasks',
        template: 'commands/workflow.md',
        category: 'automation'
      },
      'collaborate': {
        description: 'Flat hierarchy multi-agent collaboration with constructive chaos',
        template: 'commands/collaborate.md',
        category: 'collaboration'
      }
    }
  },

  // Quality Gates Configuration
  qualityGates: {
    enabled: true,
    preExecution: {
      securityScan: true,
      inputValidation: true,
      cognitiveVerification: true
    },
    postExecution: {
      codeQuality: true,
      assetOptimization: true,
      documentationCheck: true
    }
  },

  // Cognitive Safeguards
  cognitiveSafeguards: {
    verificationFirst: true,
    memoryExternalization: true,
    consistencyValidation: true,
    errorRecovery: true
  },

  // Security Configuration
  security: {
    aiSpecificProtection: true,
    traditionalSecurity: true,
    preExecutionScanning: true,
    postExecutionValidation: true
  },

  // Logging Configuration
  logging: {
    level: 'info', // debug, info, warn, error
    file: '~/.claude/bumba.log',
    rotation: true,
    maxSize: '10MB',
    maxFiles: 5
  },

  // Performance Configuration
  performance: {
    cacheEnabled: true,
    cacheDirectory: '~/.claude/cache',
    parallelExecution: true,
    maxConcurrency: 4
  },

  // Development Configuration
  development: {
    hotReload: false,
    debugMode: false,
    profilePerformance: false,
    verboseLogging: false
  }
};
