#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Data default
const defaultData = {
    config: {},
    domains: {
        default: [
            "example.com",
            "test.com",
            "demo.com"
        ]
    },
    customDomains: {},
    adminUsage: {}
};

// Daftar file yang perlu dibuat
const files = [
    { name: 'config.json', data: defaultData.config },
    { name: 'domains.json', data: defaultData.domains },
    { name: 'customDomains.json', data: defaultData.customDomains },
    { name: 'adminUsage.json', data: defaultData.adminUsage }
];

console.log('🚀 Initializing WildCard Telegram Bot...\n');

// Buat directory data jika belum ada
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory');
} else {
    console.log('📁 Data directory already exists');
}

// Buat file-file data
let createdFiles = 0;
let existingFiles = 0;

files.forEach(file => {
    const filePath = path.join(dataDir, file.name);
    
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2));
        console.log(`✅ Created ${file.name}`);
        createdFiles++;
    } else {
        console.log(`📄 ${file.name} already exists`);
        existingFiles++;
    }
});

console.log('\n📊 Initialization Summary:');
console.log(`   📝 Files created: ${createdFiles}`);
console.log(`   📄 Files already existed: ${existingFiles}`);
console.log(`   📁 Total files: ${files.length}`);

console.log('\n✨ Initialization completed successfully!');
console.log('\n📋 Next steps:');
console.log('   1. Copy .env.example to .env');
console.log('   2. Edit .env with your bot token and admin IDs');
console.log('   3. Run: npm install');
console.log('   4. Run: npm start');

console.log('\n🎉 Ready to start your WildCard Telegram Bot!'); 