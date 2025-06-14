const { FORBIDDEN_KEYWORDS, DEFAULT_SUBDOMAINS } = require('../config/constants');
const { readCustomSubdomains } = require('./fileUtils');

/**
 * Validate subdomain format and content
 * @param {string} domain - Domain to validate
 * @returns {object} - Validation result object
 */
function isValidSubdomain(domain) {
    if (!domain || typeof domain !== 'string') {
        return { valid: false, message: "Domain tidak valid atau kosong!" };
    }

    // Remove whitespace and convert to lowercase for validation
    const cleanDomain = domain.trim().toLowerCase();

    // Check basic format
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/;
    if (!regex.test(cleanDomain)) {
        return { valid: false, message: "Format subdomain tidak valid! Gunakan huruf, angka, titik, underscore, dan dash." };
    }

    // Check length
    if (cleanDomain.length > 63) {
        return { valid: false, message: "Subdomain terlalu panjang (maksimal 63 karakter)" };
    }

    if (cleanDomain.length < 3) {
        return { valid: false, message: "Subdomain terlalu pendek (minimal 3 karakter)" };
    }

    // Check for forbidden keywords
    for (const keyword of FORBIDDEN_KEYWORDS) {
        if (cleanDomain.includes(keyword.toLowerCase())) {
            return { 
                valid: false, 
                message: `Subdomain mengandung kata terlarang: "${keyword}"` 
            };
        }
    }

    // Check for consecutive dots or dashes
    if (cleanDomain.includes('..') || cleanDomain.includes('--')) {
        return { valid: false, message: "Subdomain tidak boleh mengandung titik atau dash berturut-turut" };
    }

    // Check if starts or ends with dash or dot
    if (cleanDomain.startsWith('-') || cleanDomain.endsWith('-') ||
        cleanDomain.startsWith('.') || cleanDomain.endsWith('.')) {
        return { valid: false, message: "Subdomain tidak boleh dimulai atau diakhiri dengan dash atau titik" };
    }

    return { valid: true };
}

/**
 * Check if domain already exists in user's subdomains
 * @param {string} domain - Domain to check
 * @param {string} userId - User ID
 * @returns {boolean} - True if domain exists
 */
function isDomainExists(domain, userId) {
    const allSubdomains = getAllSubdomains(userId);
    return allSubdomains.includes(domain.toLowerCase());
}

/**
 * Get all subdomains for a user (default + custom)
 * @param {string} userId - User ID
 * @returns {Array} - Array of all subdomains
 */
function getAllSubdomains(userId) {
    const customSubdomains = readCustomSubdomains();
    const userSubdomains = customSubdomains[userId] || [];
    return [...DEFAULT_SUBDOMAINS, ...userSubdomains];
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate Global API Key format (basic check)
 * @param {string} token - Token to validate
 * @returns {boolean} - True if valid format
 */
function isValidApiToken(token) {
    // Basic validation: should be a non-empty string with reasonable length
    return typeof token === 'string' && 
           token.trim().length >= 10 && 
           token.trim().length <= 200;
}

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/[<>\"']/g, '') // Remove potential HTML/script characters
        .substring(0, 255); // Limit length
}

/**
 * Validate domain name format
 * @param {string} domain - Domain to validate
 * @returns {object} - Validation result
 */
function isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') {
        return { valid: false, message: "Domain tidak valid!" };
    }

    const cleanDomain = domain.trim().toLowerCase();
    
    // Check length
    if (cleanDomain.length > 253) {
        return { valid: false, message: "Domain terlalu panjang!" };
    }

    if (cleanDomain.length < 3) {
        return { valid: false, message: "Domain terlalu pendek!" };
    }

    // Split domain into parts
    const parts = cleanDomain.split('.');
    
    // Domain must have at least 2 parts (domain.tld)
    if (parts.length < 2) {
        return { valid: false, message: "Format domain tidak valid! Domain harus memiliki minimal 2 bagian (contoh: domain.com)" };
    }

    // Validate each part
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Each part must not be empty
        if (!part || part.length === 0) {
            return { valid: false, message: "Format domain tidak valid! Tidak boleh ada bagian kosong." };
        }
        
        // Each part must not exceed 63 characters
        if (part.length > 63) {
            return { valid: false, message: "Format domain tidak valid! Setiap bagian domain maksimal 63 karakter." };
        }
        
        // Check valid characters and format for each part
        const partRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
        if (!partRegex.test(part)) {
            return { valid: false, message: "Format domain tidak valid! Gunakan huruf, angka, dan dash. Tidak boleh dimulai/diakhiri dengan dash." };
        }
    }

    // The last part (TLD) should be at least 2 characters and only letters
    const tld = parts[parts.length - 1];
    if (!/^[a-zA-Z]{2,}$/.test(tld)) {
        return { valid: false, message: "Format domain tidak valid! TLD harus minimal 2 huruf (contoh: .com, .id)" };
    }

    return { valid: true };
}

module.exports = {
    isValidSubdomain,
    isDomainExists,
    getAllSubdomains,
    isValidEmail,
    isValidApiToken,
    sanitizeInput,
    isValidDomain
}; 