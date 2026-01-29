const { sendExternalEmail } = require("./src/lib/mail-relay");
require("dotenv").config();

async function testRelay() {
    console.log("🚀 Testing External Email Relay...");

    // We'll use a dummy/test email for verification
    const testTo = "tejaskp.ai@gmail.com";
    const testFrom = "admin@tejaskpaiportal.com";
    const testName = "Infrastructure Admin";

    const result = await sendExternalEmail(
        testTo,
        "PORTAL RELAY TEST",
        "This is a test of the external email relay system. If you see this, external delivery is working!",
        testFrom,
        testName
    );

    if (result.success) {
        console.log("✅ External relay completed successfully!");
        console.log("Message ID:", result.messageId);
    } else {
        console.error("❌ External relay failed:", result.error);
    }
}

testRelay();
