require('dotenv').config();
const imaps = require('imap-simple');

const variants = [
    { host: "imap.titan.email", port: 993, tls: true },
    { host: "imap.secureserver.net", port: 993, tls: true },
];

async function testImap(variant) {
    console.log(`\n🧪 Testing IMAP ${variant.host}:${variant.port}...`);

    const config = {
        imap: {
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASS,
            host: variant.host,
            port: variant.port,
            tls: variant.tls,
            authTimeout: 5000,
        }
    };

    try {
        const connection = await imaps.connect(config);
        console.log(`✅ SUCCESS! Connected to ${variant.host}`);
        await connection.end();
        return true;
    } catch (error) {
        console.log(`❌ Connection Error on ${variant.host}: ${error.code || error.message}`);
        return false;
    }
}

async function runTests() {
    console.log(`👤 User: ${process.env.SMTP_USER}`);

    for (const variant of variants) {
        if (await testImap(variant)) {
            console.log(`\n🎉 WE FOUND A WORKING IMAP HOST: ${variant.host}`);
            // Also checking environment variable consistency
            if (process.env.IMAP_HOST !== variant.host) {
                console.log("Recommend adding IMAP_HOST to .env");
            }
            process.exit(0);
        }
    }
    console.log("\n😭 All IMAP variants failed.");
    process.exit(1);
}

runTests();
