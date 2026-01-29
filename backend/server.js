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
    return res.status(400).json({ message: 'Žiadny obrázok nebol nahraný.' });
  }

  const imagePath = req.file.path;
  console.log(`Received image, saved to: ${imagePath}`);

  // 1. Perform OCR
  const licensePlate = await recognizeLicensePlate(imagePath);
  if (!licensePlate) {
    return res.status(500).json({ message: 'Nepodarilo sa rozpoznať ŠPZ.' });
  }

  // 2. Save to Database
  const entryTime = new Date().toISOString();
  const query = `INSERT INTO parking_entries (license_plate, entry_time, image_path) VALUES (?, ?, ?)`;
  
  db.run(query, [licensePlate, entryTime, imagePath], async function(err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Nepodarilo sa uložiť záznam o parkovaní.' });
    }

    console.log(`New entry created with ID: ${this.lastID}`);

    // 3. Open the Barrier
    await openBarrier();

    // 4. Send Success Response
    res.status(200).json({
      message: 'Vstup bol úspešne spracovaný.',
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

// Basic license plate validation
function isValidLicensePlate(plate) {
    // Example: Allows alphanumeric characters and hyphens, 5 to 8 characters long
    const regex = /^[a-zA-Z0-9-]{5,8}$/;
    return regex.test(plate);
}

// API endpoint to check reservation and open barrier
app.post('/api/check-reservation', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Žiadny obrázok nebol nahraný.' });
    }

    const imagePath = req.file.path;
    console.log(`Received image for reservation check, saved to: ${imagePath}`);

    try {
        const licensePlate = await recognizeLicensePlate(imagePath);
        if (!licensePlate) {
            return res.status(400).json({ message: 'Nepodarilo sa rozpoznať ŠPZ.' });
        }

        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const query = "SELECT * FROM bookings WHERE license_plate = ? AND booking_date = ?";
        
        db.get(query, [licensePlate, today], async (err, row) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ message: 'Chyba databázy pri hľadaní rezervácie.' });
            }

            if (row) {
                // Found a reservation for today
                console.log(`Reservation found for license plate: ${licensePlate}`);
                await openBarrier();
                res.status(200).json({ message: 'Rezervácia nájdená. Rampa sa otvára.' });
            } else {
                // No reservation found
                console.log(`No reservation found for license plate: ${licensePlate}`);
                res.status(404).json({ message: 'Žiadna rezervácia pre túto ŠPZ na dnes nebola nájdená.' });
            }
        });
    } catch (error) {
        console.error('Error during reservation check:', error);
        res.status(500).json({ message: 'Interná chyba servera pri kontrole rezervácie.' });
    }
});


// API endpoint to create a booking (anonymous)
app.post('/api/bookings', (req, res) => {
    const { 
        slotId, 
        licensePlate, 
        email,
        cardholderName,
        cardNumber,
        cardExpDate,
        cardCvv,
        date, 
        startTime, 
        endTime, 
        price 
    } = req.body;

    // --- Validation ---
    if (!slotId || !licensePlate || !email || !cardholderName || !cardNumber || !cardExpDate || !cardCvv || !date || !startTime || !endTime || !price) {
        return res.status(400).json({ message: 'Všetky polia pre rezerváciu sú povinné.' });
    }

    if (!isValidLicensePlate(licensePlate)) {
        return res.status(400).json({ message: 'Neplatný formát ŠPZ.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Neplatný formát emailu.' });
    }
    // --- End Validation ---

    const cancellationToken = crypto.randomBytes(16).toString('hex');

    const bookingQuery = `
        INSERT INTO bookings (
            slot_id, license_plate, email, cardholder_name, card_number, card_exp_date, card_cvv, 
            booking_date, start_time, end_time, total_price, cancellation_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        slotId, licensePlate, email, cardholderName, cardNumber, cardExpDate, cardCvv, 
        date, startTime, endTime, price, cancellationToken
    ];

    db.run(bookingQuery, params, function(err) {
        if (err) {
            console.error('Error creating booking:', err);
            return res.status(500).json({ message: 'Interná chyba servera.' });
        }
        
        const bookingId = this.lastID;
        const updateSlotQuery = "UPDATE parking_slots SET status = 'reserved' WHERE id = ?";
        db.run(updateSlotQuery, [slotId], function(err) {
            if (err) {
                console.error('Error updating slot status:', err);
                return res.status(500).json({ message: 'Rezervácia bola vytvorená, ale nepodarilo sa aktualizovať stav parkovacieho miesta.' });
            }

            // Get slot name to include in email
            db.get("SELECT slot_name FROM parking_slots WHERE id = ?", [slotId], (err, slot) => {
                if (err || !slot) {
                    console.error('Could not find slot to send email.');
                } else {
                    sendBookingConfirmation({
                        email,
                        licensePlate,
                        booking_date: date,
                        startTime,
                        endTime,
                        total_price: price,
                        cancellation_token: cancellationToken,
                        slot_name: slot.slot_name
                    }).catch(emailError => {
                        console.error("Failed to send confirmation email:", emailError);
                    });
                }
            });

            res.status(201).json({ message: 'Rezervácia bola úspešne vytvorená.' });
        });
    });
});

app.get('/api/bookings/cancel/:token', (req, res) => {
    const { token } = req.params;

    db.get("SELECT * FROM bookings WHERE cancellation_token = ? AND status = 'confirmed'", [token], (err, booking) => {
        if (err) {
            return res.status(500).send('<h1>Error</h1><p>A database error occurred.</p>');
        }
        if (!booking) {
            return res.status(404).send('<h1>Not Found</h1><p>This booking was not found or has already been cancelled.</p>');
        }

        db.serialize(() => {
            db.run("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking.id], function(err) {
                if (err) {
                    return res.status(500).send('<h1>Error</h1><p>Failed to update booking status.</p>');
                }

                db.run("UPDATE parking_slots SET status = 'available' WHERE id = ?", [booking.slot_id], function(err) {
                    if (err) {
                        // This is problematic, the booking is cancelled but the slot is not freed.
                        // For this project, we'll just log it. A real app would need a transaction.
                        console.error(`Failed to free slot ${booking.slot_id} for cancelled booking ${booking.id}`);
                        return res.status(500).send('<h1>Error</h1><p>Booking was cancelled, but the parking slot could not be freed. Please contact support.</p>');
                    }
                    
                    res.send('<h1>Success</h1><p>Your booking has been successfully cancelled.</p>');
                });
            });
        });
    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
