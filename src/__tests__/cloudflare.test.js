const CloudflareManager = require('../services/CloudflareManager');

describe('CloudflareManager', () => {
    let cloudflareManager;

    beforeEach(() => {
        cloudflareManager = new CloudflareManager();
    });

    describe('getConfig', () => {
        it('should return default config if no config exists', () => {
            const config = cloudflareManager.getConfig();
            expect(config).toBeDefined();
            expect(config).toHaveProperty('apiKey');
            expect(config).toHaveProperty('email');
        });
    });

    describe('setConfig', () => {
        it('should save config successfully', () => {
            const testConfig = {
                apiKey: 'test-api-key',
                email: 'test@example.com'
            };
            
            expect(() => {
                cloudflareManager.setConfig(testConfig);
            }).not.toThrow();

            const savedConfig = cloudflareManager.getConfig();
            expect(savedConfig).toEqual(testConfig);
        });
    });

    describe('getDomains', () => {
        it('should return empty array if no domains exist', () => {
            const domains = cloudflareManager.getDomains();
            expect(Array.isArray(domains)).toBe(true);
            expect(domains).toHaveLength(0);
        });
    });
}); 