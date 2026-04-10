const Database = require('sqlite3').verbose();
const path = require('path');

/**
 * SQLite-backed store for express-rate-limit.
 * Persists rate limit counters across server restarts.
 */
class SQLiteRateLimitStore {
    constructor(options = {}) {
        const dbPath = options.dbPath || path.join(__dirname, '..', 'database', 'ratelimit.db');
        this.prefix = options.prefix || 'rl:';
        this.db = new Database.Database(dbPath);

        // Ready promise — all operations wait for table to exist
        this._ready = new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('PRAGMA journal_mode=WAL');
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS rate_limits (
                        key TEXT PRIMARY KEY,
                        hits INTEGER NOT NULL DEFAULT 0,
                        expires_at INTEGER NOT NULL
                    )
                `, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // Clean up expired entries periodically (every 5 minutes)
        this._cleanupInterval = setInterval(() => this._cleanup(), 5 * 60 * 1000);
        this._ready.then(() => this._cleanup());
    }

    /**
     * Called by express-rate-limit to initialise the store.
     * @param {Object} options - The options used to setup the rate limiter
     */
    init(options) {
        this.windowMs = options.windowMs;
    }

    /**
     * Increment the hit counter for a given key.
     * @param {string} key - The identifier for the client
     * @returns {Promise<{totalHits: number, resetTime: Date}>}
     */
    async increment(key) {
        await this._ready;
        const prefixedKey = this.prefix + key;
        const now = Date.now();
        const resetTime = new Date(now + this.windowMs);
        const expiresAt = resetTime.getTime();

        return new Promise((resolve, reject) => {
            // Try to get existing record
            this.db.get(
                'SELECT hits, expires_at FROM rate_limits WHERE key = ?',
                [prefixedKey],
                (err, row) => {
                    if (err) return reject(err);

                    if (row && row.expires_at > now) {
                        // Existing window — increment
                        this.db.run(
                            'UPDATE rate_limits SET hits = hits + 1 WHERE key = ?',
                            [prefixedKey],
                            (err2) => {
                                if (err2) return reject(err2);
                                resolve({
                                    totalHits: row.hits + 1,
                                    resetTime: new Date(row.expires_at)
                                });
                            }
                        );
                    } else {
                        // New window or expired — insert/replace with 1 hit
                        this.db.run(
                            'INSERT OR REPLACE INTO rate_limits (key, hits, expires_at) VALUES (?, 1, ?)',
                            [prefixedKey, expiresAt],
                            (err2) => {
                                if (err2) return reject(err2);
                                resolve({
                                    totalHits: 1,
                                    resetTime
                                });
                            }
                        );
                    }
                }
            );
        });
    }

    /**
     * Decrement the hit counter for a given key.
     * @param {string} key - The identifier for the client
     */
    async decrement(key) {
        await this._ready;
        const prefixedKey = this.prefix + key;
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE rate_limits SET hits = MAX(0, hits - 1) WHERE key = ?',
                [prefixedKey],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    /**
     * Reset the hit counter for a given key.
     * @param {string} key - The identifier for the client
     */
    async resetKey(key) {
        await this._ready;
        const prefixedKey = this.prefix + key;
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM rate_limits WHERE key = ?',
                [prefixedKey],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    /**
     * Reset all hit counters.
     */
    async resetAll() {
        await this._ready;
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM rate_limits', (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    /**
     * Remove expired entries from the database.
     */
    _cleanup() {
        this.db.run('DELETE FROM rate_limits WHERE expires_at <= ?', [Date.now()]);
    }

    /**
     * Close the database connection and stop cleanup interval.
     */
    close() {
        clearInterval(this._cleanupInterval);
        this.db.close();
    }
}

module.exports = SQLiteRateLimitStore;
