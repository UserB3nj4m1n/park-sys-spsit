const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const HOST = '127.0.0.1';

// Pripojenie k databáze
const dbPath = path.resolve(__dirname, './database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Chyba pri pripájaní k databáze pre admin server', err.message);
    else console.log('Admin server úspešne pripojený k databáze SQLite.');
});

app.use(cors());
app.use(express.json());

// Servírovanie statických súborov
// Pre /admin/index.html, /admin/main.js
app.use('/admin', express.static(path.resolve(__dirname, '../admin')));
// Pre /css/main.css, /js/theme.js, atď.
app.use(express.static(path.resolve(__dirname, '../docs')));

// --- API Endpointy ---

// Získať všetky rezervácie
app.get('/admin/bookings', (req, res) => {
    db.all("SELECT b.id, b.slot_id, b.license_plate, b.email, b.booking_date, b.total_price, b.status, p.slot_name FROM bookings b LEFT JOIN parking_slots p ON b.slot_id = p.id ORDER BY b.id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Získať všetky parkovacie miesta
app.get('/admin/slots', (req, res) => {
    db.all("SELECT * FROM parking_slots ORDER BY id ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Upraviť rezerváciu (email a EČV)
app.put('/admin/bookings/:id', (req, res) => {
    const { email, license_plate } = req.body;
    if (!email || !license_plate) return res.status(400).json({ error: 'Email a EČV sú povinné.' });

    db.run("UPDATE bookings SET email = ?, license_plate = ? WHERE id = ?", [email, license_plate, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Rezervácia nenájdená.' });
        res.json({ message: `Rezervácia #${req.params.id} bola úspešne upravená.` });
    });
});

// Zmeniť stav rezervácie
app.put('/admin/bookings/:id/status', (req, res) => {
    const { newStatus } = req.body;
    if (!['confirmed', 'cancelled'].includes(newStatus)) return res.status(400).json({ error: 'Neplatný stav.' });

    db.get("SELECT slot_id FROM bookings WHERE id = ?", [req.params.id], (err, booking) => {
        if (err) return res.status(500).json({ error: 'Chyba pri hľadaní rezervácie.' });
        if (!booking) return res.status(404).json({ error: 'Rezervácia nenájdená.' });

        db.run("UPDATE bookings SET status = ? WHERE id = ?", [newStatus, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const newSlotStatus = (newStatus === 'cancelled') ? 'available' : 'reserved';
            db.run("UPDATE parking_slots SET status = ? WHERE id = ?", [newSlotStatus, booking.slot_id], (err) => {
                if (err) return res.status(500).json({ error: 'Stav rezervácie bol zmenený, ale nepodarilo sa upraviť stav miesta.' });
                res.json({ message: `Stav rezervácie bol zmenený na ${newStatus}.` });
            });
        });
    });
});

// Odstrániť rezerváciu
app.delete('/admin/bookings/:id', (req, res) => {
    db.get("SELECT slot_id, status FROM bookings WHERE id = ?", [req.params.id], (err, booking) => {
        if (err) return res.status(500).json({ error: 'Chyba pri hľadaní rezervácie.' });
        
        db.run("DELETE FROM bookings WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            if (booking && booking.status === 'confirmed') {
                db.run("UPDATE parking_slots SET status = 'available' WHERE id = ?", [booking.slot_id]);
            }
            res.json({ message: `Rezervácia bola úspešne odstránená.` });
        });
    });
});

// Hlavná cesta pre admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../admin/index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`Admin server beží na http://${HOST}:${PORT}`);
    console.log('Je prístupný iba z tohto stroja. Pre prístup zvonku použite SSH tunel.');
});
