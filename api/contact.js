const express = require('express');
const nodemailer = require('nodemailer');
const escapeHtml = require('escape-html');
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/db');
const EmailVerificationService = require('./email-verification');
const DeviceProtection = require('./device-protection');
const router = express.Router();

// Initialize services
const emailVerifier = new EmailVerificationService();
const deviceProtection = new DeviceProtection();

// Input validation constants
const MAX_MESSAGE_LENGTH = 5000;
const MAX_SUBJECT_LENGTH = 200;
const MAX_NAME_LENGTH = 100;

// Dynamic SMTP helpers: reads from DB first, falls back to .env
function getDbSetting(key) {
    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.value : null);
        });
    });
}

async function getSmtpConfig() {
    const dbUser = await getDbSetting('smtp_user');
    const dbPass = await getDbSetting('smtp_app_password');
    const user = dbUser || process.env.GMAIL_USER;
    const pass = dbPass || process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) return null;
    return { user, pass };
}

async function getTransporter() {
    const smtp = await getSmtpConfig();
    if (!smtp) return null;
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtp.user, pass: smtp.pass }
    });
}

const escapeCsv = (value) => {
    const safe = String(value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
};

// Enhanced email validation
function validateEmail(email) {
    const disposableDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
        'mailinator.com', 'yopmail.com', 'temp-mail.org',
        'throwaway.email', 'maildrop.cc', 'tempmail.de',
        '10minutemail.co', 'temp-mail.org', 'yopmail.net',
        'maildrop.cc', '20minutemail.com', 'guerrillamail.de'
    ];
    
    const suspiciousPatterns = [
        /^[a-z]{1,2}\d{3,}@/, // 1-2 letters + 3+ numbers@ (like ab123@)
        /test123|demo123|fake123|sample123/i, // specific test patterns
        /^test@|^demo@|^fake@|^sample@|^random@/i // exact suspicious usernames (noreply is allowed)
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    
    // Check for disposable email
    if (disposableDomains.some(disposable => domain.includes(disposable))) {
        return { valid: false, message: 'Please use a permanent email address (no disposable emails allowed)' };
    }
    
    // Check for suspicious patterns (more specific now)
    if (suspiciousPatterns.some(pattern => pattern.test(email))) {
        return { valid: false, message: 'Please use a real email address' };
    }
    
    return { valid: true };
}

// Test endpoint to verify server is running updated code
router.get('/test', (req, res) => {
    console.log('🔍 Test endpoint called - server is running updated code!');
    res.json({ 
        message: 'Contact API is working', 
        timestamp: new Date().toISOString(),
        validationEnabled: true
    });
});

// Submit contact form (public)
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Debug logging for production (can be removed later)
        console.log('Contact submission:', { 
            name: name?.substring(0, 20), 
            email: email?.substring(0, 20), 
            hasSubject: !!subject, 
            messageLength: message?.length 
        });
        
        // Input validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                error: 'Name, email, and message are required',
                details: { name: !!name, email: !!email, message: !!message }
            });
        }
        
        // Device protection check
        const protectionResult = await deviceProtection.checkDevice(req);
        
        if (!protectionResult.allowed) {
            if (protectionResult.action === 'block') {
                return res.status(429).json({ 
                    error: protectionResult.message,
                    action: 'block',
                    retryAfter: protectionResult.retryAfter
                });
            }
            
            if (protectionResult.action === 'captcha') {
                return res.status(429).json({ 
                    error: protectionResult.message,
                    action: 'captcha',
                    captchaRequired: true
                });
            }
        }
        
        // Basic validation
        if (typeof name !== 'string' || name.trim().length === 0 || name.length > MAX_NAME_LENGTH) {
            return res.status(400).json({ error: 'Name must be between 1 and ' + MAX_NAME_LENGTH + ' characters' });
        }
        
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }
        
        // Professional email verification
        try {
            const verificationResult = await emailVerifier.verifyEmail(email);
            
            if (!verificationResult.valid) {
                return res.status(400).json({ 
                    error: 'Please use a real, permanent email address. Disposable or fake emails are not allowed.',
                    reason: verificationResult.reason,
                    method: verificationResult.method
                });
            }
        } catch (error) {
            console.error('Email verification service error:', error);
            // Continue with basic validation if service fails
        }
        
        if (typeof message !== 'string' || message.trim().length === 0 || message.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ error: 'Message must be between 1 and ' + MAX_MESSAGE_LENGTH + ' characters' });
        }
        
        if (subject && (typeof subject !== 'string' || subject.length > MAX_SUBJECT_LENGTH)) {
            return res.status(400).json({ error: 'Subject must be less than ' + MAX_SUBJECT_LENGTH + ' characters' });
        }
        
        // Trim inputs
        const trimmedName = name.trim();
        const trimmedEmail = email.toLowerCase().trim();
        const trimmedSubject = subject ? subject.trim() : '';
        const trimmedMessage = message.trim();
        
        // Generate unique ID
        const messageId = uuidv4();
        
        // Save to database
        db.run(
            `INSERT INTO messages (id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [messageId, trimmedName, trimmedEmail, trimmedSubject, trimmedMessage, new Date().toISOString()],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to save message' });
                }
                
                // Send email notification if SMTP is configured
                getTransporter().then(mailer => {
                    return getSmtpConfig().then(smtp => {
                        if (mailer && smtp) {
                            return mailer.sendMail({
                                from: `"${trimmedName}" <${smtp.user}>`,
                                to: smtp.user,
                                replyTo: trimmedEmail,
                                subject: `New Contact: ${trimmedSubject || 'No Subject'}`,
                                html: `
                                    <h2>New Contact Form Submission</h2>
                                    <p><strong>From:</strong> ${trimmedName} (${trimmedEmail})</p>
                                    <p><strong>Subject:</strong> ${trimmedSubject || 'No Subject'}</p>
                                    <p><strong>Message:</strong></p>
                                    <p>${escapeHtml(trimmedMessage).replace(/\n/g, '<br>')}</p>
                                    <hr>
                                    <p>View in admin panel: <a href="${process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`}/admin/dashboard">Open Dashboard</a></p>
                                `
                            });
                        }
                    });
                }).catch(emailErr => {
                    console.error('Email error:', emailErr);
                    // Don't fail the request if email fails
                }).then(() => {
                    // Record successful submission for device protection
                    const fingerprint = deviceProtection.getDeviceFingerprint(req);
                    deviceProtection.recordSubmission(fingerprint);
                    
                    // Include warning info if applicable
                    const responseData = { success: true, message: 'Message sent successfully' };
                    if (protectionResult.action === 'warning') {
                        responseData.warning = protectionResult.message;
                    }
                    
                    res.json(responseData);
                });
            }
        );
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all messages (admin only)
router.get('/messages', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Download all messages as CSV (admin only, Excel-compatible)
router.get('/messages/export', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const header = ['Name', 'Email', 'Subject', 'Message', 'Read', 'Created At'];
        const lines = [header.map(escapeCsv).join(',')];

        rows.forEach((row) => {
            lines.push([
                row.name,
                row.email,
                row.subject,
                row.message,
                row.read ? 'Yes' : 'No',
                row.created_at
            ].map(escapeCsv).join(','));
        });

        const csv = lines.join('\n');
        const filename = `messages-${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(`\uFEFF${csv}`);
    });
});

// Mark message as read (admin only)
router.patch('/messages/:id/read', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.run(
        'UPDATE messages SET read = 1 WHERE id = ?',
        [req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

// Delete message (admin only)
router.delete('/messages/:id', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.run('DELETE FROM messages WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

module.exports = router;
