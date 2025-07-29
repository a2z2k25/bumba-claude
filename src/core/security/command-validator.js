/**
 * BUMBA Security Layer - Command Validation and Sanitization
 * Prevents command injection, validates inputs, and enforces permissions
 */

const path = require('path');
const { createHash } = require('crypto');

class CommandValidator {
  constructor() {
    // Whitelist of allowed system commands
    this.allowedCommands = new Set([
      'which',
      'ping',
      'npm',
      'node',
      'git',
      'afplay',
      'mpg123',
      'ffplay',
      'paplay',
      'qlty'
    ]);

    // Regex patterns for validation
    this.patterns = {
      alphanumeric: /^[a-zA-Z0-9_-]+$/,
      filePath: /^[a-zA-Z0-9_.\-/\\]+$/,
      command: /^[a-zA-Z0-9_-]+$/,
      npmPackage: /^(@[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_-]+$/,
      url: /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/
    };

    // Command-specific validators
    this.commandValidators = {
      which: (args) => args.length === 1 && this.patterns.command.test(args[0]),
      ping: (args) => args.length >= 2 && args[0] === '-c' && /^\d+$/.test(args[1]),
      npm: (args) => this.validateNpmCommand(args),
      git: (args) => this.validateGitCommand(args),
      afplay: (args) => args.length === 1 && this.isValidPath(args[0]),
      mpg123: (args) => args.every(arg => arg.startsWith('-') || this.isValidPath(arg)),
      ffplay: (args) => args.every(arg => arg.startsWith('-') || this.isValidPath(arg)),
      paplay: (args) => args.length === 1 && this.isValidPath(args[0]),
      qlty: (args) => this.validateQltyCommand(args)
    };

    // Permission levels
    this.permissions = {
      read: ['which', 'ping', 'git status', 'git log', 'npm list'],
      write: ['git add', 'git commit', 'npm install'],
      execute: ['npm run', 'node', 'qlty']
    };
  }

  /**
   * Validates and sanitizes a command before execution
   * @param {string} command - The command to execute
   * @param {Array<string>} args - Command arguments
   * @param {Object} context - Execution context (user, permissions, etc.)
   * @returns {Object} { valid: boolean, sanitized: { command, args }, error?: string }
   */
  validateCommand(command, args = [], context = {}) {
    try {
      // 1. Check if command is in whitelist
      if (!this.allowedCommands.has(command)) {
        return {
          valid: false,
          error: `Command '${command}' is not allowed`
        };
      }

      // 2. Validate command format
      if (!this.patterns.command.test(command)) {
        return {
          valid: false,
          error: 'Invalid command format'
        };
      }

      // 3. Run command-specific validation
      const validator = this.commandValidators[command];
      if (validator && !validator(args)) {
        return {
          valid: false,
          error: `Invalid arguments for command '${command}'`
        };
      }

      // 4. Check permissions
      if (!this.checkPermissions(command, args, context)) {
        return {
          valid: false,
          error: 'Insufficient permissions for this command'
        };
      }

      // 5. Sanitize arguments
      const sanitizedArgs = this.sanitizeArguments(args);

      return {
        valid: true,
        sanitized: {
          command,
          args: sanitizedArgs
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Validates npm commands
   */
  validateNpmCommand(args) {
    if (args.length === 0) return false;
    
    const subCommand = args[0];
    const allowedNpmCommands = ['install', 'run', 'list', 'test', 'start'];
    
    if (!allowedNpmCommands.includes(subCommand)) return false;
    
    if (subCommand === 'install' && args.length > 1) {
      // Validate package names
      return args.slice(1).every(arg => 
        arg.startsWith('-') || this.patterns.npmPackage.test(arg)
      );
    }
    
    return true;
  }

  /**
   * Validates git commands
   */
  validateGitCommand(args) {
    if (args.length === 0) return false;
    
    const subCommand = args[0];
    const allowedGitCommands = ['status', 'log', 'add', 'commit', 'diff', 'branch'];
    
    if (!allowedGitCommands.includes(subCommand)) return false;
    
    if (subCommand === 'commit' && args.includes('-m')) {
      // Ensure commit message doesn't contain shell metacharacters
      const messageIndex = args.indexOf('-m') + 1;
      if (messageIndex < args.length) {
        const message = args[messageIndex];
        return !this.containsShellMetacharacters(message);
      }
    }
    
    return true;
  }

  /**
   * Validates qlty commands
   */
  validateQltyCommand(args) {
    const allowedQltyCommands = ['--version', 'check', 'fix', 'init'];
    return args.length === 0 || allowedQltyCommands.includes(args[0]);
  }

  /**
   * Checks if a path is valid and safe
   */
  isValidPath(filePath) {
    try {
      // Prevent directory traversal
      const normalized = path.normalize(filePath);
      if (normalized.includes('..')) return false;
      
      // Check against pattern
      return this.patterns.filePath.test(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Checks for shell metacharacters that could enable command injection
   */
  containsShellMetacharacters(str) {
    const dangerous = /[;&|`$<>\\n\\r]/;
    return dangerous.test(str);
  }

  /**
   * Sanitizes command arguments
   */
  sanitizeArguments(args) {
    return args.map(arg => {
      // Remove any null bytes
      let sanitized = arg.replace(/\0/g, '');
      
      // Escape quotes if present
      sanitized = sanitized.replace(/"/g, '\\"');
      
      // Remove newlines and carriage returns
      sanitized = sanitized.replace(/[\r\n]/g, '');
      
      return sanitized;
    });
  }

  /**
   * Checks if user has permission to execute command
   */
  checkPermissions(command, args, context) {
    // For now, allow all validated commands
    // In production, implement proper RBAC
    return true;
  }

  /**
   * Validates a file path for read/write operations
   */
  validateFilePath(filePath, operation = 'read') {
    try {
      // Normalize path
      const normalized = path.normalize(filePath);
      
      // Check for directory traversal
      if (normalized.includes('..')) {
        return {
          valid: false,
          error: 'Directory traversal detected'
        };
      }
      
      // Check if path is absolute
      if (!path.isAbsolute(normalized)) {
        return {
          valid: false,
          error: 'Only absolute paths are allowed'
        };
      }
      
      // Check against allowed directories
      const allowedDirs = [
        process.env.HOME,
        '/tmp',
        process.cwd()
      ];
      
      const isInAllowedDir = allowedDirs.some(dir => 
        normalized.startsWith(path.normalize(dir))
      );
      
      if (!isInAllowedDir) {
        return {
          valid: false,
          error: 'Path is outside allowed directories'
        };
      }
      
      return {
        valid: true,
        sanitized: normalized
      };
    } catch (error) {
      return {
        valid: false,
        error: `Path validation error: ${error.message}`
      };
    }
  }

  /**
   * Creates a secure hash of sensitive data
   */
  hashSensitiveData(data) {
    return createHash('sha256').update(data).digest('hex');
  }
}

module.exports = CommandValidator;