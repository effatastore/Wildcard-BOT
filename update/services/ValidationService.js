const { VALIDATION } = require('../config/constants');

class ValidationService {
    /**
     * Validate API key format
     */
    static isValidApiToken(token) {
        return token && token.length >= VALIDATION.MIN_API_KEY_LENGTH;
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        return email && VALIDATION.EMAIL_REGEX.test(email);
    }

    /**
     * Validate domain format
     */
    static isValidDomain(domain) {
        return domain && VALIDATION.DOMAIN_REGEX.test(domain);
    }

    /**
     * Validate subdomain format
     */
    static isValidSubdomain(subdomain) {
        // Subdomain should be alphanumeric and can contain hyphens
        const subdomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/;
        return subdomain && subdomainRegex.test(subdomain);
    }

    /**
     * Sanitize user input
     */
    static sanitizeInput(input) {
        if (!input) return '';
        
        // Remove any HTML tags
        input = input.replace(/<[^>]*>/g, '');
        
        // Remove any special characters except allowed ones
        input = input.replace(/[^a-zA-Z0-9@._-]/g, '');
        
        // Trim whitespace
        input = input.trim();
        
        return input;
    }

    /**
     * Validate wildcard domain format
     */
    static isValidWildcardDomain(domain) {
        if (!this.isValidDomain(domain)) return false;
        
        // Check if domain is not already a wildcard
        if (domain.startsWith('*.')) return false;
        
        return true;
    }

    /**
     * Validate search query
     */
    static isValidSearchQuery(query) {
        if (!query) return false;
        
        // Remove any special characters except allowed ones
        query = query.replace(/[^a-zA-Z0-9*.-]/g, '');
        
        // Trim whitespace
        query = query.trim();
        
        return query.length >= 2; // Minimum 2 characters for search
    }

    /**
     * Validate configuration object
     */
    static isValidConfig(config) {
        return config && 
               this.isValidApiToken(config.apiKey) && 
               this.isValidEmail(config.email);
    }
}

module.exports = ValidationService; 