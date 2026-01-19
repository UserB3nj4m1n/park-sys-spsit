const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    // Table for the automatic OCR entry system
    db.run(`CREATE TABLE IF NOT EXISTS parking_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_plate TEXT NOT NULL,
        entry_time DATETIME NOT NULL,
        image_path TEXT,
        exit_time DATETIME
    )`);

    // Table for the manual booking system (simplified)
    db.run(`CREATE TABLE IF NOT EXISTS parking_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_name TEXT NOT NULL,
        level TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available'
    )`);

    // Simplified bookings table without user_id
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_id INTEGER,
        start_time TEXT,
        end_time TEXT,
        booking_date TEXT,
        total_price REAL,
        FOREIGN KEY (slot_id) REFERENCES parking_slots (id)
    )`);
});

module.exports = db;
