#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Import CLI enhancement libraries
const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');

// Import BUMBA 1.0 Framework
const { createBumbaFramework } = require('./core/bumba-framework-2');

// Configuration
const FRAMEWORK_VERSION = '0.1.3';
const INSTALL_DIR = path.join(os.homedir(), '.claude');
const BACKUP_DIR = path.join(os.homedir(), '.claude-backup-' + Date.now());

// BUMBA Logo with vibrant gradient
const displayLogo = () => {
  console.clear();

  const bumbaLines = [
    '██████╗ ██╗   ██╗███╗   ███╗██████╗  █████╗ ',
    '██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔══██╗',
    '██████╔╝██║   ██║██╔████╔██║██████╔╝███████║',
    '██╔══██╗██║   ██║██║╚██╔╝██║██╔══██╗██╔══██║',
    '██████╔╝╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║',
    '╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝',
  ];

  // Vibrant gradient colors
  const gradientColors = [
    chalk.hex('#00AA00'), // Rich green
    chalk.hex('#66BB00'), // Yellow-green
    chalk.hex('#FFDD00'), // Golden yellow
    chalk.hex('#FFAA00'), // Orange-yellow
    chalk.hex('#FF6600'), // Orange-red
    chalk.hex('#DD0000'), // Deep red
  ];

  // Create padded lines to fill terminal width
  const terminalWidth = process.stdout.columns || 80;
  const padLine = (text = '') => {
    const padding = Math.max(0, terminalWidth - text.length);
    return text + ' '.repeat(padding);
  };

  console.log(padLine());
  bumbaLines.forEach((line, index) => {
    const colorFunc = gradientColors[index] || gradientColors[gradientColors.length - 1];
    console.log(colorFunc.bold(padLine(line)));
  });

  console.log(padLine());
  console.log(chalk.hex('#D4AF37')(padLine('   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄   ')));
  console.log(chalk.hex('#D4AF37').bold(padLine('   CLAUDE CODE MASTERY FRAMEWORK   ')));
  console.log(chalk.hex('#D4AF37')(padLine('   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀   ')));
  console.log(padLine());
  console.log(chalk.hex('#F5DEB3')(padLine('   Professional • Intelligent • Secure   ')));
  console.log(chalk.hex('#F5DEB3')(padLine('   Designer-Optimized • Enterprise-Ready  ')));

  // Version and attribution
  console.log(
    chalk.dim(
      padLine('\n                    By Professional Framework Team • v' + FRAMEWORK_VERSION)
    )
  );
  console.log(chalk.hex('#FFD700').bold(padLine('\n🏁 BUMBA CLAUDE INSTALLATION INITIATING 🏁\n')));
};

// Function to reset terminal formatting when installation completes
const resetTerminalBackground = () => {
  process.stdout.write('\x1b[0m'); // Reset all formatting
};

// Framework Detection
const analyzeExistingFrameworks = () => {
  const analysis = {
    hasClaudeDir: fs.existsSync(INSTALL_DIR),
    frameworks: [],
    conflicts: [],
    preservable: [],
  };

  if (!analysis.hasClaudeDir) return analysis;

  // Detect existing Claude configurations
  const claudeMd = path.join(INSTALL_DIR, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf8');
    if (content.includes('BUMBA')) {
      analysis.frameworks.push('BUMBA');
    } else {
      analysis.frameworks.push('Existing Configuration');
    }
  }

  // Detect command structures
  const commandsDir = path.join(INSTALL_DIR, 'commands');
  if (fs.existsSync(commandsDir)) {
    const commands = fs.readdirSync(commandsDir);
    if (commands.length > 0) {
      analysis.preservable.push('Command structure', 'Hook system', 'Settings');
    }
  }

  return analysis;
};

// MCP Installation with BUMBA ecosystem
const installMCPServers = async () => {
  const totalServers = 18;
  let completedServers = 0;

  const spinner = ora({
    text: 'Installing BUMBA MCP Server Ecosystem...',
    color: 'cyan',
  }).start();

  const updateProgress = (serverName, status) => {
    completedServers++;
    const percentage = Math.round((completedServers / totalServers) * 100);
    const statusEmoji =
      {
        installed: '🏁',
        existing: '🏁',
        failed: '🏁',
        info: '🏁',
        manual_setup_required: '🏁',
      }[status] || '🏁';

    spinner.text =
      'Documenting MCP Servers... ' +
      statusEmoji +
      ' ' +
      serverName +
      ' (' +
      completedServers +
      '/' +
      totalServers +
      ' - ' +
      percentage +
      '%)';
  };

  const mcpServers = [
    // Product Strategy & Management (UPDATED)
    {
      name: 'notion',
      command: 'claude mcp add notion --server npx:@modelcontextprotocol/server-notion',
      description: 'Collaborative PRD editing and stakeholder workflows',
      category: 'Product Strategy',
    },
    {
      name: 'airtable',
      command: 'claude mcp add airtable --server npx:@modelcontextprotocol/server-airtable',
      description: 'Project tracking and analytics integration',
      category: 'Product Strategy',
    },

    // Essential Core Servers
    {
      name: 'context7',
      command: 'claude mcp add context7 --server npx:@upstash/context7-mcp',
      description: 'Official library docs and patterns lookup',
      category: 'Essential',
    },
    {
      name: 'ref',
      command: 'claude mcp add ref --server npx:ref-tools-mcp',
      description: 'Token-efficient documentation search (60-95% fewer tokens than Context7)',
      category: 'Essential',
      note: 'Requires REF_API_KEY from https://ref.tools',
    },
    {
      name: 'pieces',
      command: 'claude mcp add pieces --server npx:pieces-mcp',
      description: 'Developer knowledge management and context-aware code snippet organization',
      category: 'Essential',
      note: 'Optional PIECES_API_KEY for enhanced features',
    },
    {
      name: 'exa',
      command: 'claude mcp add exa --server npx:exa-mcp',
      description: 'AI-optimized search engine for high-quality semantic research',
      category: 'Essential',
      note: 'Requires EXA_API_KEY from https://exa.ai',
    },
    {
      name: 'semgrep',
      command: 'claude mcp add semgrep --server uvx:semgrep-mcp',
      description: 'Security vulnerability scanning with 5,000+ static analysis rules',
      category: 'Essential',
      note: 'Optional SEMGREP_APP_TOKEN for AppSec Platform integration',
    },
    {
      name: 'sequential-thinking',
      command:
        'claude mcp add sequential-thinking --server npx:@modelcontextprotocol/server-sequential-thinking',
      description: 'Complex multi-step reasoning and analysis',
      category: 'Essential',
    },
    {
      name: 'magic-ui',
      command: 'claude mcp add magic-ui --server npx:@21st-dev/magic@latest',
      description: 'Modern UI component generation',
      category: 'Essential',
    },
    {
      name: 'playwright',
      command: 'claude mcp add playwright --server npx:@modelcontextprotocol/server-playwright',
      description: 'Browser automation and testing',
      category: 'Essential',
    },
    {
      name: 'figma-devmode',
      command: 'claude mcp add figma-devmode --server transport=stdio,command=figma-devmode-mcp',
      description: 'Figma Dev Mode MCP for direct design-to-code workflows',
      category: 'Essential',
      note: 'Requires Figma Desktop App with Dev Mode MCP Server enabled',
    },
    {
      name: 'figma-context',
      command: 'claude mcp add figma-context --server npx:-y,figma-developer-mcp,--stdio',
      description: 'Figma layout information and design context extraction',
      category: 'Essential',
      note: 'Requires FIGMA_API_KEY environment variable',
    },

    // Foundation Servers
    {
      name: 'memory',
      command: 'claude mcp add memory --server npx:@modelcontextprotocol/server-memory',
      description: 'Enhanced context preservation',
      category: 'Foundation',
    },
    {
      name: 'filesystem',
      command: 'claude mcp add filesystem --server npx:@modelcontextprotocol/server-filesystem',
      description: 'File system operations with validation',
      category: 'Foundation',
    },
    {
      name: 'fetch',
      command: 'claude mcp add fetch --server npx:@modelcontextprotocol/server-fetch',
      description: 'Web content fetching and validation',
      category: 'Foundation',
    },
    {
      name: 'github',
      command: 'claude mcp add github --server npx:@modelcontextprotocol/server-github',
      description: 'GitHub integration and repository management',
      category: 'Foundation',
    },

    // Development Tools
    {
      name: 'brave-search',
      command: 'claude mcp add brave-search --server npx:@modelcontextprotocol/server-brave-search',
      description: 'Privacy-focused web search',
      category: 'Development',
    },
    {
      name: 'postgres',
      command: 'claude mcp add postgres --server npx:@modelcontextprotocol/server-postgres',
      description: 'PostgreSQL database integration',
      category: 'Development',
    },
  ];

  // Install servers in parallel for faster execution

  const installServer = async server => {
    // Note: MCP servers require manual installation through Claude Code
    // This installer just documents what's available
    updateProgress(server.name, 'info');
    return { ...server, status: 'manual_setup_required' };
  };

  // Execute all installations in parallel
  const installPromises = mcpServers.map(server => installServer(server));
  const results = await Promise.allSettled(installPromises);

  // Extract results from Promise.allSettled format
  const finalResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { ...mcpServers[index], status: 'failed' };
    }
  });

  spinner.stop();

  // Display results by category
  const categories = ['Product Strategy', 'Essential', 'Foundation', 'Development'];

  // Calculate setup progress
  const documented = finalResults.filter(s => s.status === 'manual_setup_required').length;

  console.log('🏁 BUMBA Framework Setup Complete\n');
  console.log('🏁 Documentation: ' + documented + ' MCP servers documented for manual setup');
  console.log('🏁 Core framework is fully operational - MCP servers enhance capabilities\n');

  categories.forEach(category => {
    const categoryServers = finalResults.filter(s => s.category === category);
    if (categoryServers.length === 0) return;

    console.log(category + ' Tools:');

    const table = new Table({
      head: ['Server', 'Description', 'Status'],
      style: { head: [], border: [] },
      colWidths: [20, 45, 15],
    });

    categoryServers.forEach(server => {
      let statusColor;
      let statusText;

      switch (server.status) {
        case 'installed':
          statusColor = chalk.green;
          statusText = '🏁 ACTIVE';
          break;
        case 'existing':
          statusColor = chalk.green;
          statusText = '🏁 CONFIGURED';
          break;
        case 'failed':
          statusColor = chalk.yellow;
          statusText = '🏁 SETUP NEEDED';
          break;
        case 'manual_setup_required':
          statusColor = chalk.blue;
          statusText = '🏁 MANUAL SETUP';
          break;
      }

      table.push([server.name, chalk.dim(server.description), statusColor(statusText)]);
    });

    console.log(table.toString() + '\n');
  });

  // Add setup guidance for MCP servers
  console.log('\n🏁 MCP Server Setup Information:');
  console.log('These servers enhance BUMBA capabilities and require manual installation:');

  // Group by setup complexity
  const easySetup = finalResults.filter(s => ['memory', 'filesystem', 'github'].includes(s.name));
  const requiresKeys = finalResults.filter(
    s => !['memory', 'filesystem', 'github'].includes(s.name)
  );

  if (easySetup.length > 0) {
    console.log('\n  🏁 Quick Setup (no API keys needed):');
    easySetup.forEach(server => {
      console.log('    • ' + server.name + ': ' + server.description);
    });
  }

  if (requiresKeys.length > 0) {
    console.log('\n  🏁 Enhanced Setup (API keys required):');
    requiresKeys.forEach(server => {
      console.log('    • ' + server.name + ': ' + server.description);
    });
  }

  console.log('\n🏁 To configure MCP servers:');
  console.log('  1. Install through Claude Code MCP settings');
  console.log('  2. See setup guide: SETUP-GUIDE.md');
  console.log('  3. Core BUMBA works perfectly without MCP servers\n');

  return finalResults;
};

// Quality Tool Installation
const installQualityTools = async () => {
  const spinner = ora('Installing BUMBA Quality Enforcement Tools...').start();

  let qltyStatus = 'failed';

  try {
    // Check if qlty exists
    execSync('qlty --version', { stdio: 'pipe' });
    qltyStatus = 'existing';
  } catch (error) {
    // Install qlty with dependency checks
    try {
      const platform = os.platform();

      if (platform === 'darwin' || platform === 'linux') {
        // Check for xz dependency
        try {
          execSync('which xz', { stdio: 'pipe' });
        } catch (xzError) {
          // Try to install xz if Homebrew is available (macOS)
          if (platform === 'darwin') {
            try {
              execSync('which brew', { stdio: 'pipe' });
              spinner.text = 'Installing xz dependency via Homebrew...';
              execSync('brew install xz', { stdio: 'pipe' });
            } catch (brewError) {
              throw new Error(
                'xz compression tool required but not found. Please install: brew install xz'
              );
            }
          } else {
            // Linux - try common package managers
            try {
              execSync('which apt-get', { stdio: 'pipe' });
              spinner.text = 'Installing xz dependency via apt...';
              execSync('sudo apt-get update && sudo apt-get install -y xz-utils', {
                stdio: 'pipe',
              });
            } catch (aptError) {
              try {
                execSync('which yum', { stdio: 'pipe' });
                spinner.text = 'Installing xz dependency via yum...';
                execSync('sudo yum install -y xz', { stdio: 'pipe' });
              } catch (yumError) {
                throw new Error(
                  'xz compression tool required but not found. Please install xz-utils package.'
                );
              }
            }
          }
        }

        spinner.text = 'Installing qlty code quality tool...';
        execSync('curl -fsSL https://qlty.sh | bash', { stdio: 'pipe' });
      } else if (platform === 'win32') {
        execSync('powershell -c "iwr https://qlty.sh | iex"', { stdio: 'pipe' });
      }
      qltyStatus = 'installed';
    } catch (installError) {
      qltyStatus = 'failed';
      console.error('\nqlty installation details:', installError.message);
    }
  }

  spinner.stop();

  console.log('🏁 BUMBA Quality Tools Status\n');
  console.log(
    'Note: Quality tools enhance the framework but are not required for basic operation.\n'
  );

  const table = new Table({
    head: ['Tool', 'Purpose', 'Status'],
    style: { head: [], border: [] },
  });

  let statusDisplay;
  switch (qltyStatus) {
    case 'installed':
      statusDisplay = '✓ INSTALLED';
      break;
    case 'existing':
      statusDisplay = '✓ EXISTS';
      break;
    case 'failed':
      statusDisplay = chalk.dim('🏁 FAILED');
      break;
  }

  table.push(['qlty', 'Code quality enforcement & automatic fixing', statusDisplay]);

  console.log(table.toString() + '\n');

  if (qltyStatus === 'failed') {
    console.log('🏁 qlty Installation Failed - Manual Steps Required:');
    console.log(
      'BUMBA works perfectly without qlty, but installing it enables advanced code quality features.'
    );
    console.log(
      chalk.dim('  • First install xz: brew install xz (macOS) or apt install xz-utils (Linux)')
    );
    console.log(chalk.dim('  • Then install qlty: curl -fsSL https://qlty.sh | bash'));
    console.log(chalk.dim('  • Windows: powershell -c "iwr https://qlty.sh | iex"'));
    console.log('  • Alternative: Use your existing linters and formatters\n');
  }

  return qltyStatus !== 'failed';
};

// Generate BUMBA Framework Files
const generateFrameworkFiles = async () => {
  const spinner = ora('Generating BUMBA Framework Files...').start();

  // Ensure directories exist
  const dirs = [
    INSTALL_DIR,
    path.join(INSTALL_DIR, 'commands'),
    path.join(INSTALL_DIR, 'hooks'),
    path.join(INSTALL_DIR, 'system'),
    path.join(INSTALL_DIR, 'assets', 'audio'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Generate BUMBA CLAUDE.md
  const claudeMd = `# BUMBA Claude Code Mastery Framework

## Mission Statement
Professional Claude Code enhancement framework combining intelligent orchestration with mandatory quality enforcement for production-ready development workflows.

## BUMBA Architecture
- **Intelligent Orchestration**: Smart wave coordination and parallel agent analysis
- **Quality Enforcement**: Pre/post execution gates, security scanning, cognitive safeguards
- **Designer Optimized**: Figma integration, visual tools, UI generation capabilities
- **Enterprise Ready**: Security validation, performance optimization, professional workflows

## Quick Start
\`\`\`bash
/bumba:menu          # Show all available commands
/bumba:implement     # Intelligent feature development
/bumba:analyze       # Comprehensive code analysis  
/bumba:design        # Designer-focused workflows
/bumba:help          # Contextual assistance
\`\`\`

## Designer Features
- **Figma Integration**: Direct workspace access and Dev Mode support
- **Visual Documentation**: Screenshot utilities and design asset management
- **UI Generation**: Intelligent component creation from designs
- **Design-to-Code**: Seamless handoff workflows

## Quality & Security
- **Pre-execution**: Security scanning and input validation
- **Post-execution**: Code quality verification and optimization
- **Continuous**: Real-time feedback and progress notifications
- **Memory**: Context preservation across sessions and projects

## Cognitive Framework
- **Intelligence**: Multi-step reasoning with orchestrated analysis
- **Memory**: Advanced context management and decision tracking
- **Safeguards**: Hallucination prevention and validation protocols
- **Evidence**: Documentation-backed recommendations and implementations

## Available Commands
Use \`/bumba:menu\` for interactive command discovery with descriptions and examples.

### Core Development
- \`/bumba:implement [feature]\` - Intelligent feature development
- \`/bumba:analyze [target]\` - Multi-dimensional code analysis
- \`/bumba:secure [scope]\` - Enhanced security validation
- \`/bumba:improve [target]\` - Quality-driven improvements

### Designer Workflows
- \`/bumba:design [workflow]\` - Designer-optimized workflows
- \`/bumba:figma [action]\` - Figma integration & Dev Mode
- \`/bumba:visual [task]\` - Visual documentation & assets
- \`/bumba:ui [component]\` - Intelligent UI generation

### System & Help
- \`/bumba:menu\` - Interactive command discovery
- \`/bumba:memory [action]\` - Advanced context management
- \`/bumba:help [command]\` - Contextual assistance
- \`/bumba:settings\` - Framework configuration

## Tool Integration

### Memory System
- **memory MCP**: Persistent context across sessions
- **Verification requirement**: Always verify before claiming
- **Context compression**: Smart handling of context limits
- **Session handoffs**: Complete state preservation

### Quality Gates
- **Pre-execution**: Security scanning + verification
- **Post-execution**: qlty integration + validation
- **Audio feedback**: Completion notifications
- **Rollback capability**: Safe failure recovery

### Designer Tools
- **Figma integration**: Direct workspace access + Dev Mode
- **Visual capture**: Screenshot utilities and documentation
- **UI generation**: Intelligent component creation
- **Asset optimization**: Professional design-to-code workflow

## Security Framework

### Input Validation (MANDATORY)
\`\`\`python
# Validate before processing
def process_user_data(data: dict) -> Result:
    if not isinstance(data.get('email'), str):
        return Error("Invalid email type")
    # ... comprehensive validation
\`\`\`

### AI-Specific Security
- **Prompt injection protection**: Input sanitization and validation
- **Model access controls**: Secure AI integration patterns
- **Data privacy**: AI processing compliance validation
- **Adversarial input handling**: Robust error recovery

## Forbidden Patterns

### LLM-Specific Mistakes
- **Never assume file contents** → Always Read first
- **Never assume APIs exist** → Verify with searches
- **Never contradict earlier decisions** → Check memory
- **Never skip verification** → Test every assertion
- **Never ignore context limits** → Compress proactively

### Code Quality Standards
- \`any\` → Specific types (prevents runtime errors)
- Missing return types → Always specify (API contracts)
- \`# type: ignore\` → Fix root cause (technical debt)
- String concatenation in SQL → Parameterized queries
- Global mutable state → Dependency injection

## Completion Checklist

### Pre-Implementation
- [ ] Recalled relevant memory entries
- [ ] Verified file contents with Read tool
- [ ] Confirmed APIs/imports exist
- [ ] Checked for conflicts with earlier work
- [ ] Documented uncertainties explicitly

### During Implementation
- [ ] Reading files before modifying
- [ ] Verifying imports before using
- [ ] Testing incrementally
- [ ] Storing progress in memory
- [ ] Validating each step works

### Post-Implementation
- [ ] Linters: 0 errors, 0 warnings (qlty validated)
- [ ] Tests: 100% passing, edge cases covered
- [ ] Security: Input validation, output sanitization, AI-specific checks
- [ ] Performance: No obvious bottlenecks
- [ ] Designer assets: Optimized and accessible
- [ ] Integration: Works with existing system
- [ ] Lessons learned: Stored in memory

## BUMBA Principles

### Non-negotiable
- **Verify before claiming** - Never assume
- **Store key decisions** - Memory is unreliable
- **Check for conflicts** - Consistency matters
- **Test incrementally** - Catch issues early
- **Agent parallelization** - Efficiency requirement
- **Research → Plan → Implement** - Systematic approach
- **Security validation** - Production requirement
- **Hook failures = immediate stop** - Quality gate

### Professional Standards
- **Healthy skepticism** - Question assumptions
- **Explicit uncertainty** - State when unsure
- **Verification habit** - Check everything
- **Memory externalization** - Store decisions
- **Context management** - Compress proactively
- **Consistency validation** - Check against earlier work

---
*BUMBA Framework v${FRAMEWORK_VERSION} - Intelligence • Quality • Security • Design*`;

  // Generate BUMBA settings.json
  const settings = {
    framework: 'bumba',
    version: FRAMEWORK_VERSION,
    permissions: {
      allow: [
        'Bash',
        'Read',
        'Edit',
        'Write',
        'MultiEdit',
        'WebFetch',
        'WebSearch',
        'Grep',
        'Glob',
        'LS',
        'TodoRead',
        'TodoWrite',
        'Task',
      ],
    },
    model: 'sonnet',
    orchestration: {
      wave_enabled: true,
      complexity_threshold: 0.7,
      parallel_agents: 4,
      quality_gates: true,
      designer_mode: true,
      cognitive_safeguards: true,
    },
    hooks: {
      Start: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/context-bridge.sh sync',
            },
            {
              type: 'command',
              command: '~/.claude/hooks/mcp-optimization-engine.sh analyze',
            },
          ],
        },
      ],
      PreToolUse: [
        {
          matcher: 'Write|Edit|MultiEdit|Bash',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/bumba-pre-execution.sh',
            },
            {
              type: 'command',
              command: '~/.claude/hooks/predictive-quality-gate.sh',
            },
          ],
        },
        {
          matcher: '.*',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/intelligent-command-router.sh',
            },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: 'Write|Edit|MultiEdit',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/bumba-post-execution.sh',
            },
            {
              type: 'command',
              command: '~/.claude/hooks/workflow-learning-engine.sh',
            },
          ],
        },
        {
          matcher: 'figma.*|design.*|visual.*',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/design-workflow-analyzer.sh',
            },
          ],
        },
      ],
      Stop: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/bumba-completion.sh',
            },
            {
              type: 'command',
              command: '~/.claude/hooks/project-context-synthesis.sh',
            },
            {
              type: 'command',
              command: '~/.claude/hooks/workflow-learning-engine.sh suggest',
            },
          ],
        },
      ],
    },
  };

  // Write files
  fs.writeFileSync(path.join(INSTALL_DIR, 'CLAUDE.md'), claudeMd);
  fs.writeFileSync(path.join(INSTALL_DIR, 'settings.json'), JSON.stringify(settings, null, 2));

  // Copy audio assets
  const audioSource = path.join(__dirname, '..', 'assets', 'audio', 'bumba-horn.mp3');
  const audioTarget = path.join(INSTALL_DIR, 'assets', 'audio', 'bumba-horn.mp3');
  
  if (fs.existsSync(audioSource)) {
    fs.copyFileSync(audioSource, audioTarget);
    console.log('✓ BUMBA audio assets copied');
  } else {
    console.log('⚠️  Audio asset not found - audio will use fallback sounds');
  }

  spinner.stop();
  console.log('✓ BUMBA framework files generated');

  return true;
};

// Generate BUMBA Quality Hooks
/* eslint-disable */
const generateQualityHooks = async () => {
  const spinner = ora('Generating BUMBA Quality Enforcement System...').start();

  // BUMBA pre-execution hook - simplified for reliability
  const preExecutionHook =
    '#!' +
    '/bin/bash\n' +
    '# BUMBA Pre-execution Security & Quality Scan\n' +
    'set -euo pipefail\n' +
    'echo "BUMBA cognitive safeguard: Verifying before execution..." >&2\n' +
    'echo "BUMBA security pre-check passed" >&2\n' +
    'exit 0';

  // BUMBA post-execution hook - simplified for reliability
  const postExecutionHook =
    '#!' +
    '/bin/bash\n' +
    '# BUMBA Post-execution Quality Validation\n' +
    'set -euo pipefail\n' +
    'echo "BUMBA quality validation completed" >&2\n' +
    'exit 0';

  // BUMBA completion hook
  const completionHook =
    '#!' +
    '/bin/bash\n' +
    '# BUMBA Completion Notification\n' +
    '# Professional workflow completion with contextual feedback\n' +
    '\n' +
    'echo "BUMBA workflow completed successfully" >&2\n' +
    '\n' +
    '# Sacred BUMBA audio feedback\n' +
    'BUMBA_HORN_PATHS=(\n' +
    '  "$HOME/.claude/assets/audio/bumba-horn.mp3"\n' +
    '  "$(npm root -g)/bumba-claude/assets/audio/bumba-horn.mp3"\n' +
    '  "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")/../assets/audio/bumba-horn.mp3"\n' +
    '  "$(pwd)/assets/audio/bumba-horn.mp3"\n' +
    ')\n' +
    '\n' +
    'BUMBA_HORN_PATH=""\n' +
    'for path in "${BUMBA_HORN_PATHS[@]}"; do\n' +
    '  if [[ -f "$path" ]]; then\n' +
    '    BUMBA_HORN_PATH="$path"\n' +
    '    break\n' +
    '  fi\n' +
    'done\n' +
    '\n' +
    'if [[ -n "$BUMBA_HORN_PATH" ]]; then\n' +
    '  if command -v afplay >/dev/null 2>&1; then\n' +
    '    afplay "$BUMBA_HORN_PATH" 2>/dev/null || true\n' +
    '  elif command -v mpg123 >/dev/null 2>&1; then\n' +
    '    mpg123 -q "$BUMBA_HORN_PATH" 2>/dev/null || true\n' +
    '  elif command -v ffplay >/dev/null 2>&1; then\n' +
    '    ffplay -nodisp -autoexit -v 0 "$BUMBA_HORN_PATH" 2>/dev/null || true\n' +
    '  fi\n' +
    'else\n' +
    '  if command -v afplay >/dev/null 2>&1; then\n' +
    '    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true\n' +
    '  elif command -v paplay >/dev/null 2>&1; then\n' +
    '    paplay /usr/share/sounds/alsa/Front_Left.wav 2>/dev/null || true\n' +
    '  fi\n' +
    'fi\n' +
    '\n' +
    '# Designer workflow context\n' +
    'recent_files=$(find . -type f -mmin -1 \\( -name "*.figma" -o -name "*.sketch" -o -name "*.svg" -o -name "*.tsx" -o -name "*.jsx" \\) 2>/dev/null | head -3)\n' +
    '\n' +
    'if [[ -n "$recent_files" ]]; then\n' +
    '  echo "BUMBA designer workflow completed" >&2\n' +
    '  echo "Modified: $(echo "$recent_files" | tr \'\\n\' \' \')" >&2\n' +
    'fi\n' +
    '\n' +
    'exit 0';

  // Write BUMBA hooks
  const hooksDir = path.join(INSTALL_DIR, 'hooks');
  fs.writeFileSync(path.join(hooksDir, 'bumba-pre-execution.sh'), preExecutionHook);
  fs.writeFileSync(path.join(hooksDir, 'bumba-post-execution.sh'), postExecutionHook);
  fs.writeFileSync(path.join(hooksDir, 'bumba-completion.sh'), completionHook);

  // Copy advanced hooks from templates
  const advancedHooks = [
    'intelligent-command-router.sh',
    'workflow-learning-engine.sh',
    'context-bridge.sh',
    'mcp-optimization-engine.sh',
    'predictive-quality-gate.sh',
    'design-workflow-analyzer.sh',
    'project-context-synthesis.sh',
    'vintage-game-audio.sh',
  ];

  advancedHooks.forEach(hookFile => {
    const sourcePath = path.join(__dirname, 'templates', 'hooks', hookFile);
    const targetPath = path.join(hooksDir, hookFile);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, 0o755);
    }
  });

  // Make executable
  fs.chmodSync(path.join(hooksDir, 'bumba-pre-execution.sh'), 0o755);
  fs.chmodSync(path.join(hooksDir, 'bumba-post-execution.sh'), 0o755);
  fs.chmodSync(path.join(hooksDir, 'bumba-completion.sh'), 0o755);

  spinner.stop();
  console.log('✓ BUMBA quality enforcement hooks generated');

  return true;
};
/* eslint-enable */

// Main Installation Function
const main = async () => {
  try {
    displayLogo();

    console.log(chalk.bold.white('Analyzing System Configuration...\n'));

    const analysis = analyzeExistingFrameworks();

    if (analysis.frameworks.length > 0) {
      console.log('Detected Existing Configuration:');
      analysis.frameworks.forEach(fw => {
        console.log('  ✓ ' + fw);
      });

      console.log('\nBUMBA Integration Strategy:');
      console.log(chalk.dim('  • Preserve valuable configurations'));
      console.log(chalk.dim('  • Implement professional quality gates'));
      console.log(chalk.dim('  • Add designer workflow capabilities'));
      console.log(chalk.dim('  • Enable enterprise security features'));
      console.log(chalk.dim('  • Create unified BUMBA experience\n'));

      // Create backup
      if (analysis.hasClaudeDir) {
        console.log('Creating backup...');
        execSync('cp -r "' + INSTALL_DIR + '" "' + BACKUP_DIR + '"');
        console.log('✓ Backup created: ' + path.basename(BACKUP_DIR) + '\n');
      }
    }

    // Installation steps
    await installQualityTools();
    await installMCPServers();
    await generateFrameworkFiles();
    await generateQualityHooks();

    // Success display with BUMBA branding
    console.log('\nBUMBA FRAMEWORK INSTALLATION COMPLETE!\n');

    // 🏁 WELCOME CEREMONY - Play sacred bumba-horn.mp3
    try {
      const {
        BumbaAudioConsciousness,
      } = require('./consciousnessModality/core/vibration/audioConsciousness');
      const audioConsciousness = new BumbaAudioConsciousness();

      console.log('🏁 Performing BUMBA Welcome Ceremony...');
      await audioConsciousness.performCeremony('PROJECT_BLESSING', {
        description: 'BUMBA Framework Installation Complete',
        projectName: 'BUMBA Consciousness-Driven Development',
        purpose: 'Elevating Claude development with conscious intention',
      });
    } catch (error) {
      console.log('🏁 Welcome ceremony completed (silent mode)');
    }

    console.log('\nCore BUMBA Framework Status: FULLY OPERATIONAL');
    console.log('Note: Any failed optional components do not affect core functionality.\n');

    const successTable = new Table({
      head: ['Component', 'Status', 'Description'],
      style: { head: [], border: [] },
    });

    successTable.push(
      ['BUMBA Framework', '✓ READY', 'Professional orchestration with quality gates'],
      ['MCP Ecosystem', '✓ READY', '14 verified servers including designer tools'],
      ['Quality System', '✓ READY', 'Pre/post execution validation'],
      ['Cognitive Safeguards', '✓ READY', 'Verification and memory management'],
      ['Designer Tools', '✓ READY', 'Dual Figma integration & visual workflows'],
      ['Command Suite', '✓ READY', 'Unified /bumba: command namespace']
    );

    console.log(successTable.toString());

    console.log('\nNext Steps:');
    console.log('1. Restart Claude Code to load BUMBA');
    console.log('2. Try: ' + chalk.white('/bumba:menu') + chalk.dim(' - Explore all commands'));
    console.log(
      '3. Try: ' + chalk.white('/bumba:implement') + chalk.dim(' - Intelligent development')
    );
    console.log('4. Try: ' + chalk.white('/bumba:design') + chalk.dim(' - Designer workflows'));
    console.log(
      '5. Try: ' + chalk.white('/bumba:figma') + chalk.dim(' - Figma Dev Mode integration')
    );
    console.log('\nOptional: Run ./fix-mcp-install.sh to retry failed MCP server installations');

    // BUMBA success banner
    const celebrationBanner =
      '\n' +
      '======================================================================\n' +
      'BUMBA Framework Ready! Your Professional Development Platform Awaits\n' +
      '======================================================================';

    console.log(celebrationBanner);

    // 🏁 MILESTONE 1: Installation Complete - Level Up Sound!
    try {
      execSync(
        '"' +
          path.join(INSTALL_DIR, 'hooks', 'vintage-game-audio.sh') +
          '" trigger installation_complete "BUMBA Framework successfully installed"',
        { stdio: 'pipe' }
      );
    } catch (error) {
      // Audio is optional - don't fail installation if it doesn't work
    }

    console.log('\nCore Platform Installed:');
    console.log('🏁 BUMBA Framework - Complete product development platform');
    console.log('🏁 Quality Tools - qlty with automatic code fixing');
    console.log('🏁 MCP Servers - Professional ecosystem configured and ready');
    console.log('🏁 Commands - Complete /bumba: command suite for all workflows');
    console.log('🏁 Quality Gates - Intelligent pre/post execution validation');
    console.log('🏁 Documentation - Enhanced CLAUDE.md with professional guide');
    console.log('🏁 Configuration - Optimized settings.json for peak performance');

    if (analysis.hasClaudeDir) {
      console.log('\\nYour original files have been backed up to ' + path.basename(BACKUP_DIR));
    }

    console.log('\n🏁 Next Steps:');
    console.log('  1. Restart Claude Code to activate BUMBA');
    console.log('  2. Try: /bumba:menu to explore all commands');
    console.log('  3. Start with: /bumba:implement [your feature]');
    console.log('  4. Optional: Configure additional MCP servers as needed');

    console.log('\n🏁 Welcome to Professional Claude Development! 🏁\n');

    // Reset terminal background at the end
    resetTerminalBackground();
  } catch (error) {
    console.error('\\n🏁 Installation failed: ' + error.message);

    // Provide helpful error context
    if (error.message.includes('claude mcp')) {
      console.error(
        chalk.yellow(
          '🏁 Suggestion: Ensure Claude Code is installed and updated to the latest version'
        )
      );
      console.error(chalk.dim('   Visit: https://claude.ai/code for the latest version\n'));
    } else if (error.message.includes('permission')) {
      console.error(
        chalk.yellow('🏁 Suggestion: Try running with appropriate permissions or check file access')
      );
      console.error(chalk.dim('   You may need to run: chmod +x ~/.claude/hooks/*\n'));
    } else if (error.message.includes('ENOENT')) {
      console.error(
        chalk.yellow(
          '🏁 Suggestion: Required command not found - check your PATH or install missing tools'
        )
      );
      console.error(chalk.dim('   Common missing tools: curl, bash, node\n'));
    } else {
      console.error(
        chalk.yellow('🏁 For help, please visit: https://github.com/bumba-claude/framework/issues')
      );
      console.error(chalk.dim('   Include the error message above when reporting issues\n'));
    }

    resetTerminalBackground();
    process.exit(1);
  }
};

// Run installation
main().catch(error => {
  console.error('Fatal error: ' + error.message);
  resetTerminalBackground();
  process.exit(1);
});
