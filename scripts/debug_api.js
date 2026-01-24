const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in in Node 18+

async function testApi() {
    try {
        console.log("Testing GET /api/announcements via local fetch...");
        // Attempts to hit the local server. Note: Port 3000 might be in use by the user's dev server.
        // If I can't hit localhost:3000 from here (if I'm in a container), this might fail.
        // But usually I can.
        const res = await fetch('http://localhost:3000/api/announcements');
        const data = await res.json();
        console.log("GET Response:", JSON.stringify(data, null, 2));

        if (res.status === 500) {
            console.log("Got 500 error. Details should be above.");
        }
    } catch (e) {
        console.error("Request failed (Server might be down or unreachable):", e.message);
    }
}

testApi();
