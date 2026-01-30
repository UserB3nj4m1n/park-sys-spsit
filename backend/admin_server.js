const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const HOST = '127.0.0.1';

const dbPath = path.resolve(__dirname, './database.db');
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());

// Servírovanie statických súborov
app.use('/admin', express.static(path.resolve(__dirname, '../admin')));

// API Endpointy
app.get('/admin/bookings', (req, res) => {
    db.all("SELECT * FROM bookings ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/admin/slots', (req, res) => {
    db.all("SELECT * FROM parking_slots ORDER BY id ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Hlavná cesta - presmerovanie na admin panel
app.get('/', (req, res) => {
    res.redirect('/admin');
});
app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../admin/index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`Admin server beží na http://${HOST}:${PORT}`);
});