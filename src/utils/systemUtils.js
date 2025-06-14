const os = require('os');
const dns = require('dns').promises;
const moment = require('moment-timezone');

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get system information
 * @returns {object} - System information object
 */
function getSystemInfo() {
    const uptime = os.uptime();
    const uptimeFormatted = moment.duration(uptime, 'seconds').humanize();
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const memUsage = ((usedMem / totalMem) * 100).toFixed(2);

    return {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: uptimeFormatted,
        totalMem: `${totalMem}GB`,
        usedMem: `${usedMem}GB`,
        freeMem: `${freeMem}GB`,
        memUsage: `${memUsage}%`,
        cpus: os.cpus().length,
        nodeVersion: process.version,
    };
}

/**
 * Check ping to a host
 * @param {string} host - Host to ping
 * @returns {Promise<number>} - Ping time in milliseconds
 */
async function checkPing(host) {
    const startTime = Date.now();
    try {
        await dns.resolve(host);
        const endTime = Date.now();
        return endTime - startTime;
    } catch (error) {
        throw new Error(`Unable to ping ${host}: ${error.message}`);
    }
}

/**
 * Get current timestamp in Jakarta timezone
 * @returns {string} - Formatted timestamp
 */
function getCurrentTimestamp() {
    return moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');
}

/**
 * Get memory usage percentage
 * @returns {object} - Memory usage object with values in MB
 */
function getMemoryUsage() {
    const used = process.memoryUsage();
    const memUsage = {};

    for (let key in used) {
        memUsage[key] = Math.round((used[key] / 1024 / 1024) * 100) / 100;
    }

    return memUsage;
}

/**
 * Create delay/sleep function
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>} - Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
function generateRandomString(length = 10) {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length);
}

module.exports = {
    formatBytes,
    getSystemInfo,
    checkPing,
    getCurrentTimestamp,
    getMemoryUsage,
    sleep,
    generateRandomString,
};