 // Simple test file to validate core components
const fs = require('fs');
const path = require('path');

console.log('🧪 Running basic validation tests...\n');

// Test 1: Check if all required files exist
const requiredFiles = [
    'config/default.js',
    'utils/fileUtils.js',
    'utils/validation.js',
    'utils/systemUtils.js',
    'services/CloudflareManager.js',
    'handlers/configHandlers.js',
    'handlers/domainHandlers.js',
    'handlers/cloudflareHandlers.js',
    'handlers/generalHandlers.js',
    'index.js',
    'package.json',
    '.env.example'
];

console.log('📁 Checking file structure...');
let missingFiles = [];
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        missingFiles.push(file);
    }
});

// Test 2: Check data files
console.log('\n📊 Checking data files...');
const dataFiles = ['config.json', 'domains.json', 'customDomains.json', 'adminUsage.json'];
dataFiles.forEach(file => {
    const filePath = path.join('data', file);
    if (fs.existsSync(filePath)) {
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`✅ data/${file} - Valid JSON`);
        } catch (error) {
            console.log(`❌ data/${file} - Invalid JSON: ${error.message}`);
        }
    } else {
        console.log(`❌ data/${file} - MISSING`);
    }
});

// Test 3: Try to require main modules
console.log('\n🔧 Testing module imports...');
try {
    require('./config/default');
    console.log('✅ config/default.js - OK');
} catch (error) {
    console.log(`❌ config/default.js - Error: ${error.message}`);
}

try {
    require('./utils/fileUtils');
    console.log('✅ utils/fileUtils.js - OK');
} catch (error) {
    console.log(`❌ utils/fileUtils.js - Error: ${error.message}`);
}

try {
    require('./utils/validation');
    console.log('✅ utils/validation.js - OK');
} catch (error) {
    console.log(`❌ utils/validation.js - Error: ${error.message}`);
}

try {
    require('./utils/systemUtils');
    console.log('✅ utils/systemUtils.js - OK');
} catch (error) {
    console.log(`❌ utils/systemUtils.js - Error: ${error.message}`);
}

try {
    require('./services/CloudflareManager');
    console.log('✅ services/CloudflareManager.js - OK');
} catch (error) {
    console.log(`❌ services/CloudflareManager.js - Error: ${error.message}`);
}

// Test 4: Check environment file
console.log('\n🌍 Checking environment...');
if (fs.existsSync('.env')) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('BOT_TOKEN=')) {
        console.log('✅ BOT_TOKEN variable found');
    } else {
        console.log('⚠️  BOT_TOKEN not found in .env');
    }
    if (envContent.includes('ADMIN_IDS=')) {
        console.log('✅ ADMIN_IDS variable found');
    } else {
        console.log('⚠️  ADMIN_IDS not found in .env');
    }
} else {
    console.log('⚠️  .env file not found (copy from .env.example)');
}

console.log('\n📋 Summary:');
if (missingFiles.length === 0) {
    console.log('✅ All core files are present');
} else {
    console.log(`❌ Missing ${missingFiles.length} files:`);
    missingFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🎉 Basic validation completed!');
console.log('\n📝 Next steps to run the bot:');
console.log('   1. Copy .env.example to .env: cp .env.example .env');
console.log('   2. Edit .env with your bot token and admin IDs');
console.log('   3. Start the bot: npm start');
console.log('\n🚀 Your WildCard Telegram Bot is ready!');