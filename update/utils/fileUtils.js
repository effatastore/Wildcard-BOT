const fs = require('fs');
const { PATHS, LIMITS } = require('../config/constants');

/**
 * Read JSON file safely
 * @param {string} filePath - Path to the JSON file
 * @param {object} defaultValue - Default value if file doesn't exist
 * @returns {object} - Parsed JSON data
 */
function readJsonFile(filePath, defaultValue = {}) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        // Create file with default value if it doesn't exist
        writeJsonFile(filePath, defaultValue);
        return defaultValue;
    } catch (err) {
        console.error(`⚠️ Gagal membaca file ${filePath}:`, err);
        return defaultValue;
    }
}

/**
 * Write JSON file safely
 * @param {string} filePath - Path to the JSON file
 * @param {object} data - Data to write
 * @returns {boolean} - Success status
 */
function writeJsonFile(filePath, data) {
    try {
        // Ensure directory exists
        const dir = require('path').dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`❌ Gagal menulis file ${filePath}:`, err);
        return false;
    }
}

/**
 * Read user configuration
 */
function readConfig() {
    return readJsonFile(PATHS.USER_CONFIG, {});
}

/**
 * Write user configuration
 */
function writeConfig(data) {
    return writeJsonFile(PATHS.USER_CONFIG, data);
}

/**
 * Read admin usage data
 */
function readAdminUsage() {
    return readJsonFile(PATHS.ADMIN_USAGE, {});
}

/**
 * Write admin usage data
 */
function writeAdminUsage(data) {
    return writeJsonFile(PATHS.ADMIN_USAGE, data);
}

/**
 * Read custom subdomains
 */
function readCustomSubdomains() {
    return readJsonFile(PATHS.CUSTOM_SUBDOMAINS, {});
}

/**
 * Write custom subdomains with backup
 */
function writeCustomSubdomains(data) {
    // Create backup before writing
    backupCustomSubdomains();
    return writeJsonFile(PATHS.CUSTOM_SUBDOMAINS, data);
}

/**
 * Create backup of custom subdomains
 */
function backupCustomSubdomains() {
    try {
        // Ensure backup directory exists
        if (!fs.existsSync(PATHS.BACKUP_DIR)) {
            fs.mkdirSync(PATHS.BACKUP_DIR, { recursive: true });
        }

        // Create backup with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${PATHS.BACKUP_DIR}/custom_subdomains_${timestamp}.json`;
        
        if (fs.existsSync(PATHS.CUSTOM_SUBDOMAINS)) {
            fs.copyFileSync(PATHS.CUSTOM_SUBDOMAINS, backupPath);
        }

        // Clean old backups (keep only latest 7)
        cleanOldBackups();
        
        console.log(`✅ Backup berhasil dibuat: ${backupPath}`);
        return true;
    } catch (error) {
        console.error("❌ Gagal membuat backup:", error);
        return false;
    }
}

/**
 * Clean old backup files
 */
function cleanOldBackups() {
    try {
        if (!fs.existsSync(PATHS.BACKUP_DIR)) return;
        
        const files = fs.readdirSync(PATHS.BACKUP_DIR);
        const backupFiles = files
            .filter(f => f.startsWith('custom_subdomains_'))
            .sort()
            .reverse(); // Newest first

        // Keep only the latest files, delete the rest
        const filesToDelete = backupFiles.slice(LIMITS.MAX_BACKUP_FILES);
        filesToDelete.forEach(file => {
            try {
                fs.unlinkSync(`${PATHS.BACKUP_DIR}/${file}`);
                console.log(`🗑️ Deleted old backup: ${file}`);
            } catch (err) {
                console.error(`⚠️ Failed to delete backup ${file}:`, err);
            }
        });
    } catch (error) {
        console.error("⚠️ Error cleaning old backups:", error);
    }
}

module.exports = {
    readJsonFile,
    writeJsonFile,
    readConfig,
    writeConfig,
    readAdminUsage,
    writeAdminUsage,
    readCustomSubdomains,
    writeCustomSubdomains,
    backupCustomSubdomains,
    cleanOldBackups
}; 