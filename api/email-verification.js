// Professional Email Verification Service
const axios = require('axios');

class EmailVerificationService {
    constructor() {
        // ZeroBounce API (100 free/month)
        this.zerobounceApiKey = process.env.ZEROBOUNCE_API_KEY;
        // Hunter.io API (100 free/month) 
        this.hunterApiKey = process.env.HUNTER_API_KEY;
        // Abstract API (100 free/month)
        this.abstractApiKey = process.env.ABSTRACT_API_KEY;
    }

    // Method 1: ZeroBounce (most accurate)
    async verifyWithZeroBounce(email) {
        if (!this.zerobounceApiKey) {
            return { available: false, reason: 'API key not configured' };
        }

        try {
            const response = await axios.get(`https://api.zerobounce.net/v2/validate`, {
                params: {
                    api_key: this.zerobounceApiKey,
                    email: email,
                    ip_address: ''
                }
            });

            const data = response.data;
            return {
                valid: data.status === 'valid',
                isDisposable: data.free_email || data.disposable,
                isCatchAll: data.catch_all,
                domain: data.domain,
                reason: data.status,
                score: data.quality_score
            };
        } catch (error) {
            console.error('ZeroBounce error:', error.message);
            return { available: false, reason: 'API call failed' };
        }
    }

    // Method 2: Hunter.io
    async verifyWithHunter(email) {
        if (!this.hunterApiKey) {
            return { available: false, reason: 'API key not configured' };
        }

        try {
            const response = await axios.get(`https://api.hunter.io/v2/email-verifier`, {
                params: {
                    api_key: this.hunterApiKey,
                    email: email
                }
            });

            const data = response.data.data;
            return {
                valid: data.status === 'valid' || data.status === 'accept_all',
                isDisposable: data.disposable,
                domain: data.domain,
                reason: data.status,
                score: data.score
            };
        } catch (error) {
            console.error('Hunter.io error:', error.message);
            return { available: false, reason: 'API call failed' };
        }
    }

    // Method 3: Abstract API
    async verifyWithAbstract(email) {
        if (!this.abstractApiKey) {
            return { available: false, reason: 'API key not configured' };
        }

        try {
            const response = await axios.get(`https://emailvalidation.abstractapi.com/v1/`, {
                params: {
                    api_key: this.abstractApiKey,
                    email: email
                }
            });

            const data = response.data;
            return {
                valid: data.is_valid_format.value && data.is_mx_found.value,
                isDisposable: data.is_disposable_email.value,
                domain: data.domain,
                reason: data.deliverability,
                score: data.quality_score
            };
        } catch (error) {
            console.error('Abstract API error:', error.message);
            return { available: false, reason: 'API call failed' };
        }
    }

    // Fallback: Advanced local validation
    advancedLocalValidation(email) {
        const disposableDomains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'yopmail.com', 'temp-mail.org',
            'throwaway.email', 'maildrop.cc', 'tempmail.de',
            '10minutemail.co', 'temp-mail.org', 'yopmail.net',
            'maildrop.cc', '20minutemail.com', 'guerrillamail.de',
            'sharklasers.com', 'getairmail.com', 'mailinator.net',
            'mailnator.com', 'mailinator2.com', 'mailtempora.com',
            'mailinator.info', 'mailinator.site', 'mailinator.top',
            'mintemail.com', 'spambox.us', 'spamhole.com',
            'spamgourmet.com', 'tempmailaddress.com', 'yopmail.fr',
            'yopmail.net', 'yopmail.org', 'yopmail.com',
            'coolmailclub.com', 'emailfake.com', 'emailfake.org',
            'fakeemailgenerator.com', 'fakemailgenerator.com',
            'mail2rss.org', 'mailcatch.com', 'maildrop.cc',
            'mailed.ro', 'mailinator.co', 'mailinator.info',
            'mailinator.org', 'mailinator.us', 'mailme.lv',
            'mailnator.com', 'mailnesia.com', 'mailnull.com',
            'mailshark.com', 'mailtempora.com', 'mailzilla.com',
            'moburl.com', 'mytemp.email', 'mytempmail.com',
            'nepwk.com', 'noreply.com', 'nowhere.org',
            'objectmail.com', 'owlpic.com', 'postacin.com',
            'putthisinyourspam.com', 'rcpt.at', 'rmqkr.net',
            'rtrtr.com', 'safetymail.info', 'safetypost.de',
            'sendspamhere.com', 'shitmail.org', 'skeefmail.com',
            'smellyfear.com', 'snakemail.com', 'sogetthis.com',
            'sofort-mail.de', 'spam.la', 'spam.su', 'spamavert.com',
            'spambob.com', 'spambob.org', 'spambog.com',
            'spambog.de', 'spambog.ru', 'spambox.info',
            'spambox.irishspring.com', 'spambox.us', 'spamcannon.com',
            'spamcannon.net', 'spamcannon.org', 'spamcon.org',
            'spamcop.org', 'spamdecoy.net', 'spamex.com',
            'spamfree24.com', 'spamfree24.de', 'spamfree24.eu',
            'spamfree24.info', 'spamfree24.net', 'spamfree24.org',
            'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
            'spamherelots.com', 'spamhole.com', 'spamify.com',
            'spaminator.de', 'spamkill.info', 'spaml.com',
            'spaml.de', 'spammotel.com', 'spamobox.com',
            'spamoff.de', 'spamsafe.net', 'spamslicer.com',
            'spamspot.com', 'spamthis.co.uk', 'spamthisplease.com',
            'spamtroll.net', 'spamtrap.ro', 'spaml.com',
            'tempalias.com', 'tempemail.co.za', 'tempemail.com',
            'tempemail.net', 'tempmail.co', 'tempmail.com',
            'tempmail.de', 'tempmail.it', 'tempmail.lt',
            'tempmail.lv', 'tempmail.org', 'tempmail.ru',
            'tempmail2.com', 'tempmaildemo.com', 'tempmailer.com',
            'tempmailo.com', 'tempmails.com', 'tempmail.ws',
            'tempomail.fr', 'temporarily.de', 'temporarioemail.com',
            'temporaryemail.com', 'temporaryemail.net',
            'temporarymail.com', 'temporarioemail.com',
            'thunderbolt.com', 'topranklist.de', 'trash-amil.com',
            'trash-email.at', 'trash-email.com', 'trash-email.de',
            'trash-email.net', 'trash-email.org', 'trash-mail.at',
            'trash-mail.com', 'trash-mail.de', 'trash-mail.net',
            'trash-mail.org', 'trash2009.com', 'trashemail.de',
            'trashmail.at', 'trashmail.com', 'trashmail.de',
            'trashmail.me', 'trashmail.net', 'trashmail.org',
            'trashmail.ws', 'trashymail.com', 'trillianpro.com',
            'tyldd.com', 'uggsrock.com', 'upliftnow.com',
            'uwork4us.com', 'valemail.net', 'vipmail.pw',
            'vmani.com', 'vrmr.com', 'walala.org',
            'webcontact-france.com', 'wegwerfmail.de', 'wegwerfmail.net',
            'wegwerfmail.org', 'wh4f.org', 'whyspam.me',
            'willselfdestruct.com', 'wimsg.com', 'winemaven.info',
            'wmail.cf', 'wolfsmail.to', 'wronghead.com',
            'wuzup.net', 'xagloo.com', 'xmail.com',
            'xoxy.net', 'yep.it', 'yogamaven.com',
            'yopmail.com', 'yopmail.fr', 'yopmail.net',
            'yourdomain.com', 'yourlifesucks.com', 'yspend.com',
            'zehnminutenmail.de', 'zippymail.info', 'zmail.ru',
            'zoemail.com', 'zoemail.net', 'zoemail.org'
        ];

        const suspiciousPatterns = [
            /^[a-z]{1,2}\d{4,}@/, // 1-2 letters + 4+ numbers (like ab1234@)
            /test123|demo123|fake123|sample123/i,
            /^test@|^demo@|^fake@|^sample@|^random@/,
            /\d{5,}@/, // 5+ consecutive numbers (more suspicious)
            /(test|demo|fake|sample|random|noreply|no-reply)\d*@/i // suspicious words with numbers
        ];

        const domain = email.split('@')[1]?.toLowerCase();
        
        if (!domain) return { valid: false, reason: 'Invalid format' };
        
        // Check disposable domains
        if (disposableDomains.includes(domain)) {
            return { valid: false, reason: 'Disposable email domain' };
        }
        
        // Check suspicious patterns
        if (suspiciousPatterns.some(pattern => pattern.test(email))) {
            return { valid: false, reason: 'Suspicious pattern' };
        }
        
        // Check common fake patterns
        if (domain.includes('fake') || domain.includes('test') || domain.includes('demo')) {
            return { valid: false, reason: 'Fake/test domain' };
        }
        
        return { valid: true, reason: 'Passed local validation' };
    }

    // Main verification method - tries multiple services
    async verifyEmail(email) {
        console.log('🔍 Starting professional email verification for:', email);
        
        // Try API services first (most accurate)
        if (this.zerobounceApiKey) {
            const result = await this.verifyWithZeroBounce(email);
            if (result.available !== false) {
                console.log('✅ ZeroBounce verification:', result);
                return { valid: result.valid, method: 'ZeroBounce', ...result };
            }
        }

        if (this.hunterApiKey) {
            const result = await this.verifyWithHunter(email);
            if (result.available !== false) {
                console.log('✅ Hunter verification:', result);
                return { valid: result.valid, method: 'Hunter', ...result };
            }
        }

        if (this.abstractApiKey) {
            const result = await this.verifyWithAbstract(email);
            if (result.available !== false) {
                console.log('✅ Abstract API verification:', result);
                return { valid: result.valid, method: 'Abstract', ...result };
            }
        }

        // Fallback to local validation
        console.log('🔄 Using local validation fallback');
        const result = this.advancedLocalValidation(email);
        console.log('📋 Local validation result:', result);
        
        return { valid: result.valid, method: 'Local', ...result };
    }
}

module.exports = EmailVerificationService;
