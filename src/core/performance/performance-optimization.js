/**
 * BUMBA Advanced Performance Optimization System
 * Resource pooling, lazy loading, intelligent caching, and performance enhancement
 */

const fs = require('fs');
const path = require('path');
const { BumbaError, BumbaErrorBoundary } = require('../error-handling/bumba-error-system');
const { resourceManager } = require('../resource-management/resource-manager');

/**
 * Advanced Resource Pool for object reuse
 */
class ResourcePool {
  constructor(factory, options = {}) {
    this.factory = factory;
    this.maxSize = options.maxSize || 10;
    this.minSize = options.minSize || 2;
    this.idleTimeout = options.idleTimeout || 5 * 60 * 1000; // 5 minutes
    this.validateOnAcquire = options.validateOnAcquire || false;
    
    this.available = [];
    this.inUse = new Map();
    this.created = 0;
    this.destroyed = 0;
    this.acquisitions = 0;
    this.releases = 0;
    
    this.maintenanceInterval = null;
    this.startMaintenance();
  }

  /**
   * Acquire resource from pool
   */
  async acquire() {
    this.acquisitions++;
    
    // Try to get available resource
    let resource = this.available.pop();
    
    if (resource) {
      // Validate if required
      if (this.validateOnAcquire && !(await this.validateResource(resource))) {
        await this.destroyResource(resource);
        resource = null;
      }
    }
    
    // Create new resource if needed and under limit
    if (!resource && this.getTotalSize() < this.maxSize) {
      resource = await this.createResource();
    }
    
    // If still no resource and we're at capacity, wait or fail
    if (!resource) {
      if (this.getTotalSize() >= this.maxSize) {
        throw new BumbaError('RESOURCE_POOL_EXHAUSTED', 
          `Resource pool exhausted (max: ${this.maxSize})`);
      }
      resource = await this.createResource();
    }
    
    // Track usage
    this.inUse.set(resource, {
      acquired_at: Date.now(),
      usage_count: (this.inUse.get(resource)?.usage_count || 0) + 1
    });
    
    return resource;
  }

  /**
   * Release resource back to pool
   */
  release(resource) {
    if (!this.inUse.has(resource)) {
      console.warn('⚠️ Attempting to release resource not in use');
      return;
    }
    
    this.releases++;
    this.inUse.delete(resource);
    
    // Add back to available pool if under max available size
    if (this.available.length < this.maxSize / 2) {
      this.available.push(resource);
    } else {
      // Destroy excess resources
      this.destroyResource(resource);
    }
  }

  /**
   * Create new resource
   */
  async createResource() {
    try {
      const resource = await this.factory();
      this.created++;
      return resource;
    } catch (error) {
      throw new BumbaError('RESOURCE_CREATION_FAILED', 
        `Failed to create resource: ${error.message}`);
    }
  }

  /**
   * Destroy resource
   */
  async destroyResource(resource) {
    try {
      if (resource && typeof resource.destroy === 'function') {
        await resource.destroy();
      }
      this.destroyed++;
    } catch (error) {
      console.warn(`⚠️ Error destroying resource: ${error.message}`);
    }
  }

  /**
   * Validate resource health
   */
  async validateResource(resource) {
    try {
      if (typeof resource.isHealthy === 'function') {
        return await resource.isHealthy();
      }
      return true; // Assume healthy if no validation method
    } catch (error) {
      return false;
    }
  }

  /**
   * Get total pool size
   */
  getTotalSize() {
    return this.available.length + this.inUse.size;
  }

  /**
   * Start maintenance routine
   */
  startMaintenance() {
    this.maintenanceInterval = setInterval(async () => {
      await this.performMaintenance();
    }, 60000); // Run every minute
  }

  /**
   * Perform pool maintenance
   */
  async performMaintenance() {
    const now = Date.now();
    
    // Remove idle resources
    const idleResources = [];
    for (let i = this.available.length - 1; i >= 0; i--) {
      const resource = this.available[i];
      const idleTime = now - (this.getResourceMetadata(resource)?.last_used || now);
      
      if (idleTime > this.idleTimeout && this.available.length > this.minSize) {
        idleResources.push(this.available.splice(i, 1)[0]);
      }
    }
    
    // Destroy idle resources
    for (const resource of idleResources) {
      await this.destroyResource(resource);
    }
    
    // Ensure minimum pool size
    while (this.available.length < this.minSize && this.getTotalSize() < this.maxSize) {
      try {
        const resource = await this.createResource();
        this.available.push(resource);
      } catch (error) {
        console.warn(`⚠️ Failed to maintain minimum pool size: ${error.message}`);
        break;
      }
    }
  }

  /**
   * Get resource metadata
   */
  getResourceMetadata(resource) {
    return this.inUse.get(resource);
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.available.length,
      in_use: this.inUse.size,
      total_size: this.getTotalSize(),
      max_size: this.maxSize,
      min_size: this.minSize,
      created: this.created,
      destroyed: this.destroyed,
      acquisitions: this.acquisitions,
      releases: this.releases,
      utilization: this.inUse.size / this.maxSize
    };
  }

  /**
   * Shutdown pool
   */
  async shutdown() {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    
    // Destroy all resources
    const allResources = [...this.available, ...this.inUse.keys()];
    await Promise.all(allResources.map(resource => this.destroyResource(resource)));
    
    this.available = [];
    this.inUse.clear();
  }
}

/**
 * Intelligent Caching System
 */
class IntelligentCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 10 * 60 * 1000; // 10 minutes
    this.checkPeriod = options.checkPeriod || 60 * 1000; // 1 minute
    
    this.cache = new Map();
    this.usage = new Map(); // Track usage patterns
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    };
    
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check expiration
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.usage.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return undefined;
    }
    
    // Update usage statistics
    const usage = this.usage.get(key) || { count: 0, last_accessed: 0 };
    usage.count++;
    usage.last_accessed = Date.now();
    this.usage.set(key, usage);
    
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, customTtl = null) {
    const ttl = customTtl || this.ttl;
    const expires = Date.now() + ttl;
    
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      value: value,
      created: Date.now(),
      expires: expires,
      size: this.estimateSize(value)
    });
    
    // Initialize usage tracking
    if (!this.usage.has(key)) {
      this.usage.set(key, { count: 0, last_accessed: Date.now() });
    }
    
    this.stats.size = this.cache.size;
  }

  /**
   * Delete from cache
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.usage.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }

  /**
   * Check if key exists
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check expiration
    if (Date.now() > entry.expires) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Evict least recently used item
   */
  evictLeastUsed() {
    let leastUsedKey = null;
    let leastUsedScore = Infinity;
    
    for (const [key, usage] of this.usage) {
      // Score based on frequency and recency
      const timeSinceAccess = Date.now() - usage.last_accessed;
      const score = usage.count / (1 + timeSinceAccess / 1000); // Decay over time
      
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.delete(leastUsedKey);
      this.stats.evictions++;
    }
  }

  /**
   * Estimate memory size of value
   */
  estimateSize(value) {
    if (typeof value === 'string') {
      return value.length * 2; // Rough estimate for UTF-16
    } else if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 50; // Default estimate
  }

  /**
   * Start cleanup routine
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.checkPeriod);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expires) {
        expired.push(key);
      }
    }
    
    expired.forEach(key => {
      this.delete(key);
      this.stats.evictions++;
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ? 
      this.stats.hits / (this.stats.hits + this.stats.misses) : 0;
    
    return {
      ...this.stats,
      hit_rate: hitRate,
      size_limit: this.maxSize,
      memory_estimate: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate total memory usage
   */
  estimateMemoryUsage() {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size || 0;
    }
    return total;
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.usage.clear();
    this.stats.size = 0;
  }
}

/**
 * Lazy Loading System
 */
class LazyLoader {
  constructor() {
    this.loaded = new Map();
    this.loading = new Map(); // Track ongoing loads
    this.failed = new Set(); // Track failed loads
    this.stats = {
      loads: 0,
      cache_hits: 0,
      failures: 0
    };
  }

  /**
   * Lazy load module with caching
   */
  async load(modulePath) {
    // Return cached module if available
    if (this.loaded.has(modulePath)) {
      this.stats.cache_hits++;
      return this.loaded.get(modulePath);
    }
    
    // Check if already loading (prevent duplicate loads)
    if (this.loading.has(modulePath)) {
      return await this.loading.get(modulePath);
    }
    
    // Don't retry failed modules immediately
    if (this.failed.has(modulePath)) {
      throw new BumbaError('MODULE_LOAD_FAILED', 
        `Module ${modulePath} previously failed to load`);
    }
    
    // Start loading
    const loadPromise = this.performLoad(modulePath);
    this.loading.set(modulePath, loadPromise);
    
    try {
      const module = await loadPromise;
      this.loaded.set(modulePath, module);
      this.loading.delete(modulePath);
      this.stats.loads++;
      return module;
    } catch (error) {
      this.loading.delete(modulePath);
      this.failed.add(modulePath);
      this.stats.failures++;
      throw error;
    }
  }

  /**
   * Perform actual module loading
   */
  async performLoad(modulePath) {
    try {
      // Dynamic import for ES modules or require for CommonJS
      if (modulePath.endsWith('.mjs') || modulePath.includes('es-modules')) {
        return await import(modulePath);
      } else {
        // Clear require cache for fresh load
        delete require.cache[require.resolve(modulePath)];
        return require(modulePath);
      }
    } catch (error) {
      throw new BumbaError('MODULE_LOAD_ERROR', 
        `Failed to load module ${modulePath}: ${error.message}`);
    }
  }

  /**
   * Preload modules for better performance
   */
  async preload(modulePaths) {
    console.log(`📦 Preloading ${modulePaths.length} modules...`);
    
    const loadPromises = modulePaths.map(async (modulePath) => {
      try {
        await this.load(modulePath);
        return { module: modulePath, success: true };
      } catch (error) {
        return { module: modulePath, success: false, error: error.message };
      }
    });
    
    const results = await Promise.all(loadPromises);
    const successful = results.filter(r => r.success).length;
    
    console.log(`✅ Preloaded ${successful}/${modulePaths.length} modules`);
    return results;
  }

  /**
   * Unload module from cache
   */
  unload(modulePath) {
    this.loaded.delete(modulePath);
    this.failed.delete(modulePath);
    
    // Clear from require cache as well
    try {
      delete require.cache[require.resolve(modulePath)];
    } catch (error) {
      // Module may not be in require cache
    }
  }

  /**
   * Get loader statistics
   */
  getStats() {
    return {
      ...this.stats,
      loaded_modules: this.loaded.size,
      failed_modules: this.failed.size,
      currently_loading: this.loading.size,
      cache_hit_rate: this.stats.loads > 0 ? 
        this.stats.cache_hits / (this.stats.cache_hits + this.stats.loads) : 0
    };
  }

  /**
   * Clear all caches
   */
  clear() {
    this.loaded.clear();
    this.loading.clear();
    this.failed.clear();
  }
}

/**
 * Connection Pool for external services
 */
class ConnectionPool {
  constructor(maxConnections = 20) {
    this.maxConnections = maxConnections;
    this.connections = new ResourcePool(
      () => this.createConnection(),
      {
        maxSize: maxConnections,
        minSize: Math.min(2, maxConnections),
        validateOnAcquire: true
      }
    );
  }

  /**
   * Create new connection (override in subclass)
   */
  async createConnection() {
    return {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      created: Date.now(),
      isHealthy: async () => true,
      destroy: async () => console.log(`Connection ${this.id} destroyed`)
    };
  }

  /**
   * Execute operation with pooled connection
   */
  async executeWithConnection(operation) {
    const connection = await this.connections.acquire();
    
    try {
      return await operation(connection);
    } finally {
      this.connections.release(connection);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return this.connections.getStats();
  }

  /**
   * Shutdown pool
   */
  async shutdown() {
    await this.connections.shutdown();
  }
}

/**
 * Worker Pool for CPU-intensive tasks
 */
class WorkerPool {
  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers;
    this.workers = new ResourcePool(
      () => this.createWorker(),
      {
        maxSize: maxWorkers,
        minSize: Math.min(1, maxWorkers)
      }
    );
    this.taskQueue = [];
    this.processing = false;
  }

  /**
   * Create new worker (simulated)
   */
  async createWorker() {
    return {
      id: `worker_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      execute: async (task) => {
        // Simulate CPU-intensive work
        await new Promise(resolve => setTimeout(resolve, task.duration || 100));
        return { result: `Task ${task.id} completed`, worker: this.id };
      },
      destroy: async () => console.log(`Worker ${this.id} terminated`)
    };
  }

  /**
   * Execute task with worker pool
   */
  async executeTask(task) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process task queue
   */
  async processQueue() {
    if (this.processing || this.taskQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.taskQueue.length > 0) {
      const { task, resolve, reject } = this.taskQueue.shift();
      
      try {
        const worker = await this.workers.acquire();
        
        try {
          const result = await worker.execute(task);
          resolve(result);
        } finally {
          this.workers.release(worker);
        }
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.workers.getStats(),
      queued_tasks: this.taskQueue.length,
      processing: this.processing
    };
  }

  /**
   * Shutdown pool
   */
  async shutdown() {
    // Clear queue
    this.taskQueue.forEach(({ reject }) => {
      reject(new Error('Worker pool shutting down'));
    });
    this.taskQueue = [];
    
    await this.workers.shutdown();
  }
}

/**
 * Performance Optimization Manager
 */
class PerformanceOptimizer {
  constructor() {
    this.agentPool = new ResourcePool(() => this.createAgent(), { maxSize: 10 });
    this.connectionPool = new ConnectionPool(20);
    this.workerPool = new WorkerPool(4);
    
    this.cache = new IntelligentCache({ maxSize: 200, ttl: 15 * 60 * 1000 });
    this.lazyLoader = new LazyLoader();
    
    this.optimizations = {
      pooling_enabled: true,
      caching_enabled: true,
      lazy_loading_enabled: true,
      preloading_enabled: true
    };
    
    this.stats = {
      optimizations_applied: 0,
      performance_gains: [],
      resource_savings: 0
    };
  }

  /**
   * Create agent for pool
   */
  async createAgent() {
    return {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      type: 'pooled_agent',
      execute: async (task, enhancers, context) => {
        // Simulate agent execution
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return {
          success: true,
          agent_id: this.id,
          execution_time: Date.now() - startTime,
          pooled: true
        };
      },
      isHealthy: async () => true,
      destroy: async () => console.log(`Agent ${this.id} destroyed`)
    };
  }

  /**
   * Execute task with pooled resources
   */
  async executeWithPooledResources(task, enhancers = [], context = {}) {
    const startTime = Date.now();
    
    try {
      // Use agent from pool
      const agent = await this.agentPool.acquire();
      
      // Use connection from pool if needed
      let result;
      if (context.needsConnection) {
        result = await this.connectionPool.executeWithConnection(async (connection) => {
          return await agent.execute(task, enhancers, { ...context, connection });
        });
      } else {
        result = await agent.execute(task, enhancers, context);
      }
      
      // Release agent back to pool
      this.agentPool.release(agent);
      
      const duration = Date.now() - startTime;
      this.recordPerformanceGain('pooled_execution', duration);
      
      return {
        ...result,
        optimization: {
          pooled_resources: true,
          execution_time: duration,
          resource_reuse: true
        }
      };
      
    } catch (error) {
      throw new BumbaError('POOLED_EXECUTION_FAILED', 
        `Pooled resource execution failed: ${error.message}`);
    }
  }

  /**
   * Execute with intelligent caching
   */
  async executeWithCaching(cacheKey, operation, options = {}) {
    if (!this.optimizations.caching_enabled) {
      return await operation();
    }
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`🎯 Cache hit: ${cacheKey}`);
      return cached;
    }
    
    // Execute operation
    console.log(`💾 Cache miss: ${cacheKey} - executing operation`);
    const result = await operation();
    
    // Cache result
    const ttl = options.ttl || null;
    this.cache.set(cacheKey, result, ttl);
    
    return result;
  }

  /**
   * Load module with lazy loading
   */
  async loadModule(modulePath) {
    if (!this.optimizations.lazy_loading_enabled) {
      return require(modulePath);
    }
    
    return await this.lazyLoader.load(modulePath);
  }

  /**
   * Preload critical modules
   */
  async preloadCriticalModules() {
    if (!this.optimizations.preloading_enabled) return;
    
    const criticalModules = [
      './error-handling/bumba-error-system',
      './resource-management/resource-manager',
      './monitoring/performance-metrics',
      './agents/simplified-agent-system'
    ];
    
    await this.lazyLoader.preload(criticalModules);
  }

  /**
   * Apply performance optimizations to object
   */
  optimizeObject(obj, optimizations = []) {
    let optimized = obj;
    
    for (const optimization of optimizations) {
      switch (optimization) {
        case 'memoize':
          optimized = this.memoizeObject(optimized);
          break;
        case 'throttle':
          optimized = this.throttleObject(optimized);
          break;
        case 'debounce':
          optimized = this.debounceObject(optimized);
          break;
        case 'batch':
          optimized = this.batchObject(optimized);
          break;
      }
    }
    
    this.stats.optimizations_applied++;
    return optimized;
  }

  /**
   * Memoize object methods
   */
  memoizeObject(obj) {
    const memoCache = new Map();
    
    return new Proxy(obj, {
      get(target, prop) {
        const value = target[prop];
        
        if (typeof value === 'function') {
          return function(...args) {
            const key = `${prop}:${JSON.stringify(args)}`;
            
            if (memoCache.has(key)) {
              return memoCache.get(key);
            }
            
            const result = value.apply(this, args);
            memoCache.set(key, result);
            return result;
          };
        }
        
        return value;
      }
    });
  }

  /**
   * Throttle object methods
   */
  throttleObject(obj, delay = 1000) {
    const throttleMap = new Map();
    
    return new Proxy(obj, {
      get(target, prop) {
        const value = target[prop];
        
        if (typeof value === 'function') {
          return function(...args) {
            const now = Date.now();
            const lastCall = throttleMap.get(prop) || 0;
            
            if (now - lastCall >= delay) {
              throttleMap.set(prop, now);
              return value.apply(this, args);
            }
            
            return null; // Throttled call
          };
        }
        
        return value;
      }
    });
  }

  /**
   * Debounce object methods
   */
  debounceObject(obj, delay = 500) {
    const debounceMap = new Map();
    
    return new Proxy(obj, {
      get(target, prop) {
        const value = target[prop];
        
        if (typeof value === 'function') {
          return function(...args) {
            const existingTimeout = debounceMap.get(prop);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            
            const timeout = setTimeout(() => {
              value.apply(this, args);
              debounceMap.delete(prop);
            }, delay);
            
            debounceMap.set(prop, timeout);
          };
        }
        
        return value;
      }
    });
  }

  /**
   * Batch object method calls
   */
  batchObject(obj, batchSize = 10, batchDelay = 100) {
    const batches = new Map();
    
    return new Proxy(obj, {
      get(target, prop) {
        const value = target[prop];
        
        if (typeof value === 'function') {
          return function(...args) {
            if (!batches.has(prop)) {
              batches.set(prop, { calls: [], timeout: null });
            }
            
            const batch = batches.get(prop);
            batch.calls.push(args);
            
            if (batch.timeout) clearTimeout(batch.timeout);
            
            if (batch.calls.length >= batchSize) {
              // Execute batch immediately
              this.executeBatch(value, batch.calls, this);
              batches.delete(prop);
            } else {
              // Schedule batch execution
              batch.timeout = setTimeout(() => {
                this.executeBatch(value, batch.calls, this);
                batches.delete(prop);
              }, batchDelay);
            }
          };
        }
        
        return value;
      }
    });
  }

  /**
   * Execute batched calls
   */
  executeBatch(fn, calls, context) {
    // Execute all calls in the batch
    calls.forEach(args => fn.apply(context, args));
  }

  /**
   * Record performance gain
   */
  recordPerformanceGain(optimization, improvement) {
    this.stats.performance_gains.push({
      optimization: optimization,
      improvement: improvement,
      timestamp: Date.now()
    });
    
    // Keep only recent gains
    if (this.stats.performance_gains.length > 100) {
      this.stats.performance_gains.shift();
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getPerformanceStats() {
    return {
      optimizations: this.stats,
      
      pools: {
        agent_pool: this.agentPool.getStats(),
        connection_pool: this.connectionPool.getStats(),
        worker_pool: this.workerPool.getStats()
      },
      
      caching: this.cache.getStats(),
      lazy_loading: this.lazyLoader.getStats(),
      
      memory_estimate: this.estimateMemoryUsage(),
      enabled_optimizations: this.optimizations
    };
  }

  /**
   * Estimate total memory usage
   */
  estimateMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    
    return {
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      cache_memory_mb: Math.round(this.cache.estimateMemoryUsage() / 1024 / 1024),
      pool_estimate_mb: this.estimatePoolMemory()
    };
  }

  /**
   * Estimate pool memory usage
   */
  estimatePoolMemory() {
    const agentPoolSize = this.agentPool.getTotalSize();
    const connectionPoolSize = this.connectionPool.getStats().total_size;
    const workerPoolSize = this.workerPool.getStats().total_size;
    
    // Rough estimates
    return (agentPoolSize * 5) + (connectionPoolSize * 2) + (workerPoolSize * 10);
  }

  /**
   * Enable/disable specific optimizations
   */
  setOptimization(name, enabled) {
    if (this.optimizations.hasOwnProperty(name)) {
      this.optimizations[name] = enabled;
      console.log(`🔧 ${name} optimization ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down performance optimizer...');
    
    await Promise.all([
      this.agentPool.shutdown(),
      this.connectionPool.shutdown(),
      this.workerPool.shutdown()
    ]);
    
    this.cache.clear();
    this.lazyLoader.clear();
    
    console.log('✅ Performance optimizer shutdown completed');
  }
}

// Export singleton instance and classes
const performanceOptimizer = new PerformanceOptimizer();

module.exports = {
  PerformanceOptimizer,
  ResourcePool,
  IntelligentCache,
  LazyLoader,
  ConnectionPool,
  WorkerPool,
  performanceOptimizer
};