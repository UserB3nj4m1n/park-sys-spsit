const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    // Keep only the table for parking entries
    db.run(`CREATE TABLE IF NOT EXISTS parking_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_plate TEXT NOT NULL,
        entry_time DATETIME NOT NULL,
        image_path TEXT,
        exit_time DATETIME
    )`);

    // The users, parking_slots, and bookings tables will no longer be created.
});

module.exports = db;