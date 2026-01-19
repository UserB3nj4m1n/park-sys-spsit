const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Create an 'uploads' directory if it doesn't exist
const fs = require('fs');
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// --- Multer Configuration ---
// This tells multer to save uploaded files to the 'uploads/' directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent overwrites
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- Static File Serving ---
// This makes the 'uploads' folder publicly accessible via HTTP
// So the frontend can display the images
app.use('/uploads', express.static('uploads'));

const db = require('./database.js'); // your database connection
const { recognizeLicensePlate } = require('./services/ocrService');
const { openBarrier } = require('./services/esp32Service');

// API endpoint for entry requests from the ESP32-CAM
app.post('/api/parking/entry-request', upload.single('image'), async (req, res) => {
  // The 'upload.single('image')' part uses multer to process the uploaded file.
  // The field name 'image' MUST match the one used in the ESP32-CAM code.

  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded.' });
  }

  const imagePath = req.file.path;
  console.log(`Received image, saved to: ${imagePath}`);

  // 1. Perform OCR
  const licensePlate = await recognizeLicensePlate(imagePath);
  if (!licensePlate) {
    return res.status(500).json({ message: 'Failed to recognize license plate.' });
  }

  // 2. Save to Database
  const entryTime = new Date().toISOString();
  const query = `INSERT INTO parking_entries (license_plate, entry_time, image_path) VALUES (?, ?, ?)`;
  
  db.run(query, [licensePlate, entryTime, imagePath], async function(err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to save parking entry.' });
    }

    console.log(`New entry created with ID: ${this.lastID}`);

    // 3. Open the Barrier
    await openBarrier();

    // 4. Send Success Response
    res.status(200).json({
      message: 'Entry processed successfully.',
      licensePlate: licensePlate,
      entryTime: entryTime
    });
  });
});

// API endpoint for the frontend to get currently parked cars
app.get('/api/parking/current', (req, res) => {
    const query = "SELECT * FROM parking_entries WHERE exit_time IS NULL ORDER BY entry_time DESC";
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// API endpoint for the frontend to get all parking history
app.get('/api/parking/history', (req, res) => {
    const query = "SELECT * FROM parking_entries ORDER BY entry_time DESC";
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
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
