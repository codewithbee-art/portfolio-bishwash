const express = require('express');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/db');

// Admin credentials from environment variables (initial values only — DB takes priority)
const ENV_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ENV_PASSWORD = process.env.ADMIN_PASSWORD || null;

// Dynamic admin username: DB first, fallback to .env
async function getAdminUsername() {
    const dbUsername = await getDbSetting('admin_username');
    return dbUsername || ENV_USERNAME;
}

// In-memory store for password reset tokens
const resetTokens = new Map();

// Clean up expired reset tokens every 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, token] of resetTokens.entries()) {
        if (token.expiresAt < now || token.used) {
            resetTokens.delete(key);
        }
    }
}, 15 * 60 * 1000);

// Dynamic SMTP: reads from DB first, falls back to .env
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

// --- Password persistence helpers ---
function getDbSetting(key) {
    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.value : null);
        });
    });
}

function setDbSetting(key, value) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now")) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime("now")',
            [key, value],
            (err) => err ? reject(err) : resolve()
        );
    });
}

// Password hash — loaded from DB on startup, falls back to env var
let hashedPassword = null;
const initializeHashedPassword = async () => {
    try {
        // 1) Check database for a previously saved hash
        const dbHash = await getDbSetting('admin_password_hash');
        if (dbHash) {
            hashedPassword = dbHash;
            console.log('✓ Admin password loaded from database');
            return;
        }

        // 2) Fall back to .env password
        if (!ENV_PASSWORD) {
            console.error('⚠️  WARNING: ADMIN_PASSWORD not set in .env — using insecure default. Change before deploying!');
            hashedPassword = await bcryptjs.hash('changeme', 10);
        } else if (ENV_PASSWORD.startsWith('$2')) {
            hashedPassword = ENV_PASSWORD;
        } else {
            hashedPassword = await bcryptjs.hash(ENV_PASSWORD, 10);
        }

        // Persist initial hash to DB so future changes are durable
        await setDbSetting('admin_password_hash', hashedPassword);
    } catch (err) {
        console.error('Error initializing password:', err);
        process.exit(1);
    }
};

// Initialize credentials on module load
const initializeCredentials = async () => {
    await initializeHashedPassword();
    // Persist initial username to DB if not already there
    const dbUsername = await getDbSetting('admin_username');
    if (!dbUsername) {
        await setDbSetting('admin_username', ENV_USERNAME);
    }
};
initializeCredentials();

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const adminUsername = await getAdminUsername();
    
    if (username !== adminUsername) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    try {
        const isValid = await bcryptjs.compare(password, hashedPassword);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        req.session.isAdmin = true;
        req.session.username = username;
        
        res.json({ success: true, message: 'Logged in successfully' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication error' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check auth status
router.get('/check', (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAdmin });
});

// Request password reset
router.post('/request-password-reset', async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    
    const adminUsername = await getAdminUsername();
    if (username !== adminUsername) {
        // Return generic message to prevent username enumeration
        return res.json({ success: true, message: 'If the username exists, a reset code has been sent to the recovery email.' });
    }
    
    try {
        // Generate reset code (8 chars, easy to type)
        const resetCode = Math.random().toString(36).substring(2, 6).toUpperCase() + 
                         Math.random().toString(36).substring(2, 6).toUpperCase();
        const resetToken = uuidv4();
        
        // Store token with expiration (15 minutes)
        resetTokens.set(resetToken, {
            code: resetCode,
            username: username,
            createdAt: Date.now(),
            expiresAt: Date.now() + (15 * 60 * 1000),
            used: false
        });
        
        // Build transporter dynamically from DB/env
        const mailer = await getTransporter();
        const smtp = await getSmtpConfig();
        const recoveryEmail = await getDbSetting('recovery_email');
        const recipientEmail = recoveryEmail || (smtp ? smtp.user : null);

        if (mailer && recipientEmail) {
            try {
                const maskedEmail = recipientEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');
                await mailer.sendMail({
                    from: smtp.user,
                    to: recipientEmail,
                    subject: 'Admin Password Reset Code',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #111118; color: #ffffff; border-radius: 12px;">
                            <h2 style="color: #00d4aa; margin-bottom: 16px;">Password Reset Request</h2>
                            <p style="color: #9ca3af;">A password reset was requested for the admin panel. Use the code below to set a new password:</p>
                            <div style="background: #0a0a0f; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #00d4aa;">
                                <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #00d4aa; font-family: monospace;">${resetCode}</span>
                            </div>
                            <p style="color: #6b7280; font-size: 13px;">This code expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>
                        </div>
                    `
                });
                console.log(`🔐 Password reset code sent to ${maskedEmail}`);
                res.json({ 
                    success: true, 
                    emailSent: true,
                    maskedEmail: maskedEmail,
                    message: `Reset code sent to ${maskedEmail}`
                });
            } catch (emailErr) {
                console.error('Failed to send reset email:', emailErr);
                return res.status(500).json({ error: 'Failed to send reset email. Check SMTP settings in Admin → Settings.' });
            }
        } else {
            const reason = !mailer 
                ? 'SMTP not configured. Go to Admin → Settings → Email Configuration.' 
                : 'No recovery email set. Go to Admin → Settings → Email Configuration.';
            console.warn(`⚠️  Password reset requested but email cannot be sent: ${reason}`);
            return res.status(500).json({ error: `Cannot send reset email. ${reason}` });
        }
    } catch (err) {
        console.error('Password reset request error:', err);
        res.status(500).json({ error: 'Error processing request' });
    }
});

// Reset password with code
router.post('/reset-password', async (req, res) => {
    const { resetCode, newPassword } = req.body;
    
    if (!resetCode || !newPassword) {
        return res.status(400).json({ error: 'Reset code and new password are required' });
    }
    
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    try {
        // Find the token by code
        let foundToken = null;
        let foundKey = null;
        
        for (const [key, token] of resetTokens.entries()) {
            if (token.code === resetCode && !token.used && token.expiresAt > Date.now()) {
                foundToken = token;
                foundKey = key;
                break;
            }
        }
        
        if (!foundToken) {
            return res.status(401).json({ error: 'Invalid or expired reset code' });
        }
        
        // Hash and update password
        hashedPassword = await bcryptjs.hash(newPassword, 10);
        await setDbSetting('admin_password_hash', hashedPassword);
        
        // Mark token as used
        foundToken.used = true;
        resetTokens.set(foundKey, foundToken);
        
        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ error: 'Error resetting password' });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Passwords are required' });
    }
    
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
    }
    
    try {
        // Verify current password
        const isValid = await bcryptjs.compare(currentPassword, hashedPassword);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password and update — persist to database
        hashedPassword = await bcryptjs.hash(newPassword, 10);
        await setDbSetting('admin_password_hash', hashedPassword);
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ error: 'Error changing password' });
    }
});

// Change username (admin only)
router.post('/change-username', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newUsername } = req.body;

    if (!currentPassword || !newUsername) {
        return res.status(400).json({ error: 'Current password and new username are required' });
    }

    const trimmed = newUsername.trim();
    if (trimmed.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (trimmed.length > 50) {
        return res.status(400).json({ error: 'Username must be 50 characters or less' });
    }
    if (!/^[a-zA-Z0-9._@-]+$/.test(trimmed)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, dots, hyphens, underscores, and @' });
    }

    try {
        const isValid = await bcryptjs.compare(currentPassword, hashedPassword);
        if (!isValid) {
            return res.status(401).json({ error: 'Password is incorrect' });
        }

        await setDbSetting('admin_username', trimmed);
        req.session.username = trimmed;
        res.json({ success: true, message: `Username changed to "${trimmed}"` });
    } catch (err) {
        console.error('Username change error:', err);
        res.status(500).json({ error: 'Error changing username' });
    }
});

// Get current admin info (admin only)
router.get('/admin-info', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const username = await getAdminUsername();
    res.json({ username });
});

// Test email configuration (admin only)
router.post('/test-email', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const mailer = await getTransporter();
        const smtp = await getSmtpConfig();
        if (!mailer || !smtp) {
            return res.status(400).json({ error: 'SMTP not configured. Enter your Gmail address and App Password first.' });
        }

        const recoveryEmail = await getDbSetting('recovery_email');
        const recipient = recoveryEmail || smtp.user;

        await mailer.sendMail({
            from: smtp.user,
            to: recipient,
            subject: 'Test Email - Admin Panel',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #111118; color: #ffffff; border-radius: 12px;">
                    <h2 style="color: #00d4aa; margin-bottom: 16px;">✓ Email Configuration Working</h2>
                    <p style="color: #9ca3af;">This is a test email from your admin panel. If you received this, your SMTP settings are configured correctly.</p>
                    <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">Sent from: ${smtp.user}<br>Sent to: ${recipient}</p>
                </div>
            `
        });

        const masked = recipient.replace(/(.{2})(.*)(@.*)/, '$1***$3');
        res.json({ success: true, message: `Test email sent to ${masked}` });
    } catch (err) {
        console.error('Test email failed:', err);
        res.status(500).json({ error: `Email failed: ${err.message}` });
    }
});

module.exports = router;
