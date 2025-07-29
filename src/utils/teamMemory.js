/**
 * BUMBA Team Memory System
 * Enables seamless agent coordination and context sharing
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class BumbaTeamMemory {
  constructor() {
    this.teamDir = path.join(os.homedir(), '.claude', 'team');
    this.contextFile = path.join(this.teamDir, 'context.json');
    this.agentHistoryFile = path.join(this.teamDir, 'agent-history.json');
    this.collaborationFile = path.join(this.teamDir, 'collaboration.json');

    this.ensureTeamDirectory();
    this.initializeTeamMemory();
  }

  /**
   * Ensure team memory directory exists
   */
  ensureTeamDirectory() {
    if (!fs.existsSync(this.teamDir)) {
      fs.mkdirSync(this.teamDir, { recursive: true });
    }
  }

  /**
   * Initialize team memory if it doesn't exist
   */
  initializeTeamMemory() {
    if (!fs.existsSync(this.contextFile)) {
      const initialContext = {
        version: '0.1.0',
        initialized: new Date().toISOString(),
        currentProject: path.basename(process.cwd()),
        agents: {
          'Product-Strategist': {
            lastActive: null,
            expertise: 'strategic planning, PRDs, requirements',
          },
          'Design-Engineer': {
            lastActive: null,
            expertise: 'UI/UX design, Figma integration, components',
          },
          'Backend-Engineer': {
            lastActive: null,
            expertise: 'architecture, backend, deployment',
          },
        },
        sharedContext: {},
        activeSession: null,
      };
      this.saveContext(initialContext);
    }

    if (!fs.existsSync(this.agentHistoryFile)) {
      const initialHistory = {
        sessions: [],
        handoffs: [],
        collaborations: [],
      };
      this.saveAgentHistory(initialHistory);
    }

    if (!fs.existsSync(this.collaborationFile)) {
      const initialCollaboration = {
        currentWorkflow: null,
        pendingHandoffs: [],
        qualityCheckpoints: [],
        teamDecisions: [],
      };
      this.saveCollaboration(initialCollaboration);
    }
  }

  /**
   * Get current team context
   */
  getTeamContext() {
    try {
      return JSON.parse(fs.readFileSync(this.contextFile, 'utf8'));
    } catch (error) {
      console.error('Error reading team context:', error);
      return null;
    }
  }

  /**
   * Save team context
   */
  saveContext(context) {
    try {
      context.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.contextFile, JSON.stringify(context, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving team context:', error);
      return false;
    }
  }

  /**
   * Record agent activity
   */
  recordAgentActivity(agentName, activity, details = {}) {
    const context = this.getTeamContext();
    if (!context) return false;

    // Update agent last active
    if (context.agents[agentName]) {
      context.agents[agentName].lastActive = new Date().toISOString();
      context.agents[agentName].lastActivity = activity;
    }

    // Record in shared context
    const activityId = `${agentName}_${Date.now()}`;
    context.sharedContext[activityId] = {
      agent: agentName,
      activity: activity,
      timestamp: new Date().toISOString(),
      details: details,
      type: 'agent_activity',
    };

    return this.saveContext(context);
  }

  /**
   * Create agent handoff
   */
  createHandoff(fromAgent, toAgent, context, priority = 'normal') {
    const teamContext = this.getTeamContext();
    if (!teamContext) return false;

    const handoff = {
      id: `handoff_${Date.now()}`,
      from: fromAgent,
      to: toAgent,
      timestamp: new Date().toISOString(),
      context: context,
      priority: priority,
      status: 'pending',
      files: this.getCurrentProjectFiles(),
      gitHash: this.getCurrentGitHash(),
    };

    // Add to shared context
    teamContext.sharedContext[handoff.id] = {
      type: 'handoff',
      ...handoff,
    };

    // Update collaboration file
    const collaboration = this.getCollaboration();
    collaboration.pendingHandoffs.push(handoff);
    this.saveCollaboration(collaboration);

    // Record in agent history
    this.recordAgentHistory({
      type: 'handoff_created',
      from: fromAgent,
      to: toAgent,
      handoffId: handoff.id,
      timestamp: new Date().toISOString(),
    });

    return this.saveContext(teamContext) ? handoff.id : false;
  }

  /**
   * Accept agent handoff
   */
  acceptHandoff(handoffId, acceptingAgent) {
    const teamContext = this.getTeamContext();
    const collaboration = this.getCollaboration();

    if (!teamContext || !collaboration) return false;

    // Find and update handoff
    const handoffIndex = collaboration.pendingHandoffs.findIndex(h => h.id === handoffId);
    if (handoffIndex === -1) return false;

    const handoff = collaboration.pendingHandoffs[handoffIndex];
    if (handoff.to !== acceptingAgent) return false;

    // Update handoff status
    handoff.status = 'accepted';
    handoff.acceptedAt = new Date().toISOString();

    // Remove from pending
    collaboration.pendingHandoffs.splice(handoffIndex, 1);

    // Update team context
    if (teamContext.sharedContext[handoffId]) {
      teamContext.sharedContext[handoffId].status = 'accepted';
      teamContext.sharedContext[handoffId].acceptedAt = new Date().toISOString();
    }

    // Record agent activity
    this.recordAgentActivity(acceptingAgent, 'handoff_accepted', {
      handoffId: handoffId,
      fromAgent: handoff.from,
      context: handoff.context,
    });

    // Record in agent history
    this.recordAgentHistory({
      type: 'handoff_accepted',
      agent: acceptingAgent,
      handoffId: handoffId,
      fromAgent: handoff.from,
      timestamp: new Date().toISOString(),
    });

    this.saveCollaboration(collaboration);
    return this.saveContext(teamContext);
  }

  /**
   * Get pending handoffs for agent
   */
  getPendingHandoffs(agentName) {
    const collaboration = this.getCollaboration();
    if (!collaboration) return [];

    return collaboration.pendingHandoffs.filter(h => h.to === agentName);
  }

  /**
   * Add quality checkpoint
   */
  addQualityCheckpoint(agentName, checkpointType, results, files = []) {
    const collaboration = this.getCollaboration();
    if (!collaboration) return false;

    const checkpoint = {
      id: `checkpoint_${Date.now()}`,
      agent: agentName,
      type: checkpointType,
      timestamp: new Date().toISOString(),
      results: results,
      files: files,
      gitHash: this.getCurrentGitHash(),
    };

    collaboration.qualityCheckpoints.push(checkpoint);

    // Record agent activity
    this.recordAgentActivity(agentName, 'quality_checkpoint', {
      checkpointType: checkpointType,
      checkpointId: checkpoint.id,
      results: results,
    });

    return this.saveCollaboration(collaboration);
  }

  /**
   * Record team decision
   */
  recordTeamDecision(decision, involvedAgents, rationale) {
    const collaboration = this.getCollaboration();
    if (!collaboration) return false;

    const teamDecision = {
      id: `decision_${Date.now()}`,
      decision: decision,
      involvedAgents: involvedAgents,
      rationale: rationale,
      timestamp: new Date().toISOString(),
      gitHash: this.getCurrentGitHash(),
    };

    collaboration.teamDecisions.push(teamDecision);

    // Record in team context
    const teamContext = this.getTeamContext();
    if (teamContext) {
      teamContext.sharedContext[teamDecision.id] = {
        type: 'team_decision',
        ...teamDecision,
      };
      this.saveContext(teamContext);
    }

    return this.saveCollaboration(collaboration);
  }

  /**
   * Get agent history
   */
  getAgentHistory() {
    try {
      return JSON.parse(fs.readFileSync(this.agentHistoryFile, 'utf8'));
    } catch (error) {
      console.error('Error reading agent history:', error);
      return null;
    }
  }

  /**
   * Save agent history
   */
  saveAgentHistory(history) {
    try {
      fs.writeFileSync(this.agentHistoryFile, JSON.stringify(history, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving agent history:', error);
      return false;
    }
  }

  /**
   * Record agent history event
   */
  recordAgentHistory(event) {
    const history = this.getAgentHistory();
    if (!history) return false;

    history.sessions.push(event);

    // Keep only last 100 events
    if (history.sessions.length > 100) {
      history.sessions = history.sessions.slice(-100);
    }

    return this.saveAgentHistory(history);
  }

  /**
   * Get collaboration state
   */
  getCollaboration() {
    try {
      return JSON.parse(fs.readFileSync(this.collaborationFile, 'utf8'));
    } catch (error) {
      console.error('Error reading collaboration:', error);
      return null;
    }
  }

  /**
   * Save collaboration state
   */
  saveCollaboration(collaboration) {
    try {
      collaboration.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.collaborationFile, JSON.stringify(collaboration, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving collaboration:', error);
      return false;
    }
  }

  /**
   * Get current project files
   */
  getCurrentProjectFiles() {
    try {
      const { execSync } = require('child_process');
      const files = execSync(
        'find . -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.md" | head -20',
        { encoding: 'utf8' }
      );
      return files
        .trim()
        .split('\n')
        .filter(f => f && !f.includes('node_modules'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get current git hash
   */
  getCurrentGitHash() {
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get team collaboration summary
   */
  getTeamSummary() {
    const context = this.getTeamContext();
    const collaboration = this.getCollaboration();
    const history = this.getAgentHistory();

    if (!context || !collaboration || !history) {
      return null;
    }

    return {
      project: context.currentProject,
      activeAgents: Object.entries(context.agents)
        .filter(([_, data]) => data.lastActive)
        .map(([name, data]) => ({ name, lastActive: data.lastActive })),
      pendingHandoffs: collaboration.pendingHandoffs.length,
      recentCheckpoints: collaboration.qualityCheckpoints.slice(-5),
      recentDecisions: collaboration.teamDecisions.slice(-3),
      sessionCount: history.sessions.length,
    };
  }

  /**
   * Clear old data (cleanup utility)
   */
  cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const collaboration = this.getCollaboration();
    if (collaboration) {
      // Clean old checkpoints
      collaboration.qualityCheckpoints = collaboration.qualityCheckpoints.filter(
        checkpoint => new Date(checkpoint.timestamp) > cutoffDate
      );

      // Clean old decisions
      collaboration.teamDecisions = collaboration.teamDecisions.filter(
        decision => new Date(decision.timestamp) > cutoffDate
      );

      this.saveCollaboration(collaboration);
    }

    const history = this.getAgentHistory();
    if (history) {
      // Clean old sessions
      history.sessions = history.sessions.filter(
        session => new Date(session.timestamp) > cutoffDate
      );

      this.saveAgentHistory(history);
    }

    return true;
  }
}

module.exports = { BumbaTeamMemory };
