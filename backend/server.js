const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- Static File Serving ---
app.use('/uploads', express.static('uploads'));

const db = require('./database.js');
const { recognizeLicensePlate } = require('./services/ocrService');
const { sendBookingConfirmation } = require('./services/emailService');

let barrierCommand = 'wait'; // This will hold the command for the barrier ESP32

// API endpoint to get all parking slots
app.get('/api/slots', (req, res) => {
    db.all("SELECT * FROM parking_slots", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

// Basic license plate validation
function isValidLicensePlate(plate) {
    const regex = /^[a-zA-Z0-9-]{5,8}$/;
    return regex.test(plate);
}

// API endpoint to check reservation and open barrier
app.post('/api/check-reservation', bodyParser.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
    if (!req.body || req.body.length === 0) {
        return res.status(400).json({ message: 'Žiadny obrázok nebol nahraný.' });
    }

    // Write the received raw image buffer to a temporary file
    const imagePath = path.join(uploadsDir, `esp32-cam-${Date.now()}.jpg`);
    fs.writeFile(imagePath, req.body, async (err) => {
        if (err) {
            console.error('Error saving image:', err);
            return res.status(500).json({ message: 'Chyba pri ukladaní obrázka.' });
        }

        console.log(`Received image for reservation check, saved to: ${imagePath}`);
        
        try {
            const licensePlate = await recognizeLicensePlate(imagePath);
            if (!licensePlate) {
                return res.status(400).json({ message: 'Nepodarilo sa rozpoznať ŠPZ.' });
            }

            const today = new Date().toISOString().slice(0, 10);
            const query = "SELECT * FROM bookings WHERE license_plate = ? AND booking_date = ?";
            
            db.get(query, [licensePlate, today], (dbErr, row) => {
                if (dbErr) {
                    console.error('Database error:', dbErr.message);
                    return res.status(500).json({ message: 'Chyba databázy pri hľadaní rezervácie.' });
                }

                if (row) {
                    console.log(`Reservation found for license plate: ${licensePlate}`);
                    barrierCommand = 'open'; // Set the command for the ESP32 to retrieve
                    res.status(200).json({ message: 'Rezervácia nájdená. Príkaz na otvorenie rampy bol pripravený.' });
                } else {
                    console.log(`No reservation found for license plate: ${licensePlate}`);
                    res.status(404).json({ message: 'Žiadna rezervácia pre túto ŠPZ na dnes nebola nájdená.' });
                }
            });
        } catch (error) {
            console.error('Error during reservation check:', error);
            res.status(500).json({ message: 'Interná chyba servera pri kontrole rezervácie.' });
        }
    });
});

// API endpoint to create a booking
app.post('/api/bookings', (req, res) => {
    const { 
        slotId, licensePlate, email, cardholderName, cardNumber, cardExpDate, cardCvv, 
        date, startTime, endTime, price 
    } = req.body;

    if (![slotId, licensePlate, email, cardholderName, cardNumber, cardExpDate, cardCvv, date, startTime, endTime, price].every(Boolean)) {
        return res.status(400).json({ message: 'Všetky polia pre rezerváciu sú povinné.' });
    }
    if (!isValidLicensePlate(licensePlate)) {
        return res.status(400).json({ message: 'Neplatný formát ŠPZ.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Neplatný formát emailu.' });
    }

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
        
        const updateSlotQuery = "UPDATE parking_slots SET status = 'reserved' WHERE id = ?";
        db.run(updateSlotQuery, [slotId], function(err) {
            if (err) {
                console.error('Error updating slot status:', err);
                return res.status(500).json({ message: 'Rezervácia bola vytvorená, ale nepodarilo sa aktualizovať stav parkovacieho miesta.' });
            }

            db.get("SELECT slot_name FROM parking_slots WHERE id = ?", [slotId], (err, slot) => {
                if (err || !slot) {
                    console.error('Could not find slot to send email.');
                } else {
                    sendBookingConfirmation({
                        email, licensePlate, booking_date: date, startTime, endTime,
                        total_price: price, cancellation_token: cancellationToken, slot_name: slot.slot_name
                    }).catch(emailError => {
                        console.error("Failed to send confirmation email:", emailError);
                    });
                }
            });

            res.status(201).json({ message: 'Rezervácia bola úspešne vytvorená.' });
        });
    });
});

// API endpoint for cancellation
app.get('/api/barrier/command', (req, res) => {
    res.send(barrierCommand);
    // Reset the command after it has been sent
    if (barrierCommand === 'open') {
        barrierCommand = 'wait';
    }
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
                        console.error(`Failed to free slot ${booking.slot_id} for cancelled booking ${booking.id}`);
                        return res.status(500).send('<h1>Error</h1><p>Booking was cancelled, but the parking slot could not be freed. Please contact support.</p>');
                    }
                    res.send('<h1>Success</h1><p>Your booking has been successfully cancelled.</p>');
                });
            });
        });
    });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

module.exports = app;