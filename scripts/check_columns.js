const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dev.db');

db.serialize(() => {
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Columns in users table:");
            console.table(rows);

            const hasSalary = rows.some(r => r.name === 'salaryDetails');
            console.log("Has salaryDetails?", hasSalary);
        }
    });
});

db.close();
