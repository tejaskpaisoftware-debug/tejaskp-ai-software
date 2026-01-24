async function main() {
    const url = 'http://localhost:3000/api/admin/invoices';
    const invoiceData = {
        customerName: "Duplicate Test User",
        type: "TRAINING",
        total: 500,
        items: [{ description: "Test Item", amount: 500 }]
    };

    console.log("Attempting to create first invoice...");
    const res1 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
    });
    console.log(`Response 1: ${res1.status} - ${await res1.text()}`);

    console.log("Attempting to create duplicate invoice immediately...");
    const res2 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
    });
    console.log(`Response 2: ${res2.status} - ${await res2.text()}`);

    if (res2.status === 429) {
        console.log("SUCCESS: Duplicate invoice blocked.");
    } else {
        console.log("FAILURE: Duplicate invoice was NOT blocked.");
    }
}

main();
