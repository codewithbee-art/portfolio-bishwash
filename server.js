require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { initialize } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render's load balancer
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

// Rate limiting configurations
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'POST' // Only rate limit POST requests
});

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 contact form submissions per hour
    message: 'Too many contact submissions, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'POST'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 API requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET' // Don't rate limit safe GET requests
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

// Session setup
app.use(session({
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
        sameSite: 'Strict', // CSRF protection
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
        process.env.ALLOWED_ORIGIN
    ].filter(Boolean);
    
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

// Initialize database
initialize();

// Apply rate limiting to specific routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/request-password-reset', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/contact', contactLimiter);

// Apply general API rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/content', require('./api/content'));
app.use('/api/contact', require('./api/contact'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Admin routes - serve admin files
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Protected admin assets
app.use('/admin', (req, res, next) => {
    // Allow login page and assets
    if (req.path === '/' || req.path === '/login.html' || req.path.startsWith('/css')) {
        return next();
    }
    // Check auth for other admin pages
    if (!req.session.isAdmin) {
        return res.redirect('/admin');
    }
    next();
});

// Blog routes
app.get('/blogs', (req, res) => {
    res.sendFile(path.join(__dirname, 'blog-list.html'));
});

app.get('/blog/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'blog-detail.html'));
});

// Projects routes
app.get('/projects', (req, res) => {
    res.redirect('/projects-list');
});

app.get('/projects-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'projects-list.html'));
});

// Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
    const { db } = require('./database/db');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
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

// Serve 404 page for unknown routes
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Error handling
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Startup checks
const startServer = () => {
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

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin`);
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.warn('\u26a0\ufe0f  Email notifications disabled (GMAIL_USER / GMAIL_APP_PASSWORD not set)');
        }
    });
};

startServer();
