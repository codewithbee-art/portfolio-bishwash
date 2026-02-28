const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'portfolio.db');
const db = new sqlite3.Database(dbPath);

const initialize = () => {
    db.serialize(() => {
        // Experience table
        db.run(`CREATE TABLE IF NOT EXISTS experience (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            role TEXT NOT NULL,
            period TEXT NOT NULL,
            description TEXT,
            badge TEXT DEFAULT 'work',
            order_num INTEGER DEFAULT 0,
            hidden INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Education table
        db.run(`CREATE TABLE IF NOT EXISTS education (
            id TEXT PRIMARY KEY,
            institution TEXT NOT NULL,
            degree TEXT NOT NULL,
            period TEXT NOT NULL,
            description TEXT,
            badge TEXT DEFAULT 'education',
            order_num INTEGER DEFAULT 0,
            hidden INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Projects table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            tags TEXT, -- JSON array
            image_url TEXT,
            project_url TEXT,
            github_url TEXT,
            featured INTEGER DEFAULT 0,
            order_num INTEGER DEFAULT 0,
            hidden INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Blog posts table
        db.run(`CREATE TABLE IF NOT EXISTS blog (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            excerpt TEXT,
            tags TEXT, -- JSON array
            image_url TEXT,
            read_time INTEGER DEFAULT 5,
            featured INTEGER DEFAULT 0,
            published INTEGER DEFAULT 0,
            order_num INTEGER DEFAULT 0,
            hidden INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Skills table
        db.run(`CREATE TABLE IF NOT EXISTS skills (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            skills TEXT, -- JSON array of skills
            hidden INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Site settings table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Contact messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insert default settings if not exists
        db.get("SELECT COUNT(*) as count FROM settings WHERE key = 'hero_name'", (err, row) => {
            if (err) return console.error(err);
            if (row.count === 0) {
                const defaults = [
                    ['hero_name', 'Bishwash'],
                    ['hero_lastname', 'Acharya'],
                    ['hero_tagline', 'Building clean, clear, and genuinely useful digital experiences.'],
                    ['hero_roles', 'Designer, Developer, Data/Business Analyst, Content Creator']
                ];
                const stmt = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
                defaults.forEach(([key, value]) => stmt.run(key, value));
                stmt.finalize();
            }
        });

        console.log('Database initialized successfully');
    });
};

module.exports = {
    db,
    initialize
};
