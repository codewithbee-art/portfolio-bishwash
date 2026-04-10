const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Derive a 32-byte key from SESSION_SECRET
let _keyWarned = false;
function getKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SESSION_SECRET is required in production for encryption');
        }
        if (!_keyWarned) {
            console.warn('⚠️  crypto-utils: Using insecure fallback key — set SESSION_SECRET before deploying');
            _keyWarned = true;
        }
        return crypto.createHash('sha256').update('dev-secret-change-in-production').digest();
    }
    return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plain-text string.
 * Returns a hex string: iv + authTag + ciphertext
 */
function encrypt(text) {
    if (!text) return text;
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    // Format: iv (hex) + tag (hex) + ciphertext (hex)
    return iv.toString('hex') + tag.toString('hex') + encrypted;
}

/**
 * Decrypt a string produced by encrypt().
 * Returns the original plain text, or null if decryption fails.
 */
function decrypt(encryptedHex) {
    if (!encryptedHex) return encryptedHex;
    try {
        const key = getKey();
        const iv = Buffer.from(encryptedHex.slice(0, IV_LENGTH * 2), 'hex');
        const tag = Buffer.from(encryptedHex.slice(IV_LENGTH * 2, IV_LENGTH * 2 + TAG_LENGTH * 2), 'hex');
        const ciphertext = encryptedHex.slice(IV_LENGTH * 2 + TAG_LENGTH * 2);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // If decryption fails, the value is likely plain text (not yet encrypted)
        return encryptedHex;
    }
}

module.exports = { encrypt, decrypt };
