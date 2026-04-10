// Smart Device-Based Protection System
const crypto = require('crypto');

class DeviceProtection {
    constructor() {
        // In-memory store for device tracking.
        // This resets on server restart, but that's acceptable because:
        // 1. IP-based rate limits are persisted in SQLite via rate-limit-store.js
        // 2. This tracker is a secondary layer for fingerprint-based spam detection
        // 3. For high-traffic production, swap to Redis for persistence.
        this.deviceTracker = new Map();
        
        // Protection thresholds
        this.thresholds = {
            // Per minute limits
            perMinute: 5,        // 5 messages per minute
            perHour: 30,         // 30 messages per hour  
            perDay: 100,         // 100 messages per day
            
            // When to trigger protections
            warningThreshold: 3,   // Show warning after 3 messages in minute
            captchaThreshold: 6,    // Require CAPTCHA after 6 messages in minute
            blockThreshold: 10,     // Block after 10 messages in minute
        };
    }

    // Generate device fingerprint
    getDeviceFingerprint(req) {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || '';
        const acceptLanguage = req.get('Accept-Language') || '';
        const acceptEncoding = req.get('Accept-Encoding') || '';
        
        // Create fingerprint from multiple factors
        const fingerprint = crypto
            .createHash('sha256')
            .update(`${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`)
            .digest('hex');
            
        return fingerprint;
    }

    // Get device tracking data
    getDeviceData(fingerprint) {
        const now = Date.now();
        const data = this.deviceTracker.get(fingerprint) || {
            fingerprint,
            firstSeen: now,
            messages: [],
            warnings: 0,
            captchaRequired: false,
            blocked: false,
            blockExpiry: 0
        };
        
        return data;
    }

    // Clean old message records
    cleanOldMessages(data) {
        const now = Date.now();
        const oneMinute = 60 * 1000;
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Filter messages within time windows
        data.messages = data.messages.filter(timestamp => {
            return timestamp > (now - oneDay);
        });
        
        return data;
    }

    // Count messages in time windows
    countMessages(data) {
        const now = Date.now();
        const oneMinute = 60 * 1000;
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;
        
        return {
            perMinute: data.messages.filter(t => t > (now - oneMinute)).length,
            perHour: data.messages.filter(t => t > (now - oneHour)).length,
            perDay: data.messages.filter(t => t > (now - oneDay)).length
        };
    }

    // Check if device is blocked
    isDeviceBlocked(data) {
        if (data.blocked && Date.now() < data.blockExpiry) {
            return true;
        }
        
        // Reset block if expired
        if (data.blocked && Date.now() >= data.blockExpiry) {
            data.blocked = false;
            data.blockExpiry = 0;
            data.captchaRequired = false;
        }
        
        return false;
    }

    // Main protection check
    async checkDevice(req) {
        const fingerprint = this.getDeviceFingerprint(req);
        let data = this.getDeviceData(fingerprint);
        
        // Clean old messages
        data = this.cleanOldMessages(data);
        
        // Check if blocked
        if (this.isDeviceBlocked(data)) {
            return {
                allowed: false,
                action: 'block',
                message: 'Too many messages. Please try again later.',
                blockExpiry: data.blockExpiry,
                retryAfter: Math.ceil((data.blockExpiry - Date.now()) / 1000)
            };
        }
        
        // Count recent messages
        const counts = this.countMessages(data);
        
        // Check thresholds and determine action
        if (counts.perMinute >= this.thresholds.blockThreshold) {
            // Block device for 15 minutes
            data.blocked = true;
            data.blockExpiry = Date.now() + (15 * 60 * 1000);
            data.captchaRequired = false;
            
            this.deviceTracker.set(fingerprint, data);
            
            return {
                allowed: false,
                action: 'block',
                message: 'Too many messages detected. Please wait 15 minutes before trying again.',
                blockExpiry: data.blockExpiry,
                retryAfter: 900
            };
        }
        
        if (counts.perMinute >= this.thresholds.captchaThreshold) {
            // Require CAPTCHA
            data.captchaRequired = true;
            
            this.deviceTracker.set(fingerprint, data);
            
            return {
                allowed: false,
                action: 'captcha',
                message: 'Please complete the CAPTCHA to continue.',
                captchaRequired: true
            };
        }
        
        if (counts.perMinute >= this.thresholds.warningThreshold) {
            // Show warning but allow
            data.warnings++;
            
            this.deviceTracker.set(fingerprint, data);
            
            return {
                allowed: true,
                action: 'warning',
                message: 'You\'re sending messages quickly. Please be thoughtful with your submissions.',
                warning: true
            };
        }
        
        // Allow submission
        return {
            allowed: true,
            action: 'allow',
            message: 'Submission allowed'
        };
    }

    // Record successful submission
    recordSubmission(fingerprint) {
        const data = this.getDeviceData(fingerprint);
        data.messages.push(Date.now());
        this.deviceTracker.set(fingerprint, data);
    }

    // Verify CAPTCHA — stub, not yet integrated with a real CAPTCHA provider.
    // To enable: set RECAPTCHA_SECRET_KEY in .env and implement the verification call below.
    async verifyCaptcha(captchaResponse) {
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        if (!secret) return false; // fail-closed: block if no key configured
        try {
            const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${secret}&response=${captchaResponse}`
            });
            const data = await res.json();
            return data.success === true;
        } catch {
            return false;
        }
    }

    // Get device statistics
    getDeviceStats(fingerprint) {
        const data = this.getDeviceData(fingerprint);
        const counts = this.countMessages(data);
        
        return {
            fingerprint,
            messagesPerMinute: counts.perMinute,
            messagesPerHour: counts.perHour,
            messagesPerDay: counts.perDay,
            totalMessages: data.messages.length,
            warnings: data.warnings,
            captchaRequired: data.captchaRequired,
            blocked: data.blocked,
            firstSeen: data.firstSeen
        };
    }

    // Cleanup old device data (run periodically)
    cleanup() {
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        
        for (const [fingerprint, data] of this.deviceTracker.entries()) {
            if (data.firstSeen < (now - oneWeek)) {
                this.deviceTracker.delete(fingerprint);
            }
        }
    }

    startCleanupInterval() {
        // Run cleanup every hour to prevent unbounded memory growth
        setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
}

module.exports = DeviceProtection;
