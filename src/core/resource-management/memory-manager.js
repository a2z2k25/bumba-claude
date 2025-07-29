/**
 * BUMBA Memory Manager
 * Prevents memory leaks, manages caches, and ensures efficient resource usage
 */

const os = require('os');
const v8 = require('v8');
const { EventEmitter } = require('events');

class MemoryManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      maxMemoryMB: options.maxMemoryMB || 512,
      maxCacheSize: options.maxCacheSize || 1000,
      maxArraySize: options.maxArraySize || 10000,
      gcInterval: options.gcInterval || 60000, // 1 minute
      monitorInterval: options.monitorInterval || 30000, // 30 seconds
      warningThreshold: options.warningThreshold || 0.8, // 80% memory usage
      criticalThreshold: options.criticalThreshold || 0.9 // 90% memory usage
    };
    
    // Resource tracking
    this.resources = new Map();
    this.caches = new Map();
    this.intervals = new Set();
    this.timers = new Set();
    this.eventListeners = new WeakMap();
    
    // Memory statistics
    this.stats = {
      gcRuns: 0,
      cacheEvictions: 0,
      resourcesFreed: 0,
      warnings: 0,
      criticals: 0
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    // Memory monitor
    this.monitorInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.monitorInterval);
    
    // Garbage collection interval
    if (global.gc) {
      this.gcInterval = setInterval(() => {
        this.runGarbageCollection();
      }, this.config.gcInterval);
    }
    
    // Track these intervals
    this.intervals.add(this.monitorInterval);
    if (this.gcInterval) {
      this.intervals.add(this.gcInterval);
    }
  }

  /**
   * Register a resource for tracking
   */
  registerResource(id, resource, options = {}) {
    const resourceInfo = {
      id,
      resource,
      type: options.type || 'generic',
      created: Date.now(),
      lastAccessed: Date.now(),
      size: this.estimateSize(resource),
      cleanup: options.cleanup || null,
      ttl: options.ttl || null
    };
    
    this.resources.set(id, resourceInfo);
    
    // Set up TTL if specified
    if (options.ttl) {
      const timer = setTimeout(() => {
        this.freeResource(id);
      }, options.ttl);
      
      this.timers.add(timer);
      resourceInfo.timer = timer;
    }
    
    return id;
  }

  /**
   * Register a cache with size limits
   */
  registerCache(name, cache, options = {}) {
    const cacheInfo = {
      name,
      cache,
      maxSize: options.maxSize || this.config.maxCacheSize,
      evictionPolicy: options.evictionPolicy || 'lru', // lru, fifo, random
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    this.caches.set(name, cacheInfo);
    
    // Wrap cache methods to track usage
    this.wrapCacheMethods(cacheInfo);
    
    return name;
  }

  /**
   * Wrap cache methods for monitoring
   */
  wrapCacheMethods(cacheInfo) {
    const { cache } = cacheInfo;
    
    // Wrap set method
    const originalSet = cache.set;
    if (originalSet) {
      cache.set = (key, value) => {
        // Check size limit
        if (cache.size >= cacheInfo.maxSize) {
          this.evictFromCache(cacheInfo);
        }
        
        return originalSet.call(cache, key, value);
      };
    }
    
    // Wrap get method
    const originalGet = cache.get;
    if (originalGet) {
      cache.get = (key) => {
        const result = originalGet.call(cache, key);
        
        if (result !== undefined) {
          cacheInfo.hits++;
        } else {
          cacheInfo.misses++;
        }
        
        return result;
      };
    }
  }

  /**
   * Evict items from cache based on policy
   */
  evictFromCache(cacheInfo) {
    const { cache, evictionPolicy } = cacheInfo;
    
    switch (evictionPolicy) {
      case 'lru':
        // Least Recently Used (requires access tracking)
        const lru = this.findLRUItem(cache);
        if (lru) cache.delete(lru);
        break;
        
      case 'fifo':
        // First In First Out
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
        break;
        
      case 'random':
        // Random eviction
        const keys = Array.from(cache.keys());
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (randomKey) cache.delete(randomKey);
        break;
    }
    
    cacheInfo.evictions++;
    this.stats.cacheEvictions++;
  }

  /**
   * Find least recently used item (simplified)
   */
  findLRUItem(cache) {
    // In a real implementation, this would track access times
    // For now, just return the first key
    return cache.keys().next().value;
  }

  /**
   * Check current memory usage
   */
  checkMemoryUsage() {
    const usage = this.getMemoryUsage();
    const usageRatio = usage.heapUsed / usage.heapTotal;
    
    this.emit('memory-check', {
      usage,
      ratio: usageRatio,
      timestamp: Date.now()
    });
    
    // Check thresholds
    if (usageRatio > this.config.criticalThreshold) {
      this.stats.criticals++;
      this.handleCriticalMemory(usage);
    } else if (usageRatio > this.config.warningThreshold) {
      this.stats.warnings++;
      this.handleMemoryWarning(usage);
    }
  }

  /**
   * Get detailed memory usage
   */
  getMemoryUsage() {
    const nodeUsage = process.memoryUsage();
    const v8Usage = v8.getHeapStatistics();
    const systemUsage = os.freemem() / os.totalmem();
    
    return {
      // Node.js memory
      rss: nodeUsage.rss,
      heapTotal: nodeUsage.heapTotal,
      heapUsed: nodeUsage.heapUsed,
      external: nodeUsage.external,
      arrayBuffers: nodeUsage.arrayBuffers,
      
      // V8 details
      totalHeapSize: v8Usage.total_heap_size,
      usedHeapSize: v8Usage.used_heap_size,
      heapSizeLimit: v8Usage.heap_size_limit,
      mallocedMemory: v8Usage.malloced_memory,
      
      // System
      systemFreeRatio: systemUsage,
      
      // Calculated
      heapUsedMB: Math.round(nodeUsage.heapUsed / 1024 / 1024),
      heapUsedPercent: Math.round((nodeUsage.heapUsed / nodeUsage.heapTotal) * 100)
    };
  }

  /**
   * Handle memory warning
   */
  handleMemoryWarning(usage) {
    this.emit('memory-warning', usage);
    
    // Clean up old resources
    this.cleanupOldResources();
    
    // Reduce cache sizes
    this.reduceCacheSizes(0.2); // Reduce by 20%
  }

  /**
   * Handle critical memory situation
   */
  handleCriticalMemory(usage) {
    this.emit('memory-critical', usage);
    
    // Aggressive cleanup
    this.cleanupOldResources(true);
    
    // Clear caches
    this.clearAllCaches();
    
    // Force garbage collection
    if (global.gc) {
      this.runGarbageCollection();
    }
    
    // Free large resources
    this.freeLargeResources();
  }

  /**
   * Clean up old resources
   */
  cleanupOldResources(aggressive = false) {
    const now = Date.now();
    const maxAge = aggressive ? 5 * 60 * 1000 : 30 * 60 * 1000; // 5 or 30 minutes
    
    for (const [id, info] of this.resources) {
      if (now - info.lastAccessed > maxAge) {
        this.freeResource(id);
      }
    }
  }

  /**
   * Free a specific resource
   */
  freeResource(id) {
    const info = this.resources.get(id);
    if (!info) return false;
    
    // Run cleanup function if provided
    if (info.cleanup && typeof info.cleanup === 'function') {
      try {
        info.cleanup(info.resource);
      } catch (error) {
        // Log error but continue
        console.error(`Cleanup error for resource ${id}:`, error);
      }
    }
    
    // Clear timer if exists
    if (info.timer) {
      clearTimeout(info.timer);
      this.timers.delete(info.timer);
    }
    
    // Remove from tracking
    this.resources.delete(id);
    this.stats.resourcesFreed++;
    
    return true;
  }

  /**
   * Free resources above a certain size
   */
  freeLargeResources(thresholdMB = 10) {
    const thresholdBytes = thresholdMB * 1024 * 1024;
    
    for (const [id, info] of this.resources) {
      if (info.size > thresholdBytes) {
        this.freeResource(id);
      }
    }
  }

  /**
   * Reduce cache sizes
   */
  reduceCacheSizes(factor = 0.2) {
    for (const [name, cacheInfo] of this.caches) {
      const { cache } = cacheInfo;
      const targetSize = Math.floor(cache.size * (1 - factor));
      
      while (cache.size > targetSize) {
        this.evictFromCache(cacheInfo);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    for (const [name, cacheInfo] of this.caches) {
      cacheInfo.cache.clear();
      this.emit('cache-cleared', name);
    }
  }

  /**
   * Run garbage collection
   */
  runGarbageCollection() {
    if (!global.gc) return;
    
    const before = this.getMemoryUsage();
    global.gc();
    const after = this.getMemoryUsage();
    
    this.stats.gcRuns++;
    
    this.emit('gc-complete', {
      before,
      after,
      freed: before.heapUsed - after.heapUsed
    });
  }

  /**
   * Estimate size of an object (simplified)
   */
  estimateSize(obj) {
    // This is a very rough estimate
    try {
      const str = JSON.stringify(obj);
      return str.length * 2; // Rough estimate for Unicode
    } catch {
      return 1024; // Default 1KB for non-serializable objects
    }
  }

  /**
   * Track event listeners to prevent leaks
   */
  trackEventListener(emitter, event, listener) {
    if (!this.eventListeners.has(emitter)) {
      this.eventListeners.set(emitter, new Map());
    }
    
    const listeners = this.eventListeners.get(emitter);
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    
    listeners.get(event).add(listener);
  }

  /**
   * Clean up event listeners
   */
  cleanupEventListeners(emitter) {
    const listeners = this.eventListeners.get(emitter);
    if (!listeners) return;
    
    for (const [event, listenerSet] of listeners) {
      for (const listener of listenerSet) {
        emitter.removeListener(event, listener);
      }
    }
    
    this.eventListeners.delete(emitter);
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentUsage: this.getMemoryUsage(),
      resourceCount: this.resources.size,
      cacheCount: this.caches.size,
      timerCount: this.timers.size
    };
  }

  /**
   * Shutdown and cleanup
   */
  shutdown() {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    // Clear all timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    // Free all resources
    for (const id of this.resources.keys()) {
      this.freeResource(id);
    }
    
    // Clear all caches
    this.clearAllCaches();
    
    // Remove all listeners
    this.removeAllListeners();
  }
}

// Singleton instance
let instance = null;

module.exports = {
  MemoryManager,
  
  // Get singleton instance
  getInstance(options) {
    if (!instance) {
      instance = new MemoryManager(options);
    }
    return instance;
  },
  
  // Convenience methods
  registerResource: (id, resource, options) => {
    return getInstance().registerResource(id, resource, options);
  },
  
  freeResource: (id) => {
    return getInstance().freeResource(id);
  },
  
  getMemoryUsage: () => {
    return getInstance().getMemoryUsage();
  }
};