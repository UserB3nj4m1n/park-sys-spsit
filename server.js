const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullName TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user'
            )`, (err) => {
                if (err) console.error("Error creating users table:", err.message);
            });

            db.run(`CREATE TABLE IF NOT EXISTS parking_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slot_name TEXT NOT NULL,
                level TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'available'
            )`, (err) => {
                if (err) {
                    console.error("Error creating parking_slots table:", err.message);
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                slot_id INTEGER,
                start_time TEXT,
                end_time TEXT,
                booking_date TEXT,
                total_price REAL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (slot_id) REFERENCES parking_slots (id)
            )`, (err) => {
                if (err) console.error("Error creating bookings table:", err.message);
            });
        });
    }
});

// API endpoint to get all parking slots
app.get('/api/slots', (req, res) => {
    db.all("SELECT * FROM parking_slots", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// API endpoint to create a booking
app.post('/api/bookings', (req, res) => {
    const { userId, slotId, date, startTime, endTime, price } = req.body;

    if (!userId || !slotId || !date || !startTime || !endTime || !price) {
        return res.status(400).json({ message: 'All booking fields are required.' });
    }

    const bookingQuery = 'INSERT INTO bookings (user_id, slot_id, booking_date, start_time, end_time, total_price) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(bookingQuery, [userId, slotId, date, startTime, endTime, price], function(err) {
        if (err) {
            console.error('Error creating booking:', err);
            return res.status(500).json({ message: 'Internal server error.' });
        }
        
        const updateSlotQuery = "UPDATE parking_slots SET status = 'reserved' WHERE id = ?";
        db.run(updateSlotQuery, [slotId], function(err) {
            if (err) {
                // Ideally, you'd handle this failure, e.g., by rolling back the booking
                console.error('Error updating slot status:', err);
                return res.status(500).json({ message: 'Booking created, but failed to update slot status.' });
            }
            res.status(201).json({ message: 'Booking created successfully.' });
        });
    });
});


app.post('/register', (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const query = 'INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)';
    db.run(query, [fullName, email, password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'User with this email already exists.' });
            }
            console.error('Error creating user:', err);
            return res.status(500).json({ message: 'Internal server error.' });
        }
        res.status(201).json({ message: 'User created successfully.' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.get(query, [email, password], (err, user) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).json({ message: 'Internal server error.' });
        }

        if (user) {
            // In a real app, you would return a token (e.g., JWT)
            res.status(200).json({
                message: 'Login successful.',
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is a running on http://localhost:${port}`);
});
