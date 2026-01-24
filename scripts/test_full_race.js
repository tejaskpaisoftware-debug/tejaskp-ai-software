const BASE_URL = 'http://localhost:3000';

async function test() {
    console.log("🏁 Starting Full Race API Test...");
    try {
        // 1. Host creates session
        console.log("1. Host creating session...");
        const sessionRes = await fetch(`${BASE_URL}/api/games/f1/session`, { method: 'POST' });
        const sessionData = await sessionRes.json();
        if (!sessionData.success) throw new Error("Create Failed: " + JSON.stringify(sessionData));

        const sessionId = sessionData.session.id;
        console.log("   ✅ Session Created:", sessionId);

        // 2. Host Joins
        console.log("2. Host joining...");
        const hostJoinRes = await fetch(`${BASE_URL}/api/games/f1/session/${sessionId}/join`, {
            method: 'POST',
            body: JSON.stringify({ name: "Host", carColor: "red" })
        });
        const hostJoinData = await hostJoinRes.json();
        if (!hostJoinData.success) throw new Error("Host Join Failed: " + JSON.stringify(hostJoinData));
        console.log("   ✅ Host Joined:", hostJoinData.player.id);

        // 3. Guest Joins (Simulating the user's failed step)
        console.log("3. Guest joining...");
        const guestJoinRes = await fetch(`${BASE_URL}/api/games/f1/session/${sessionId}/join`, {
            method: 'POST',
            body: JSON.stringify({ name: "Guest", carColor: "blue" })
        });
        const guestJoinData = await guestJoinRes.json();

        if (!guestJoinData.success) {
            console.error("❌ Guest Join Failed:", guestJoinData);
            throw new Error("Guest Join Failed");
        }
        console.log("   ✅ Guest Joined:", guestJoinData.player.id);

        console.log("✨ SUCCESS: Backend is working perfectly.");

    } catch (e) {
        console.error("❌ TEST FAILED:", e.message);
    }
}

test();
