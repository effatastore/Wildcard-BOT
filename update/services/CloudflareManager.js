const fetch = require("node-fetch");
const axios = require('axios');
const { CLOUDFLARE, CACHE_CONFIG } = require('../config/constants');
const { readConfig } = require('../utils/fileUtils');
const { getAllSubdomains } = require('../utils/validation');
const { sleep, generateRandomString } = require('../utils/systemUtils');

/**
 * CloudflareManager - Manages Cloudflare API operations
 */
class CloudflareManager {
    /**
     * Constructor
     * @param {string} userId - User ID for configuration lookup
     */
    constructor(userId) {
        console.log(`🔧 Inisialisasi CloudflareManager untuk user ID: ${userId}`);
        this.userId = userId;
        this.initializeConfig();
    }

    /**
     * Initialize Cloudflare configuration from user config
     */
    initializeConfig() {
        const config = readConfig();
        if (!config[this.userId]) {
            throw new Error(`❌ Konfigurasi tidak ditemukan untuk user ID: ${this.userId}`);
        }

        const credentials = config[this.userId];

        // Support both new (global_api_key) and legacy (tokenApi) format for backward compatibility
        const apiKey = credentials.global_api_key || credentials.tokenApi;
        
        if (!apiKey || !credentials.email || !credentials.accountId) {
            throw new Error(`❌ Konfigurasi tidak lengkap. Pastikan Global API Key, Email, dan Account ID telah diset.`);
        }

        this.cfEmail = credentials.email.trim();
        this.cfApiKey = apiKey.trim();
        this.cfAccountId = credentials.accountId.trim();
        this.baseUrl = CLOUDFLARE.BASE_URL;

        this.headers = {
            "X-Auth-Email": this.cfEmail,
            "X-Auth-Key": this.cfApiKey,
            "Content-Type": "application/json"
        };

        console.log("✅ Konfigurasi Cloudflare berhasil dimuat.");
    }

    /**
     * Extract main domain from a full domain
     * @param {string} domain - Full domain name
     * @returns {string} - Main domain
     */
    extractMainDomain(domain) {
        const parts = domain.split(".");
        console.log(`[INFO] Memproses domain: ${domain}`);
        console.log(`[INFO] Bagian domain: ${JSON.stringify(parts)}`);

        if (parts.length < 2) return domain;

        // Check for Indonesian SLD exceptions
        const lastTwo = parts.slice(-2).join(".");
        if (CLOUDFLARE.SLD_EXCEPTIONS.includes(lastTwo)) {
            const mainDomain = parts.slice(-3).join(".");
            console.log(`[INFO] Domain dengan SLD khusus, mengambil 3 bagian terakhir: ${mainDomain}`);
            return mainDomain;
        }

        const mainDomain = parts.slice(-2).join(".");
        console.log(`[INFO] Domain utama yang diambil: ${mainDomain}`);
        return mainDomain;
    }

    /**
     * Get Zone ID for a domain
     * @param {string} domain - Domain name
     * @returns {Promise<string>} - Zone ID
     */
    async getZoneId(domain) {
        const mainDomain = this.extractMainDomain(domain);
        console.log(`🔍 Mencari Zone ID untuk domain utama: ${mainDomain}`);

        try {
            const response = await fetch(`${this.baseUrl}/zones`, {
                method: "GET",
                headers: this.headers
            });

            const data = await response.json();

            if (!data.success || !Array.isArray(data.result)) {
                throw new Error("Data zona tidak ditemukan atau response tidak valid.");
            }

            const zone = data.result.find(zone => zone.name === mainDomain);
            if (!zone) {
                throw new Error(`Zone ID tidak ditemukan untuk domain: ${mainDomain}`);
            }

            console.log(`✅ Zone ID ditemukan: ${zone.id}`);
            return zone.id;
        } catch (error) {
            console.error("❌ Gagal mengambil Zone ID:", error);
            throw new Error(`Gagal mengambil Zone ID: ${error.message}`);
        }
    }

    /**
     * Create worker script content
     * @param {string} hostname - Target hostname
     * @returns {string} - Worker script
     */
    createWorkerScript(hostname) {
        const browserCache = CACHE_CONFIG.BROWSER_CACHE;
        const edgeCache = CACHE_CONFIG.EDGE_CACHE;
        
        return `(function(){var _0x4a=['headers','Cache-Control','CF-Cache-Status','X-Content-Type-Options','X-Frame-Options','X-XSS-Protection','Referrer-Policy','Strict-Transport-Security','Server','X-Powered-By','GET','clone','ASSETS','fetch','message','Response','URL','toString','default','match','pathname','startsWith','/','${hostname}','Headers','Host','X-Forwarded-Proto','slice','X-Real-IP','cf-connecting-ip','method','body','follow'];var _0x5b=function(_0x4c){return _0x4a[_0x4c]};addEventListener('fetch',function(_0xe){_0xe.respondWith(handleRequest(_0xe.request,_0xe))});async function handleRequest(_0xr,_0xs){const _0xt=${browserCache};const _0xu={'browser':'public, max-age='+_0xt,'edge':'public, max-age='+_0xt};try{let _0xurl=new URL(_0xr.url);const _0xkey=new Request(_0xurl.toString(),_0xr);const _0xcache=caches.default;let _0xres=await _0xcache.match(_0xkey);if(!_0xres){if(_0xurl.pathname.startsWith('/')){_0xurl.hostname='${hostname}';const _0xh=new Headers(_0xr.headers);_0xh.set('Host',_0xurl.hostname);_0xh.set('X-Forwarded-Proto',_0xurl.protocol.slice(0,-1));_0xh.set('X-Real-IP',_0xr.headers.get('cf-connecting-ip'));const _0xnr=new Request(_0xurl,{'method':_0xr.method,'headers':_0xh,'body':_0xr.body,'redirect':'follow'});try{_0xres=await fetch(_0xnr)}catch(_0xe){return new Response('Gagal terhubung ke server: '+_0xe.message,{'status':503,'headers':{'Content-Type':'text/plain;charset=UTF-8','Cache-Control':'no-store','Retry-After':'30'}})};if(_0xres.status===404){return new Response('Maaf, halaman yang Anda cari tidak ditemukan',{'status':404,'headers':{'Content-Type':'text/plain;charset=UTF-8','Cache-Control':'no-store'}})};_0xres=new Response(_0xres.body,{'status':_0xres.status,'statusText':_0xres.statusText,'headers':_0xres.headers});_0xres.headers.set('Cache-Control',_0xu.browser);_0xres.headers.set('CF-Cache-Status','DYNAMIC');_0xres.headers.set('X-Content-Type-Options','nosniff');_0xres.headers.set('X-Frame-Options','DENY');_0xres.headers.set('X-XSS-Protection','1; mode=block');_0xres.headers.set('Referrer-Policy','strict-origin-when-cross-origin');_0xres.headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');_0xres.headers.delete('Server');_0xres.headers.delete('X-Powered-By');if(_0xr.method==='GET'){_0xs.waitUntil(_0xcache.put(_0xkey,_0xres.clone()))}}else{_0xres=await env.ASSETS.fetch(_0xr)}};return _0xres}catch(_0xe){return new Response('Error: '+_0xe.message,{'status':500})}}})();`;
    }

    /**
     * Create a new worker
     * @param {string} workerName - Name of the worker
     * @param {string} hostname - Target hostname
     * @returns {Promise<string>} - Worker name
     */
    async createWorker(workerName, hostname) {
        console.log(`🔧 Membuat Worker dengan nama: ${workerName}`);
        const script = this.createWorkerScript(hostname);
        
        try {
            const response = await fetch(
                `${this.baseUrl}/accounts/${this.cfAccountId}/workers/scripts/${workerName}`,
                {
                    method: "PUT",
                    headers: {
                        "X-Auth-Email": this.cfEmail,
                        "X-Auth-Key": this.cfApiKey,
                        "Content-Type": "application/javascript"
                    },
                    body: script
                }
            );

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.errors?.[0]?.message || "Gagal membuat Worker.");
            }

            console.log(`✅ Worker ${workerName} berhasil dibuat.`);
            return workerName;
        } catch (error) {
            console.error(`❌ Gagal membuat Worker: ${error.message}`);
            throw error;
        }
    }

    /**
     * Add domain to worker
     * @param {string} workerName - Worker name
     * @param {string} domain - Domain to add
     * @returns {Promise<object>} - Result object
     */
    async addDomainToWorker(workerName, domain) {
        try {
            const zoneId = await this.getZoneId(domain);
            console.log(`[DEBUG] Zone ID untuk ${domain}:`, zoneId);

            const response = await axios.put(
                `${this.baseUrl}/accounts/${this.cfAccountId}/workers/domains`,
                {
                    hostname: domain,
                    service: workerName,
                    environment: "production",
                    zone_id: zoneId,
                    override_existing_dns_record: true
                },
                { headers: this.headers }
            );

            if (!response.data.success) {
                if (response.data.errors?.[0]?.code === 100117 || response.status === 409) {
                    console.log(`ℹ️ Domain ${domain} sudah terkonfigurasi sebelumnya, melanjutkan...`);
                    return { success: true, domain, message: "Domain sudah terkonfigurasi" };
                }
                throw new Error(response.data.errors?.[0]?.message || 'Gagal menambahkan domain');
            }

            return { success: true, domain };
        } catch (error) {
            if (error.response?.status === 409 || error.response?.data?.errors?.[0]?.code === 100117) {
                console.log(`ℹ️ Domain ${domain} sudah terkonfigurasi sebelumnya, melanjutkan...`);
                return { success: true, domain, message: "Domain sudah terkonfigurasi" };
            }
            console.error("❌ Error adding domain:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Add CNAME record for wildcard
     * @param {string} hostname - Hostname for CNAME
     * @returns {Promise<object>} - Result object
     */
    async addCNAME(hostname) {
        const zoneId = await this.getZoneId(hostname);
        const cnameRecord = {
            type: "CNAME",
            name: `*.${hostname}`,
            content: hostname,
            proxied: true,
            comment: "CNAME for Wildcard by AutoFtBot69"
        };

        try {
            // Check if CNAME already exists
            const existingRecords = await axios.get(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
                headers: this.headers
            });

            const cnameExists = existingRecords.data.result.some(record => 
                record.type === "CNAME" && record.name === `*.${hostname}`
            );

            if (cnameExists) {
                console.log(`ℹ️ CNAME untuk *.${hostname} sudah ada, melanjutkan...`);
                return { success: true, message: `CNAME untuk *.${hostname} sudah ada.` };
            }

            const response = await axios.post(
                `${this.baseUrl}/zones/${zoneId}/dns_records`,
                cnameRecord,
                { headers: this.headers }
            );

            if (!response.data.success) {
                throw new Error("Gagal menambahkan CNAME: " + response.data.errors[0].message);
            }

            console.log(`✅ CNAME untuk *.${hostname} berhasil ditambahkan.`);
            return { success: true, message: `CNAME untuk *.${hostname} berhasil ditambahkan.` };
        } catch (error) {
            console.error("❌ Error menambahkan CNAME:", error);
            throw new Error(`Gagal menambahkan CNAME: ${error.message}`);
        }
    }

    /**
     * Delete worker
     * @param {string} workerName - Worker name to delete
     * @returns {Promise<void>}
     */
    async deleteWorker(workerName) {
        try {
            const response = await fetch(
                `${this.baseUrl}/accounts/${this.cfAccountId}/workers/scripts/${workerName}`,
                {
                    method: "DELETE",
                    headers: this.headers
                }
            );

            const data = await response.json();
            if (!data.success) {
                console.log(`⚠️ Worker ${workerName} mungkin sudah tidak ada, melanjutkan...`);
                return;
            }

            console.log(`✅ Worker ${workerName} berhasil dihapus.`);
        } catch (error) {
            console.error(`⚠️ Error menghapus worker ${workerName}:`, error.message);
        }
    }

    /**
     * Setup wildcard domain with all subdomains
     * @param {string} domain - Main domain
     * @returns {Promise<object>} - Setup result
     */
    async setupwildcard(domain) {
        const workerName = `wildcard-${generateRandomString(10)}`;
        
        try {
            console.log(`⚙️ Setup wildcard untuk domain ${domain}`);
            console.log(`🔧 Membuat temporary worker: ${workerName}`);

            // Step 1: Create worker
            await this.createWorker(workerName, domain);
            await sleep(1000);

            // Step 2: Add CNAME record
            console.log(`📝 Menambahkan CNAME record...`);
            await this.addCNAME(domain);

            // Step 3: Get all subdomains and add them to worker
            const allSubdomains = getAllSubdomains(this.userId);
            const domains = [
                `*.${domain}`,
                ...allSubdomains.map(sub => `${sub}.${domain}`)
            ];

            console.log(`📊 Total subdomain yang akan dikonfigurasi: ${domains.length}`);
            
            // Step 4: Add domains to worker
            for (const subdomain of domains) {
                try {
                    await this.addDomainToWorker(workerName, subdomain);
                    await sleep(100); // Small delay to avoid rate limiting
                } catch (error) {
                    console.error(`⚠️ Error adding ${subdomain}:`, error.message);
                    // Continue with other domains
                }
            }

            // Step 5: Clean up temporary worker
            console.log(`🧹 Membersihkan temporary worker...`);
            await this.deleteWorker(workerName);

            return { 
                success: true, 
                domain,
                subdomainsConfigured: domains.length,
                message: `Wildcard berhasil dikonfigurasi untuk ${domain}`
            };
        } catch (error) {
            console.error(`❌ Error setting up wildcard untuk ${domain}:`, error);
            
            // Try to clean up worker if it was created
            try {
                await this.deleteWorker(workerName);
            } catch (cleanupError) {
                console.error(`⚠️ Error cleaning up worker:`, cleanupError.message);
            }
            
            throw new Error(`Gagal setup wildcard untuk ${domain}: ${error.message}`);
        }
    }
}

module.exports = CloudflareManager; 