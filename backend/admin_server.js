const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001; // Iný port ako hlavná aplikácia
const HOST = '127.0.0.1'; // Počúvať iba na localhost

// Pripojenie k rovnakej databáze
const dbPath = path.resolve(__dirname, './database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Chyba pri pripájaní k databáze pre admin server', err.message);
    } else {
        console.log('Admin server úspešne pripojený k databáze SQLite.');
    }
});

app.use(cors());
app.use(express.json());

// Servírovanie statických súborov
app.use(express.static(path.resolve(__dirname, '../admin'))); // Pre admin/index.html, admin/main.js
app.use(express.static(path.resolve(__dirname, '../docs')));  // Pre css/main.css, js/theme.js

// --- API Endpointy pre Admin Panel ---

// Endpoint na získanie všetkých rezervácií
app.get('/admin/bookings', (req, res) => {
    db.all("SELECT b.id, b.slot_id, b.license_plate, b.email, b.booking_date, b.total_price, b.status, p.slot_name FROM bookings b LEFT JOIN parking_slots p ON b.slot_id = p.id ORDER BY b.id DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Endpoint na získanie všetkých parkovacích miest
app.get('/admin/slots', (req, res) => {
    db.all("SELECT * FROM parking_slots ORDER BY id ASC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Endpoint na úpravu rezervácie (email a EČV)
app.put('/admin/bookings/:id', (req, res) => {
    const bookingId = req.params.id;
    const { email, license_plate } = req.body;

    if (!email || !license_plate) {
        return res.status(400).json({ error: 'Email a EČV sú povinné.' });
    }

    db.run("UPDATE bookings SET email = ?, license_plate = ? WHERE id = ?", [email, license_plate, bookingId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Rezervácia nenájdená.' });
        }
        res.json({ message: `Rezervácia #${bookingId} bola úspešne upravená.` });
    });
});


// Endpoint na odstránenie rezervácie
app.delete('/admin/bookings/:id', (req, res) => {
    const bookingId = req.params.id;
    // Najprv zistíme, aké parkovacie miesto je s rezerváciou spojené
    db.get("SELECT slot_id, status FROM bookings WHERE id = ?", [bookingId], (err, booking) => {
        if (err) {
            return res.status(500).json({ error: 'Chyba pri hľadaní rezervácie.' });
        }
        if (!booking) {
            // Ak rezervácia neexistuje, môžeme ju rovno považovať za "odstránenú"
            return res.json({ message: `Rezervácia ${bookingId} už neexistuje.` });
        }

        db.run("DELETE FROM bookings WHERE id = ?", [bookingId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            // Ak bola rezervácia potvrdená, uvoľníme parkovacie miesto
            if (booking.status === 'confirmed') {
                db.run("UPDATE parking_slots SET status = 'available' WHERE id = ?", [booking.slot_id], (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Rezervácia bola odstránená, ale nepodarilo sa uvoľniť miesto.' });
                    }
                    res.json({ message: `Rezervácia ${bookingId} bola úspešne odstránená a miesto uvoľnené.` });
                });
            } else {
                res.json({ message: `Rezervácia ${bookingId} bola úspešne odstránená.` });
            }
        });
    });
});

// Endpoint na zmenu stavu rezervácie
app.put('/admin/bookings/:id/status', (req, res) => {
    const bookingId = req.params.id;
    const { newStatus } = req.body;

    if (!['confirmed', 'cancelled'].includes(newStatus)) {
        return res.status(400).json({ error: 'Neplatný stav.' });
    }

    db.get("SELECT slot_id, status FROM bookings WHERE id = ?", [bookingId], (err, booking) => {
        if (err) {
            return res.status(500).json({ error: 'Chyba pri hľadaní rezervácie.' });
        }
        if (!booking) {
            return res.status(404).json({ error: 'Rezervácia nenájdená.' });
        }

        db.run("UPDATE bookings SET status = ? WHERE id = ?", [newStatus, bookingId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            // Logika na úpravu stavu parkovacieho miesta
            const newSlotStatus = (newStatus === 'cancelled') ? 'available' : 'reserved';
            db.run("UPDATE parking_slots SET status = ? WHERE id = ?", [newSlotStatus, booking.slot_id], (err) => {
                if (err) {
                     return res.status(500).json({ error: 'Stav rezervácie bol zmenený, ale nepodarilo sa upraviť stav miesta.' });
                }
                res.json({ message: `Stav rezervácie ${bookingId} bol zmenený na ${newStatus} a stav miesta upravený.` });
            });
        });
    });
});


// Hlavná cesta na servírovanie admin panelu
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../admin/index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`Admin server beží na http://${HOST}:${PORT}`);
    console.log('Je prístupný iba z tohto stroja. Pre prístup zvonku použite SSH tunel.');
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Databázové pripojenie admin servera bolo ukončené.');
        process.exit(0);
    });
});