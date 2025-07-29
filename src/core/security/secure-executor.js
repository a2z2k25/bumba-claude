/**
 * BUMBA Secure Command Executor
 * Safely executes system commands with validation and sanitization
 */

const { spawn } = require('child_process');
const CommandValidator = require('./command-validator');

class SecureExecutor {
  constructor() {
    this.validator = new CommandValidator();
    this.defaultTimeout = 30000; // 30 seconds
    this.activeProcesses = new Map();
  }

  /**
   * Safely executes a command with validation
   * @param {string} command - Command to execute
   * @param {Array<string>} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async execute(command, args = [], options = {}) {
    const {
      timeout = this.defaultTimeout,
      context = {},
      cwd = process.cwd(),
      env = process.env,
      encoding = 'utf8'
    } = options;

    // Validate command
    const validation = this.validator.validateCommand(command, args, context);
    if (!validation.valid) {
      throw new Error(`Command validation failed: ${validation.error}`);
    }

    const { sanitized } = validation;

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let processKilled = false;

      // Spawn process with sanitized arguments
      const child = spawn(sanitized.command, sanitized.args, {
        cwd,
        env,
        shell: false, // Never use shell to prevent injection
        windowsHide: true
      });

      // Track active process
      const processId = Date.now() + Math.random();
      this.activeProcesses.set(processId, child);

      // Setup timeout
      const timer = setTimeout(() => {
        processKilled = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      // Collect stdout
      child.stdout.on('data', (data) => {
        stdout += data.toString(encoding);
      });

      // Collect stderr
      child.stderr.on('data', (data) => {
        stderr += data.toString(encoding);
      });

      // Handle process completion
      child.on('close', (code) => {
        clearTimeout(timer);
        this.activeProcesses.delete(processId);

        if (processKilled) {
          reject(new Error(`Command timed out after ${timeout}ms`));
          return;
        }

        if (code !== 0) {
          const error = new Error(`Command failed with exit code ${code}`);
          error.code = code;
          error.stderr = stderr;
          error.stdout = stdout;
          reject(error);
          return;
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code,
          command: sanitized.command,
          args: sanitized.args
        });
      });

      // Handle spawn errors
      child.on('error', (error) => {
        clearTimeout(timer);
        this.activeProcesses.delete(processId);
        reject(error);
      });
    });
  }

  /**
   * Executes a command synchronously (for migration purposes)
   * WARNING: Use async execute() instead when possible
   */
  executeSync(command, args = [], options = {}) {
    const validation = this.validator.validateCommand(command, args, options.context || {});
    if (!validation.valid) {
      throw new Error(`Command validation failed: ${validation.error}`);
    }

    const { sanitized } = validation;
    const { spawnSync } = require('child_process');

    const result = spawnSync(sanitized.command, sanitized.args, {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      shell: false,
      encoding: options.encoding || 'utf8',
      timeout: options.timeout || this.defaultTimeout,
      windowsHide: true
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      const error = new Error(`Command failed with exit code ${result.status}`);
      error.code = result.status;
      error.stderr = result.stderr;
      error.stdout = result.stdout;
      throw error;
    }

    return {
      stdout: (result.stdout || '').trim(),
      stderr: (result.stderr || '').trim(),
      code: result.status
    };
  }

  /**
   * Safely checks if a command exists in the system
   */
  async commandExists(command) {
    try {
      await this.execute('which', [command], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safely checks if a command exists (sync version)
   */
  commandExistsSync(command) {
    try {
      this.executeSync('which', [command], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Terminates all active processes
   */
  async cleanup() {
    const promises = [];
    
    for (const [id, process] of this.activeProcesses) {
      promises.push(new Promise((resolve) => {
        process.kill('SIGTERM');
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      }));
    }

    await Promise.all(promises);
    this.activeProcesses.clear();
  }

  /**
   * Creates a safe executor for file operations
   */
  static createFileOperationExecutor() {
    const executor = new SecureExecutor();
    const validator = new CommandValidator();

    return {
      async readFile(filePath) {
        const validation = validator.validateFilePath(filePath, 'read');
        if (!validation.valid) {
          throw new Error(`File path validation failed: ${validation.error}`);
        }
        
        const fs = require('fs').promises;
        return await fs.readFile(validation.sanitized, 'utf8');
      },

      async writeFile(filePath, content) {
        const validation = validator.validateFilePath(filePath, 'write');
        if (!validation.valid) {
          throw new Error(`File path validation failed: ${validation.error}`);
        }
        
        const fs = require('fs').promises;
        return await fs.writeFile(validation.sanitized, content, 'utf8');
      },

      async fileExists(filePath) {
        const validation = validator.validateFilePath(filePath, 'read');
        if (!validation.valid) {
          return false;
        }
        
        const fs = require('fs').promises;
        try {
          await fs.access(validation.sanitized);
          return true;
        } catch {
          return false;
        }
      }
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SecureExecutor,
  
  // Get singleton instance
  getInstance() {
    if (!instance) {
      instance = new SecureExecutor();
    }
    return instance;
  },
  
  // Convenience exports
  execute: async (...args) => {
    return getInstance().execute(...args);
  },
  
  executeSync: (...args) => {
    return getInstance().executeSync(...args);
  },
  
  commandExists: async (...args) => {
    return getInstance().commandExists(...args);
  },
  
  commandExistsSync: (...args) => {
    return getInstance().commandExistsSync(...args);
  }
};