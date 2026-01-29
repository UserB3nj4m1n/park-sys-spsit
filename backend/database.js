const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS parking_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_plate TEXT NOT NULL,
        entry_time DATETIME NOT NULL,
        image_path TEXT,
        exit_time DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS parking_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_name TEXT NOT NULL,
        level TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available'
    )`);

    // Added license_plate column to bookings
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_id INTEGER,
        license_plate TEXT,
        email TEXT,
        cardholder_name TEXT,
        card_number TEXT,
        card_exp_date TEXT,
        card_cvv TEXT,
        start_time TEXT,
        end_time TEXT,
        booking_date TEXT,
        total_price REAL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        cancellation_token TEXT,
        FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
    )`);

    // Clear existing slots to prevent duplication on restart
    db.run("DELETE FROM parking_slots");
    db.run("DELETE FROM sqlite_sequence WHERE name='parking_slots'");


    // Insert some sample data into parking_slots
    const slots = [
        { name: 'A1', level: 'A'},
        { name: 'A2', level: 'A'},
        { name: 'A3', level: 'A'},
        { name: 'B1', level: 'B'},
        { name: 'B2', level: 'B'},
    ];

    const stmt = db.prepare("INSERT INTO parking_slots (slot_name, level, status) VALUES (?, ?, 'available')");
    slots.forEach(slot => {
        stmt.run(slot.name, slot.level);
    });
    stmt.finalize();
});

module.exports = db;