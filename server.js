require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const { initialize } = require('./database/db');
const SQLiteRateLimitStore = require('./api/rate-limit-store');

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PATH = process.env.ADMIN_PATH || '/admin';

// Trust proxy only in production (behind Render/Heroku reverse proxy)
// In dev, disable to prevent IP spoofing via X-Forwarded-For headers
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);

    // Redirect HTTP → HTTPS in production
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            return res.redirect(301, `https://${req.header('host')}${req.url}`);
        }
        next();
    });
}

// Generate a fresh CSP nonce for every request
app.use((req, res, next) => {
    res.locals.cspNonce = require('crypto').randomBytes(16).toString('base64');
    next();
});

// Security headers — scriptSrc uses per-request nonce (no unsafe-inline)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`, "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            scriptSrcAttr: ["'unsafe-inline'"], // Required by admin dashboard onclick handlers (admin-only, auth-protected)
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Helper: read an HTML file, inject nonce onto inline <script> tags, and send it.
// Matches <script> and <script type="..."> but skips ld+json and already-nonced tags.
function sendNoncedHtml(res, filePath) {
    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading page');
        const nonce = res.locals.cspNonce;
        // Replace opening <script> tags that have no nonce and no src (inline scripts)
        // and are not JSON-LD blocks
        const injected = html.replace(/<script([ \t][^>]*)?>(?!--)/g, (match, attrs) => {
            attrs = attrs || '';
            if (attrs.includes('nonce=')) return match;
            if (attrs.includes('application/ld+json')) return match;
            if (attrs.includes(' src=')) return match;
            return `<script${attrs} nonce="${nonce}">`;
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(injected);
    });
}

// CORS — restrictive in production, permissive in development
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGIN || false
        : [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/],
    credentials: true
}));

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve index.html explicitly so the nonce gets injected before static middleware claims it
app.get('/', (req, res) => {
    sendNoncedHtml(res, path.join(__dirname, 'index.html'));
});

// Serve only public-facing directories (never the project root — that exposes server source code)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Rate limiting configurations
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: new SQLiteRateLimitStore({ prefix: 'auth:' }),
    skip: (req) => req.method !== 'POST' // Only rate limit POST requests
});

// Contact form rate limiting — 5 submissions per hour per IP
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Too many messages sent. Please try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: new SQLiteRateLimitStore({ prefix: 'contact:' }),
    skip: (req) => req.method !== 'POST'
});

// Password reset code verification — stricter limit (3 attempts per 15 min)
const resetCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: 'Too many reset attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: new SQLiteRateLimitStore({ prefix: 'resetcode:' }),
    skip: (req) => req.method !== 'POST'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 API requests per 15 minutes (very lenient)
    standardHeaders: true,
    legacyHeaders: false,
    store: new SQLiteRateLimitStore({ prefix: 'api:' }),
    skip: (req) => req.method === 'GET' // Skip GET requests only
});

// Upload directory — use UPLOAD_PATH env var for persistent disk (e.g. Render), fallback to local ./uploads
const UPLOAD_DIR = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = UPLOAD_DIR;
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Use mimetype-derived extension, never trust originalname for extension
        const mimeToExt = {
            'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png',
            'image/gif': '.gif', 'image/webp': '.webp',
            'application/pdf': '.pdf', 'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
        };
        const safeExt = mimeToExt[file.mimetype] || '.bin';
        cb(null, file.fieldname + '-' + uniqueSuffix + safeExt);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const isImage = /jpeg|jpg|png|gif|webp/.test(file.mimetype) && ['.jpeg', '.jpg', '.png', '.gif', '.webp'].includes(ext);
        const isDocument = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ].includes(file.mimetype) && ['.pdf', '.doc', '.docx'].includes(ext);
        
        if (isImage || isDocument) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (jpeg, jpg, png, gif, webp) or resume documents (pdf, doc, docx) are allowed'));
        }
    }
});

// Session setup — SQLite-backed store so sessions survive server restarts
app.use(session({
    name: '_sid', // Custom cookie name — avoids default 'connect.sid' which fingerprints Express
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: path.join(__dirname, 'database'),
        concurrentDB: true
    }),
    secret: process.env.SESSION_SECRET || (() => {
        console.error('⚠️ ERROR: SESSION_SECRET environment variable is not set!');
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
        return 'dev-secret-change-in-production';
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent JavaScript from accessing the session cookie
        sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax', // Lax in dev so proxied previews work
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// CSRF protection middleware for API endpoints
// Checks that requests come from same origin (Origin/Referer header verification)
const csrfProtection = (req, res, next) => {
    // GET requests don't need CSRF protection
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
    }
    
    // For non-GET requests, verify origin
    const origin = req.get('origin');
    const referer = req.get('referer');
    const host = req.get('host');
    const allowedOrigins = [
        `http://${host}`,
        `https://${host}`,
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5500',
        process.env.ALLOWED_ORIGIN
    ].filter(Boolean);

    // Allow any localhost or 127.0.0.1 origin in development
    if (process.env.NODE_ENV !== 'production' && origin) {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return next();
        }
    }
    
    // In production, only allow HTTPS
    if (process.env.NODE_ENV === 'production') {
        if (!origin || !origin.startsWith('https://')) {
            return res.status(403).json({ error: 'CSRF validation failed' });
        }
    }
    
    // If origin header is present, check it against allowed list
    if (origin) {
        if (allowedOrigins.includes(origin)) {
            return next();
        }
        return res.status(403).json({ error: 'CSRF validation failed' });
    }
    
    // If no origin but referer is present, check referer
    if (referer) {
        try {
            const refererOrigin = new URL(referer).origin;
            if (allowedOrigins.includes(refererOrigin)) {
                return next();
            }
            return res.status(403).json({ error: 'CSRF validation failed' });
        } catch (e) {
            return res.status(403).json({ error: 'CSRF validation failed' });
        }
    }
    
    // No origin or referer — allow in development, block in production
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'CSRF validation failed' });
    }
    
    next();
};

app.use('/api', csrfProtection);

// Apply rate limiting to sensitive routes only
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/request-password-reset', authLimiter);
app.use('/api/auth/reset-password', resetCodeLimiter);
// Apply contact form rate limiting
app.use('/api/contact', contactLimiter);

// Apply general API rate limiting
app.use('/api', apiLimiter);

// API Routes
const authRouter = require('./api/auth');
app.use('/api/auth', authRouter);
app.use('/api/content', require('./api/content'));
app.use('/api/contact', require('./api/contact'));

// Serve uploaded files with fallback
// Block direct access to sensitive document types — force download via /download/cv
app.use('/uploads', (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    if (['.pdf', '.doc', '.docx'].includes(ext)) {
        return res.status(403).send('Direct access to documents is not allowed');
    }
    next();
}, express.static(UPLOAD_DIR, {
    maxAge: '1d', // Cache for 1 day
    setHeaders: (res, filePath) => {
        // Add fallback for missing images
        if (filePath.endsWith('.jpg') || filePath.endsWith('.png') || filePath.endsWith('.webp')) {
            res.on('finish', () => {
                if (res.statusCode === 404) {
                    console.log('Missing uploaded file:', filePath);
                }
            });
        }
    }
}));

// CV download route - forces browser to download rather than open inline
app.get('/download/cv', (req, res) => {
    const { db } = require('./database/db');
    db.get("SELECT value FROM settings WHERE key = 'hero_cv_url'", [], (err, row) => {
        if (err || !row || !row.value) {
            return res.status(404).send('CV not available');
        }
        const cvUrl = row.value;
        // cvUrl is a relative path like /uploads/filename.pdf
        const cvPath = path.resolve(UPLOAD_DIR, path.basename(cvUrl));
        // Prevent directory traversal — resolved path must stay inside the uploads folder
        const uploadsDir = path.resolve(UPLOAD_DIR);
        if (!cvPath.startsWith(uploadsDir + path.sep) && cvPath !== uploadsDir) {
            return res.status(403).send('Invalid CV path');
        }
        if (!fs.existsSync(cvPath)) {
            return res.status(404).send('CV file not found');
        }
        const ext = path.extname(cvPath) || '.pdf';
        const filename = `Bishwash_Acharya_Data_Science_Resume${ext}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.sendFile(cvPath);
    });
});

// File upload routes - PROTECTED: admin only
app.post('/api/upload', (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }
    next();
}, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// Alias for admin upload (same handler)
app.post('/api/upload/admin', (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
});

// Admin routes - serve admin files (path is configurable via ADMIN_PATH env var)
app.get(ADMIN_PATH, (req, res) => {
    sendNoncedHtml(res, path.join(__dirname, 'admin', 'login.html'));
});

app.get(`${ADMIN_PATH}/dashboard`, (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect(ADMIN_PATH);
    }
    sendNoncedHtml(res, path.join(__dirname, 'admin', 'dashboard.html'));
});

// Protected admin assets
app.use(ADMIN_PATH, (req, res, next) => {
    // Allow login page and assets
    if (req.path === '/' || req.path === '/login.html' || req.path.startsWith('/css')) {
        return next();
    }
    // Check auth for other admin pages
    if (!req.session.isAdmin) {
        return res.redirect(ADMIN_PATH);
    }
    next();
});

// Redirect /favicon.ico to the SVG favicon to prevent 404s
app.get('/favicon.ico', (req, res) => res.redirect(301, '/assets/favicon.svg'));

// Blog routes
app.get('/blogs', (req, res) => {
    sendNoncedHtml(res, path.join(__dirname, 'blog-list.html'));
});

app.get('/blog/:id', (req, res) => {
    sendNoncedHtml(res, path.join(__dirname, 'blog-detail.html'));
});

// Projects routes
app.get('/projects', (req, res) => {
    res.redirect('/projects-list');
});

app.get('/projects-list', (req, res) => {
    sendNoncedHtml(res, path.join(__dirname, 'projects-list.html'));
});

// Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
    const { db } = require('./database/db');
    const proto = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
    const baseUrl = `${proto}://${req.get('host')}`;
    
    db.all(`SELECT id, created_at FROM blog WHERE hidden = 0 AND published = 1 ORDER BY created_at DESC`, [], (err, posts) => {
        const blogUrls = (posts || []).map(p => {
            const lastmod = new Date(p.created_at).toISOString().split('T')[0];
            return `  <url><loc>${baseUrl}/blog/${p.id}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
        }).join('\n');

        const today = new Date().toISOString().split('T')[0];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/projects-list</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/blogs</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
${blogUrls}
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(xml);
    });
});

// Fallback for missing uploaded images — must be before the wildcard GET* route
app.use('/uploads/:filename', (req, res, next) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    if (fs.existsSync(filePath)) {
        return next();
    }
    
    const placeholderPath = path.join(__dirname, 'assets', 'projects', 'placeholder.svg');
    if (fs.existsSync(placeholderPath)) {
        res.sendFile(placeholderPath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Serve 404 page for unknown routes
app.get('*', (req, res) => {
    res.status(404);
    sendNoncedHtml(res, path.join(__dirname, '404.html'));
});

// Error handling — JSON for API routes, user-friendly HTML for browser requests
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    console.error(err.stack);
    const isApiRequest = req.path.startsWith('/api/');
    if (isApiRequest) {
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
    res.status(500).send(`<!DOCTYPE html><html><head><title>Server Error</title>
        <style>body{font-family:sans-serif;background:#0a0a0f;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
        .box{text-align:center;padding:40px;} h1{color:#ef4444;font-size:2rem;} p{color:#9ca3af;} a{color:#00d4aa;}</style></head>
        <body><div class="box"><h1>500 — Server Error</h1><p>Something went wrong on our end. Please try again later.</p>
        <a href="/">← Back to home</a></div></body></html>`);
});

// SQLite daily backup — copies portfolio.db to database/backups/ keeping last 7
function runDailyBackup() {
    // Use same DB_PATH logic as db.js
    const dbDir = process.env.DB_PATH || path.join(__dirname, 'database');
    const backupDir = path.join(dbDir, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const src = path.join(dbDir, 'portfolio.db');
    const date = new Date().toISOString().slice(0, 10);
    const dest = path.join(backupDir, `portfolio-${date}.db`);

    fs.copyFile(src, dest, (err) => {
        if (err) { console.error('Backup failed:', err.message); return; }
        console.log(`Database backed up to ${dest}`);

        // Prune: keep only the 7 most recent backups
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('portfolio-') && f.endsWith('.db'))
            .sort();
        if (files.length > 7) {
            files.slice(0, files.length - 7).forEach(f => {
                fs.unlink(path.join(backupDir, f), () => {});
            });
        }
    });
}

// Startup — awaits DB and credentials before accepting any requests
const startServer = async () => {
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.SESSION_SECRET) {
            console.error('FATAL: SESSION_SECRET must be set in production');
            process.exit(1);
        }
        if (!process.env.ADMIN_PASSWORD) {
            console.error('FATAL: ADMIN_PASSWORD must be set in production');
            process.exit(1);
        }
    }

    try {
        // 1) Init DB schema and migrations (fully awaited)
        await initialize();

        // 2) Init admin credentials (fully awaited — no race condition)
        await authRouter.initializeCredentials();

        // 3) Only now start accepting requests
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Admin panel: http://localhost:${PORT}${ADMIN_PATH}`);
            if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
                console.warn('\u26a0\ufe0f  Email notifications disabled (GMAIL_USER / GMAIL_APP_PASSWORD not set)');
            }
            // Run backup immediately on start, then every 24 hours
            runDailyBackup();
            setInterval(runDailyBackup, 24 * 60 * 60 * 1000);
        });
    } catch (err) {
        console.error('FATAL: Server failed to start:', err);
        process.exit(1);
    }
};

startServer();
