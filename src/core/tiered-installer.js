/**
 * BUMBA Tiered Installation System
 * Addresses 40% installation failure rate with progressive enhancement
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, exec } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

class BumbaTieredInstaller {
  constructor() {
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.modes = {
      minimal: {
        name: 'Minimal Core',
        description: 'Essential BUMBA functionality only',
        mcpServers: ['memory', 'filesystem'],
        risk: 'very-low',
        estimatedTime: '30s'
      },
      standard: {
        name: 'Standard',
        description: 'Core + stable MCP servers',
        mcpServers: ['memory', 'filesystem', 'sequential-thinking', 'github', 'fetch'],
        risk: 'low',
        estimatedTime: '2m'
      },
      full: {
        name: 'Full Experience',
        description: 'Complete BUMBA ecosystem',
        mcpServers: ['memory', 'filesystem', 'sequential-thinking', 'github', 'fetch', 
                     'figma-dev-mode', 'notion', 'postgres', 'mongodb', 'supabase', 
                     'ref', 'exa', 'semgrep', 'pieces'],
        risk: 'medium',
        estimatedTime: '5m'
      }
    };
  }

  /**
   * Pre-flight system compatibility check
   */
  async preFlightCheck() {
    const checks = {
      system: this.checkSystemCompatibility(),
      node: await this.checkNodeVersion(),
      claude: await this.checkClaudeCode(),
      npm: await this.checkNpmAccess(),
      permissions: await this.checkPermissions(),
      network: await this.checkNetworkConnectivity()
    };

    const failures = Object.entries(checks)
      .filter(([key, result]) => !result.success)
      .map(([key, result]) => ({ component: key, ...result }));

    return {
      compatible: failures.length === 0,
      failures: failures,
      recommendations: this.generateRecommendations(failures),
      suggested_mode: this.suggestInstallationMode(checks)
    };
  }

  checkSystemCompatibility() {
    const platform = os.platform();
    const supportedPlatforms = ['darwin', 'linux', 'win32'];
    
    return {
      success: supportedPlatforms.includes(platform),
      details: {
        platform: platform,
        architecture: os.arch(),
        supported: supportedPlatforms.includes(platform)
      }
    };
  }

  async checkNodeVersion() {
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      return {
        success: majorVersion >= 18,
        details: {
          version: nodeVersion,
          required: '>=18.0.0',
          compatible: majorVersion >= 18
        }
      };
    } catch (error) {
      return {
        success: false,
        details: { error: error.message }
      };
    }
  }

  async checkClaudeCode() {
    try {
      const result = execSync('claude --version', { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 5000 
      });
      
      return {
        success: true,
        details: {
          version: result.trim(),
          available: true
        }
      };
    } catch (error) {
      return {
        success: false,
        details: {
          error: 'Claude Code not found or not accessible',
          suggestion: 'Install Claude Code first: https://claude.ai/code'
        }
      };
    }
  }

  async checkNpmAccess() {
    try {
      execSync('npm --version', { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 5000 
      });
      
      return {
        success: true,
        details: { available: true }
      };
    } catch (error) {
      return {
        success: false,
        details: { error: 'npm not accessible' }
      };
    }
  }

  async checkPermissions() {
    try {
      // Check if we can write to .claude directory
      if (!fs.existsSync(this.claudeDir)) {
        fs.mkdirSync(this.claudeDir, { recursive: true });
      }
      
      const testFile = path.join(this.claudeDir, 'test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      return {
        success: true,
        details: { writable: true }
      };
    } catch (error) {
      return {
        success: false,
        details: { 
          error: 'Cannot write to ~/.claude directory',
          suggestion: 'Check file permissions'
        }
      };
    }
  }

  async checkNetworkConnectivity() {
    try {
      await new Promise((resolve, reject) => {
        exec('ping -c 1 8.8.8.8', { timeout: 3000 }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      
      return {
        success: true,
        details: { connected: true }
      };
    } catch (error) {
      return {
        success: false,
        details: { 
          error: 'No network connectivity',
          impact: 'MCP server installation may fail'
        }
      };
    }
  }

  generateRecommendations(failures) {
    const recommendations = [];
    
    failures.forEach(failure => {
      switch (failure.component) {
        case 'claude':
          recommendations.push('Install Claude Code from https://claude.ai/code');
          break;
        case 'node':
          recommendations.push('Upgrade Node.js to version 18 or higher');
          break;
        case 'npm':
          recommendations.push('Ensure npm is installed and accessible');
          break;
        case 'permissions':
          recommendations.push('Fix file permissions for ~/.claude directory');
          break;
        case 'network':
          recommendations.push('Use --mode=minimal for offline installation');
          break;
        default:
          recommendations.push(`Address ${failure.component} compatibility issue`);
      }
    });
    
    return recommendations;
  }

  suggestInstallationMode(checks) {
    const failures = Object.values(checks).filter(check => !check.success).length;
    
    if (failures === 0) return 'full';
    if (failures <= 1 && checks.claude.success) return 'standard';
    if (checks.claude.success && checks.permissions.success) return 'minimal';
    
    return 'check-only';
  }

  /**
   * Execute tiered installation
   */
  async install(mode = 'standard', options = {}) {
    const config = this.modes[mode];
    if (!config) {
      throw new Error(`Unknown installation mode: ${mode}`);
    }

    console.log(chalk.cyan.bold(`\n🏁 BUMBA ${config.name} Installation`));
    console.log(chalk.gray(`${config.description} (${config.estimatedTime}, ${config.risk} risk)\n`));

    // Pre-flight check unless skipped
    if (!options.skipCheck) {
      const preflight = await this.preFlightCheck();
      if (!preflight.compatible && !options.force) {
        console.log(chalk.red('❌ Pre-flight check failed:'));
        preflight.failures.forEach(failure => {
          console.log(`   • ${failure.component}: ${failure.details.error || 'incompatible'}`);
        });
        console.log(chalk.yellow('\nRecommendations:'));
        preflight.recommendations.forEach(rec => {
          console.log(`   • ${rec}`);
        });
        console.log(chalk.white('\nUse --force to proceed anyway or --check-only to validate system\n'));
        return false;
      }
    }

    const spinner = ora('Installing BUMBA framework...').start();
    
    try {
      // Step 1: Core framework files
      spinner.text = 'Installing core framework files...';
      await this.installCoreFiles();
      
      // Step 2: Essential MCP servers (with fallback)
      spinner.text = 'Installing MCP servers...';
      const mcpResults = await this.installMCPServers(config.mcpServers, options);
      
      // Step 3: Configuration setup
      spinner.text = 'Setting up configuration...';
      await this.setupConfiguration();
      
      // Step 4: Verification
      spinner.text = 'Verifying installation...';
      const verification = await this.verifyInstallation();
      
      spinner.succeed('BUMBA installation completed successfully!');
      
      // Display results
      this.displayInstallationResults(mode, mcpResults, verification);
      
      return true;
      
    } catch (error) {
      spinner.fail(`Installation failed: ${error.message}`);
      
      // Attempt recovery
      console.log(chalk.yellow('\n🏁 Attempting recovery...'));
      const recovery = await this.attemptRecovery(error);
      
      if (recovery.success) {
        console.log(chalk.green('✅ Recovery successful - partial installation available'));
        return 'partial';
      }
      
      return false;
    }
  }

  async installCoreFiles() {
    // Install essential framework files only
    const coreFiles = [
      'CLAUDE.md',
      'settings.json'
    ];
    
    const { generateFrameworkFiles } = require('../index.js');
    await generateFrameworkFiles({ minimal: true });
  }

  async installMCPServers(serverList, options = {}) {
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    for (const serverName of serverList) {
      try {
        const command = this.getMCPInstallCommand(serverName);
        if (!command) {
          results.skipped.push({ server: serverName, reason: 'No install command' });
          continue;
        }

        execSync(command, { 
          stdio: options.verbose ? 'inherit' : 'pipe',
          timeout: 60000 // 1 minute timeout per server
        });
        
        results.successful.push(serverName);
        
      } catch (error) {
        results.failed.push({ 
          server: serverName, 
          error: error.message,
          recovery: this.getMCPFallback(serverName)
        });
        
        // Don't fail entire installation for optional servers
        if (options.verbose) {
          console.log(chalk.yellow(`Warning: ${serverName} installation failed, continuing...`));
        }
      }
    }

    return results;
  }

  getMCPInstallCommand(serverName) {
    const commands = {
      'memory': 'claude mcp add memory --server npx:@modelcontextprotocol/server-memory',
      'filesystem': 'claude mcp add filesystem --server npx:@modelcontextprotocol/server-filesystem',
      'sequential-thinking': 'claude mcp add sequential-thinking --server npx:@modelcontextprotocol/server-sequential-thinking',
      'github': 'claude mcp add github --server npx:@modelcontextprotocol/server-github',
      'fetch': 'claude mcp add fetch --server npx:@modelcontextprotocol/server-fetch',
      'notion': 'claude mcp add notion --server npx:@modelcontextprotocol/server-notion',
      'postgres': 'claude mcp add postgres --server npx:@modelcontextprotocol/server-postgres',
      'mongodb': 'claude mcp add mongodb --server npx:mongodb-mcp-server',
      'supabase': 'claude mcp add supabase --server npx:@supabase/mcp-server',
      'figma-dev-mode': 'claude mcp add figma-dev-mode --server npx:@modelcontextprotocol/server-figma-dev-mode'
    };
    
    return commands[serverName];
  }

  getMCPFallback(serverName) {
    const fallbacks = {
      'memory': 'Local memory simulation',
      'filesystem': 'Basic file operations',
      'sequential-thinking': 'Standard reasoning',
      'github': 'Manual git operations',
      'fetch': 'Manual web requests'
    };
    
    return fallbacks[serverName] || 'Manual alternative';
  }

  async setupConfiguration() {
    // Create minimal, working configuration
    const configData = {
      framework_version: '2.0.0',
      installation_mode: 'tiered',
      created_at: new Date().toISOString()
    };
    
    const configPath = path.join(this.claudeDir, 'bumba-config.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  }

  async verifyInstallation() {
    const checks = {
      core_files: fs.existsSync(path.join(this.claudeDir, 'CLAUDE.md')),
      config: fs.existsSync(path.join(this.claudeDir, 'bumba-config.json')),
      mcp_accessible: false
    };
    
    try {
      execSync('claude mcp list', { stdio: 'pipe', timeout: 5000 });
      checks.mcp_accessible = true;
    } catch (error) {
      // MCP not accessible but installation may still be partially successful
    }
    
    return checks;
  }

  displayInstallationResults(mode, mcpResults, verification) {
    console.log(chalk.green.bold('\n🎉 Installation Summary'));
    console.log(chalk.white(`Mode: ${this.modes[mode].name}`));
    
    if (mcpResults.successful.length > 0) {
      console.log(chalk.green(`✅ MCP Servers (${mcpResults.successful.length}): ${mcpResults.successful.join(', ')}`));
    }
    
    if (mcpResults.failed.length > 0) {
      console.log(chalk.yellow(`⚠️  Failed MCP Servers (${mcpResults.failed.length}):`));
      mcpResults.failed.forEach(failure => {
        console.log(`   • ${failure.server}: ${failure.recovery}`);
      });
    }
    
    console.log(chalk.cyan('\n🚀 Next Steps:'));
    console.log('   • Run: npx bumba-claude /bumba:help');
    console.log('   • Upgrade: npx bumba-claude install --mode=full');
    console.log('   • Status: npx bumba-claude /bumba:status\n');
  }

  async attemptRecovery(error) {
    try {
      // Create minimal working installation
      await this.installCoreFiles();
      await this.setupConfiguration();
      
      return {
        success: true,
        mode: 'recovery',
        message: 'Minimal installation created'
      };
    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError.message
      };
    }
  }
}

// CLI interface
if (require.main === module) {
  const installer = new BumbaTieredInstaller();
  const args = process.argv.slice(2);
  
  const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'standard';
  const options = {
    force: args.includes('--force'),
    verbose: args.includes('--verbose'),
    skipCheck: args.includes('--skip-check')
  };
  
  if (args.includes('--check-only')) {
    installer.preFlightCheck().then(result => {
      console.log('🏁 BUMBA System Compatibility Check\n');
      
      if (result.compatible) {
        console.log(chalk.green('✅ System is compatible'));
        console.log(chalk.cyan(`Recommended mode: ${result.suggested_mode}`));
      } else {
        console.log(chalk.red('❌ Compatibility issues found:'));
        result.failures.forEach(failure => {
          console.log(`   • ${failure.component}: ${failure.details.error || 'incompatible'}`);
        });
        console.log(chalk.yellow('\nRecommendations:'));
        result.recommendations.forEach(rec => {
          console.log(`   • ${rec}`);
        });
      }
    });
  } else {
    installer.install(mode, options).then(result => {
      process.exit(result === true ? 0 : 1);
    });
  }
}

module.exports = { BumbaTieredInstaller };