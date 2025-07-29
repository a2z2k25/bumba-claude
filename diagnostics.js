#!/usr/bin/env node

/**
 * BUMBA 1.0 Framework Diagnostics
 * Comprehensive health check for framework components
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class FrameworkDiagnostics {
  constructor() {
    this.results = {
      core: [],
      commands: [],
      dependencies: [],
      version: [],
      structure: [],
      audio: []
    };
  }

  async runDiagnostics() {
    console.log('🏁 BUMBA 1.0 Framework Diagnostics Starting...\n');
    
    await this.checkVersion();
    await this.checkCoreFiles();
    await this.checkCommands();
    await this.checkDependencies();
    await this.checkFolderStructure();
    await this.checkAudioSystem();
    
    this.printResults();
  }

  async checkVersion() {
    console.log('📋 Checking Version Consistency...');
    
    try {
      // Check package.json
      const packageJson = require('./package.json');
      this.results.version.push({
        test: 'Package Version',
        status: packageJson.version === '1.0.0' ? '✅' : '❌',
        value: packageJson.version
      });

      // Check config
      const config = require('./bumba.config.js');
      this.results.version.push({
        test: 'Config Version',
        status: config.framework.version === '1.0.0' ? '✅' : '❌',
        value: config.framework.version
      });

      // Check for old version references
      const { stdout } = await execAsync('grep -r "BUMBA 2.0" src/ docs/ --include="*.js" --include="*.md" | wc -l');
      const oldRefs = parseInt(stdout.trim());
      this.results.version.push({
        test: 'Old Version References',
        status: oldRefs === 0 ? '✅' : '⚠️',
        value: `${oldRefs} references found`
      });

    } catch (error) {
      this.results.version.push({
        test: 'Version Check',
        status: '❌',
        value: error.message
      });
    }
  }

  async checkCoreFiles() {
    console.log('🔧 Checking Core Files...');
    
    const coreFiles = [
      'src/index.js',
      'src/core/command-handler.js',
      'src/core/integration/master-integration.js',
      'src/core/monitoring/health-monitor.js',
      'src/core/monitoring/performance-metrics.js',
      'src/core/lite-mode/bumba-lite.js',
      'bumba.config.js',
      'package.json',
      'README.md',
      'CHANGELOG.md'
    ];

    for (const file of coreFiles) {
      const exists = fs.existsSync(path.join(__dirname, file));
      this.results.core.push({
        test: file,
        status: exists ? '✅' : '❌',
        value: exists ? 'Present' : 'Missing'
      });
    }
  }

  async checkCommands() {
    console.log('📁 Checking Command Templates...');
    
    const commandDir = path.join(__dirname, 'src/templates/commands');
    const expectedCommands = [
      'menu.md', 'agents.md', 'implement.md', 'implement-agents.md',
      'implement-strategy.md', 'implement-design.md', 'implement-technical.md',
      'analyze.md', 'secure.md', 'conscious.md', 'health.md', 'performance.md',
      'status.md', 'help.md', 'settings.md'
    ];

    try {
      const files = fs.readdirSync(commandDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      this.results.commands.push({
        test: 'Total Commands',
        status: mdFiles.length >= 30 ? '✅' : '⚠️',
        value: `${mdFiles.length} command templates`
      });

      for (const cmd of expectedCommands) {
        const exists = files.includes(cmd);
        this.results.commands.push({
          test: cmd,
          status: exists ? '✅' : '❌',
          value: exists ? 'Present' : 'Missing'
        });
      }
    } catch (error) {
      this.results.commands.push({
        test: 'Command Check',
        status: '❌',
        value: error.message
      });
    }
  }

  async checkDependencies() {
    console.log('📦 Checking Dependencies...');
    
    try {
      const packageJson = require('./package.json');
      const deps = Object.keys(packageJson.dependencies || {});
      
      this.results.dependencies.push({
        test: 'Dependency Count',
        status: deps.length > 0 ? '✅' : '❌',
        value: `${deps.length} dependencies`
      });

      // Check if node_modules exists
      const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
      this.results.dependencies.push({
        test: 'node_modules',
        status: nodeModulesExists ? '✅' : '⚠️',
        value: nodeModulesExists ? 'Installed' : 'Not installed (run npm install)'
      });

    } catch (error) {
      this.results.dependencies.push({
        test: 'Dependency Check',
        status: '❌',
        value: error.message
      });
    }
  }

  async checkFolderStructure() {
    console.log('📂 Checking Folder Structure...');
    
    const requiredDirs = [
      'src/core',
      'src/core/agents',
      'src/core/monitoring',
      'src/core/lite-mode',
      'src/core/integration',
      'src/templates',
      'src/templates/commands',
      'src/tests',
      'docs',
      'assets',
      'assets/audio'
    ];

    for (const dir of requiredDirs) {
      const exists = fs.existsSync(path.join(__dirname, dir));
      this.results.structure.push({
        test: dir,
        status: exists ? '✅' : '❌',
        value: exists ? 'Present' : 'Missing'
      });
    }
  }

  async checkAudioSystem() {
    console.log('🎵 Checking Audio System...');
    
    const audioFile = path.join(__dirname, 'assets/audio/bumba-horn.mp3');
    const exists = fs.existsSync(audioFile);
    
    this.results.audio.push({
      test: 'bumba-horn.mp3',
      status: exists ? '✅' : '❌',
      value: exists ? 'Present' : 'Missing'
    });

    if (exists) {
      const stats = fs.statSync(audioFile);
      this.results.audio.push({
        test: 'Audio File Size',
        status: stats.size > 0 ? '✅' : '❌',
        value: `${(stats.size / 1024).toFixed(1)} KB`
      });
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 BUMBA 1.0 Diagnostics Results');
    console.log('='.repeat(60));

    let totalTests = 0;
    let passedTests = 0;

    for (const [category, results] of Object.entries(this.results)) {
      if (results.length === 0) continue;
      
      console.log(`\n${category.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      for (const result of results) {
        console.log(`${result.status} ${result.test}: ${result.value}`);
        totalTests++;
        if (result.status === '✅') passedTests++;
      }
    }

    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(60));

    if (successRate >= 90) {
      console.log('\n✅ Framework is healthy and ready for use!');
    } else if (successRate >= 70) {
      console.log('\n⚠️  Framework has some issues but is functional.');
    } else {
      console.log('\n❌ Framework needs attention before use.');
    }

    // Print recommendations
    if (this.results.dependencies.some(r => r.test === 'node_modules' && r.status !== '✅')) {
      console.log('\n💡 Recommendation: Run "npm install" to install dependencies');
    }
  }
}

// Run diagnostics
const diagnostics = new FrameworkDiagnostics();
diagnostics.runDiagnostics().catch(console.error);