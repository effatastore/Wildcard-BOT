const CloudflareManager = require('../services/CloudflareManager');
const { readConfig } = require('../utils/fileUtils');

// Mock the fileUtils module
jest.mock('../utils/fileUtils', () => ({
    readConfig: jest.fn()
}));

describe('CloudflareManager', () => {
    let cloudflareManager;
    const TEST_USER_ID = 'test-user-123';
    const TEST_CONFIG = {
        [TEST_USER_ID]: {
            global_api_key: 'test-api-key',
            email: 'test@example.com',
            accountId: 'test-account-id'
        }
    };

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        // Setup the mock return value for readConfig
        readConfig.mockReturnValue(TEST_CONFIG);
        cloudflareManager = new CloudflareManager(TEST_USER_ID);
    });

    describe('getConfig', () => {
        it('should return config for the user', () => {
            expect(cloudflareManager.cfEmail).toBe('test@example.com');
            expect(cloudflareManager.cfApiKey).toBe('test-api-key');
            expect(cloudflareManager.cfAccountId).toBe('test-account-id');
        });
    });

    describe('extractMainDomain', () => {
        it('should extract main domain from subdomain', () => {
            const result = cloudflareManager.extractMainDomain('test.example.com');
            expect(result).toBe('example.com');
        });

        it('should return same domain if no subdomain', () => {
            const result = cloudflareManager.extractMainDomain('example.com');
            expect(result).toBe('example.com');
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
