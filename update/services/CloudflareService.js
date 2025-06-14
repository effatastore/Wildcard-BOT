const fetch = require('node-fetch');
const { API_ENDPOINTS, RATE_LIMITS } = require('../config/constants');

class CloudflareService {
    constructor(apiKey, email) {
        this.apiKey = apiKey;
        this.email = email;
        this.baseUrl = API_ENDPOINTS.CLOUDFLARE.BASE_URL;
    }

    /**
     * Verify Cloudflare API credentials
     */
    async verifyCredentials() {
        try {
            const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CLOUDFLARE.VERIFY_TOKEN}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: RATE_LIMITS.REQUEST_TIMEOUT
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            return await response.json();
        } catch (error) {
            console.error('Cloudflare API Error:', error.message);
            throw error;
        }
    }

    /**
     * Get user's Cloudflare accounts
     */
    async getAccounts() {
        try {
            const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CLOUDFLARE.ACCOUNTS}`, {
                method: 'GET',
                headers: {
                    'X-Auth-Email': this.email,
                    'X-Auth-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: RATE_LIMITS.REQUEST_TIMEOUT
            });

            if (!response.ok) {
                throw new Error('Failed to fetch accounts');
            }

            return await response.json();
        } catch (error) {
            console.error('Cloudflare API Error:', error.message);
            throw error;
        }
    }

    /**
     * Get zones (domains) for an account
     */
    async getZones(accountId) {
        try {
            const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CLOUDFLARE.ZONES}`, {
                method: 'GET',
                headers: {
                    'X-Auth-Email': this.email,
                    'X-Auth-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: RATE_LIMITS.REQUEST_TIMEOUT
            });

            if (!response.ok) {
                throw new Error('Failed to fetch zones');
            }

            return await response.json();
        } catch (error) {
            console.error('Cloudflare API Error:', error.message);
            throw error;
        }
    }

    /**
     * Create DNS record
     */
    async createDNSRecord(zoneId, record) {
        try {
            const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CLOUDFLARE.ZONES}/${zoneId}${API_ENDPOINTS.CLOUDFLARE.DNS_RECORDS}`, {
                method: 'POST',
                headers: {
                    'X-Auth-Email': this.email,
                    'X-Auth-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record),
                timeout: RATE_LIMITS.REQUEST_TIMEOUT
            });

            if (!response.ok) {
                throw new Error('Failed to create DNS record');
            }

            return await response.json();
        } catch (error) {
            console.error('Cloudflare API Error:', error.message);
            throw error;
        }
    }

    /**
     * Delete DNS record
     */
    async deleteDNSRecord(zoneId, recordId) {
        try {
            const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CLOUDFLARE.ZONES}/${zoneId}${API_ENDPOINTS.CLOUDFLARE.DNS_RECORDS}/${recordId}`, {
                method: 'DELETE',
                headers: {
                    'X-Auth-Email': this.email,
                    'X-Auth-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: RATE_LIMITS.REQUEST_TIMEOUT
            });

            if (!response.ok) {
                throw new Error('Failed to delete DNS record');
            }

            return await response.json();
        } catch (error) {
            console.error('Cloudflare API Error:', error.message);
            throw error;
        }
    }

    /**
     * Search DNS records
     */
    async searchDNSRecords(zoneId, query) {
        try {
            const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CLOUDFLARE.ZONES}/${zoneId}${API_ENDPOINTS.CLOUDFLARE.DNS_RECORDS}?name=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'X-Auth-Email': this.email,
                    'X-Auth-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: RATE_LIMITS.REQUEST_TIMEOUT
            });

            if (!response.ok) {
                throw new Error('Failed to search DNS records');
            }

            return await response.json();
        } catch (error) {
            console.error('Cloudflare API Error:', error.message);
            throw error;
        }
    }
}

module.exports = CloudflareService; 