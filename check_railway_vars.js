console.log('🔍 Railway Variables Check');
console.log('========================');

// Проверяем все важные переменные
const vars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'NODE_ENV': process.env.NODE_ENV,
    'PORT': process.env.PORT,
    'RAILWAY_PUBLIC_DOMAIN': process.env.RAILWAY_PUBLIC_DOMAIN,
    'RAILWAY_PRIVATE_DOMAIN': process.env.RAILWAY_PRIVATE_DOMAIN,
    'RAILWAY_PROJECT_NAME': process.env.RAILWAY_PROJECT_NAME,
    'RAILWAY_SERVICE_NAME': process.env.RAILWAY_SERVICE_NAME
};

console.log('📋 Current Environment Variables:');
Object.entries(vars).forEach(([key, value]) => {
    if (value) {
        if (key === 'DATABASE_URL') {
            console.log(`  ✅ ${key}: ${value.substring(0, 50)}...`);
        } else {
            console.log(`  ✅ ${key}: ${value}`);
        }
    } else {
        console.log(`  ❌ ${key}: NOT SET`);
    }
});

console.log('\n🔧 Required Variables for Railway:');
console.log('  DATABASE_URL = ${{ Postgres.DATABASE_URL }}');
console.log('  NODE_ENV = production');
console.log('  PORT = 8082');

console.log('\n📊 Railway Detection:');
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    console.log('  ✅ Railway Environment Detected');
} else {
    console.log('  ❌ Railway Environment NOT Detected');
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')) {
    console.log('  ✅ Railway PostgreSQL URL Found');
} else if (process.env.DATABASE_URL) {
    console.log('  ⚠️  DATABASE_URL found but may not be Railway');
} else {
    console.log('  ❌ DATABASE_URL NOT FOUND');
}

console.log('\n🎯 Next Steps:');
console.log('  1. Add DATABASE_URL = ${{ Postgres.DATABASE_URL }} in Railway Variables');
console.log('  2. Add NODE_ENV = production in Railway Variables');
console.log('  3. Add PORT = 8082 in Railway Variables');
console.log('  4. Redeploy the application'); 