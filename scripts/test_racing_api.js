const BASE_URL = 'http://localhost:3000';

async function test() {
    try {
        console.log("1. Creating Session...");
        const sessionRes = await fetch(`${BASE_URL}/api/games/f1/session`, { method: 'POST' });
        const sessionData = await sessionRes.json();

        if (!sessionData.success) throw new Error("Create Session Failed: " + JSON.stringify(sessionData));
        const sessionId = sessionData.session.id;
        console.log("   Session Created:", sessionId);

        console.log("2. Joining as Host...");
        const hostRes = await fetch(`${BASE_URL}/api/games/f1/session/${sessionId}/join`, {
            method: 'POST',
            body: JSON.stringify({ name: "Host Player", carColor: "red" })
        });
        const hostData = await hostRes.json();
        if (!hostData.success) throw new Error("Host Join Failed");
        console.log("   Host Joined:", hostData.player.id);

        console.log("3. Joining as Guest...");
        const guestRes = await fetch(`${BASE_URL}/api/games/f1/session/${sessionId}/join`, {
            method: 'POST',
            body: JSON.stringify({ name: "Guest Player", carColor: "blue" })
        });
        const guestData = await guestRes.json();
        if (!guestData.success) throw new Error("Guest Join Failed");
        console.log("   Guest Joined:", guestData.player.id);

        console.log("4. Starting Race...");
        const startRes = await fetch(`${BASE_URL}/api/games/f1/session/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify({ sessionStatus: 'RACING' })
        });
        const startData = await startRes.json();
        if (!startData.success) throw new Error("Start Race Failed");
        console.log("   Race Started");

        console.log("5. Verifying State...");
        const stateRes = await fetch(`${BASE_URL}/api/games/f1/session/${sessionId}`);
        const stateData = await stateRes.json();

        const session = stateData.session;
        console.log(`   Status: ${session.status}`);
        console.log(`   Players: ${session.players.length}`);

        if (session.status !== 'RACING') throw new Error("Status mismatch");
        if (session.players.length !== 2) throw new Error("Player count mismatch");

        console.log("✅ API VERIFICATION SUCCESSFUL");

    } catch (e) {
        console.error("❌ API VERIFICATION FAILED:", e);
    }
}

test();
