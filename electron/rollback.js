import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

export class RollbackManager {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = new sqlite3.Database(dbPath);
        this.initDb();
    }

    initDb() {
        this.db.serialize(() => {
            this.db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          timestamp INTEGER,
          status TEXT
        )
      `);
            this.db.run(`
        CREATE TABLE IF NOT EXISTS file_moves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id TEXT,
          source_path TEXT,
          target_path TEXT,
          FOREIGN KEY(transaction_id) REFERENCES transactions(id)
        )
      `);
        });
    }

    async beginTransaction(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO transactions (id, timestamp, status) VALUES (?, ?, ?)',
                [id, Date.now(), 'active'],
                (err) => err ? reject(err) : resolve()
            );
        });
    }

    async logMove(transactionId, sourcePath, targetPath) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO file_moves (transaction_id, source_path, target_path) VALUES (?, ?, ?)',
                [transactionId, sourcePath, targetPath],
                (err) => err ? reject(err) : resolve()
            );
        });
    }

    async completeTransaction(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE transactions SET status = ? WHERE id = ?',
                ['completed', id],
                (err) => err ? reject(err) : resolve()
            );
        });
    }

    async getTransactionMoves(transactionId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT source_path, target_path FROM file_moves WHERE transaction_id = ? ORDER BY id DESC',
                [transactionId],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });
    }

    async rollback(transactionId) {
        const moves = await this.getTransactionMoves(transactionId);

        // We must undo them in reverse order, which the SQL query already ensures using ORDER BY id DESC
        for (const move of moves) {
            try {
                // Attempt to move it back
                await fs.rename(move.target_path, move.source_path);
            } catch (e) {
                console.error(`Failed to rollback from ${move.target_path} to ${move.source_path}:`, e);
            }
        }

        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE transactions SET status = ? WHERE id = ?',
                ['rolled_back', transactionId],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
}
