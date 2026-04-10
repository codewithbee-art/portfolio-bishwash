const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'portfolio.db');
console.log('Database path:', dbPath);
console.log('Database exists:', fs.existsSync(dbPath));

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fatal: Cannot open database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});

// Promisified helpers for sequential async operations
const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve(this);
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
    });
});

// Run a column migration safely — only adds the column if it doesn't exist
const addColumnIfMissing = async (table, column, definition) => {
    const row = await get(`PRAGMA table_info(${table})`);
    // Check all columns
    const cols = await new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
    const exists = cols.some(c => c.name === column);
    if (!exists) {
        await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`  ✓ Migration: added ${column} to ${table}`);
    }
};

// Main async initialize — returns a Promise, server MUST await this
const initialize = async () => {
    // Enable WAL mode for crash safety and better concurrency
    await run('PRAGMA journal_mode = WAL');
    await run('PRAGMA foreign_keys = ON');
    await run('PRAGMA encoding = "UTF-8"');
    // Reduce chance of corruption on OS crash
    await run('PRAGMA synchronous = NORMAL');

    // ── Core tables ───────────────────────────────────────────────────────

    await run(`CREATE TABLE IF NOT EXISTS experience (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        period TEXT NOT NULL,
        location TEXT,
        description TEXT,
        badge TEXT DEFAULT 'work',
        order_num INTEGER DEFAULT 0,
        hidden INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS education (
        id TEXT PRIMARY KEY,
        institution TEXT NOT NULL,
        degree TEXT NOT NULL,
        period TEXT NOT NULL,
        location TEXT,
        description TEXT,
        badge TEXT DEFAULT 'education',
        order_num INTEGER DEFAULT 0,
        hidden INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        image_url TEXT,
        project_url TEXT,
        github_url TEXT,
        featured INTEGER DEFAULT 0,
        order_num INTEGER DEFAULT 0,
        hidden INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS blog (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        excerpt TEXT,
        tags TEXT,
        image_url TEXT,
        read_time INTEGER DEFAULT 5,
        featured INTEGER DEFAULT 0,
        published INTEGER DEFAULT 0,
        order_num INTEGER DEFAULT 0,
        hidden INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        skills TEXT,
        hidden INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS reset_tokens (
        token TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        username TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
    )`);

    await run(`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Schema migrations (safe, idempotent, run every boot) ─────────────
    await addColumnIfMissing('experience', 'location', 'TEXT');
    await addColumnIfMissing('education',  'location', 'TEXT');
    await addColumnIfMissing('blog',       'author',   "TEXT DEFAULT 'Bishwash Acharya'");

    // ── Seed default settings only on first boot ──────────────────────────
    const row = await get('SELECT COUNT(*) as count FROM settings');
    if (row.count === 0) {
        console.log('First boot: inserting default settings...');
        const defaults = [
            ['hero_name',    'Bishwash'],
            ['hero_lastname', 'Acharya'],
            ['hero_tagline', 'Building clean, clear, and genuinely useful digital experiences.'],
            ['hero_roles',   'Designer, Developer, Data/Business Analyst, Content Creator'],
            ['social_linkedin',  '#'],
            ['social_github',    '#'],
            ['social_youtube',   '#'],
            ['social_twitter',   '#'],
            ['social_instagram', '#']
        ];
        for (const [key, value] of defaults) {
            await run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
        }
    } else {
        console.log('Database contains existing data, preserving...');
    }

    console.log('Database initialized successfully');
};

module.exports = { db, initialize };
