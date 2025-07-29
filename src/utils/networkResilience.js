// BUMBA Network Resilience Utilities
// Handles network failures and implements smart retry logic

const { exec } = require('child_process');
const { promisify } = require('util');

class NetworkResilience {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.backoffFactor = options.backoffFactor || 2;
  }

  async executeWithRetry(command, options = {}) {
    const execAsync = promisify(exec);
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Add timeout to prevent hanging
        const result = await Promise.race([
          execAsync(command, { ...options, timeout: 30000 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Command timeout')), 30000)),
        ]);

        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Log attempt for debugging
        if (options.verbose) {
          console.log(`Attempt ${attempt}/${this.maxRetries} failed: ${error.message}`);
        }

        // Don't wait after the last attempt
        if (attempt < this.maxRetries) {
          const delay = Math.min(
            this.baseDelay * Math.pow(this.backoffFactor, attempt - 1),
            this.maxDelay
          );

          if (options.verbose) {
            console.log(`Waiting ${delay}ms before retry...`);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  isNonRetryableError(error) {
    const nonRetryableMessages = [
      'command not found',
      'permission denied',
      'no such file or directory',
      'authentication failed',
      'invalid credentials',
    ];

    return nonRetryableMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  async checkConnectivity() {
    try {
      // Quick connectivity check
      await this.executeWithRetry('ping -c 1 8.8.8.8', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkClaudeCodeAvailability() {
    try {
      await this.executeWithRetry('claude --version', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async preflightChecks() {
    const checks = {
      network: await this.checkConnectivity(),
      claudeCode: await this.checkClaudeCodeAvailability(),
      npmAccess: true, // Will be checked below
    };

    try {
      await this.executeWithRetry('npm --version', { timeout: 5000 });
    } catch (error) {
      checks.npmAccess = false;
    }

    return checks;
  }
}

module.exports = NetworkResilience;
