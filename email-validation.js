// Email validation functions
function isValidEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isDisposableEmail(email) {
    const disposableDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
        'mailinator.com', 'yopmail.com', 'temp-mail.org',
        'throwaway.email', 'maildrop.cc', 'tempmail.de'
    ];
    const domain = email.split('@')[1].toLowerCase();
    return disposableDomains.some(disposable => domain.includes(disposable));
}

function isSuspiciousEmail(email) {
    const suspiciousPatterns = [
        /^[a-z]+\d+@/, // letters+numbers@ (like abc123@)
        /\d{4,}@/, // 4+ consecutive numbers
        /^[a-z]{1,2}@/, // 1-2 letter usernames
        /test|demo|fake|sample|example/i
    ];
    return suspiciousPatterns.some(pattern => pattern.test(email));
}

// Comprehensive validation
function validateEmail(email) {
    const result = {
        isValid: false,
        isDisposable: false,
        isSuspicious: false,
        message: ''
    };
    
    if (!email || email.trim() === '') {
        result.message = 'Email is required';
        return result;
    }
    
    if (!isValidEmailFormat(email)) {
        result.message = 'Please enter a valid email address';
        return result;
    }
    
    if (isDisposableEmail(email)) {
        result.isDisposable = true;
        result.message = 'Please use a permanent email address (no disposable emails)';
        return result;
    }
    
    if (isSuspiciousEmail(email)) {
        result.isSuspicious = true;
        result.message = 'Please use a real email address';
        return result;
    }
    
    result.isValid = true;
    result.message = 'Email looks valid';
    return result;
}
