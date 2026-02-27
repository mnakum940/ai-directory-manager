import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

export class ExecutionEngine {
    constructor(rollbackManager) {
        this.rollbackManager = rollbackManager;
    }

    /**
     * Generates a dry run preview without making changes
     */
    async generateDryRun(blueprint) {
        const preview = [];

        // blueprint.actions could be { type: 'move', source: '...', target: '...' }
        for (const action of blueprint.actions) {
            if (action.type === 'move') {
                const fileExists = fsSync.existsSync(action.source);
                const targetExists = fsSync.existsSync(action.target);

                preview.push({
                    action: 'move',
                    source: action.source,
                    target: action.target,
                    status: fileExists ? (targetExists ? 'conflict' : 'ready') : 'missing_source',
                    reason: action.reason || 'Organizing directory'
                });
            }
        }

        return preview;
    }

    /**
     * Executes the blueprint with an associated transaction ID for rollback
     */
    async executeBlueprint(blueprint, transactionId) {
        await this.rollbackManager.beginTransaction(transactionId);

        const log = [];

        for (const action of blueprint.actions) {
            if (action.type === 'move') {
                try {
                    // Ensure target directory exists
                    const targetDir = path.dirname(action.target);
                    if (!fsSync.existsSync(targetDir)) {
                        await fs.mkdir(targetDir, { recursive: true });
                    }

                    // Write move to rollback log BEFORE moving
                    await this.rollbackManager.logMove(transactionId, action.source, action.target);

                    await fs.rename(action.source, action.target);

                    log.push({ success: true, action });
                } catch (error) {
                    console.error(`Failed to move ${action.source} to ${action.target}:`, error);
                    log.push({ success: false, action, error: error.message });
                    // In a strict environment, we might abort the rest and rollback here.
                }
            }
        }

        await this.rollbackManager.completeTransaction(transactionId);
        return log;
    }
}
