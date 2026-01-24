const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually parse .env because dotenv might not find it if run weirdly
try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
        process.env.GEMINI_API_KEY = match[1].trim();
    }
} catch (e) {
    console.error("Error reading .env:", e.message);
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("CRITICAL: No GEMINI_API_KEY found.");
    process.exit(1);
}

console.log(`Checking models with key: ${apiKey.substring(0, 5)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error);
            } else if (json.models) {
                console.log("Available Models:");
                json.models.forEach(m => {
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`- ${m.name} (${m.displayName})`);
                    }
                });
            } else {
                console.log("Unexpected response:", json);
            }
        } catch (e) {
            console.error("Error parsing JSON:", e);
            console.log("Raw Response:", data);
        }
    });
}).on('error', (e) => {
    console.error("Request Error:", e);
});
