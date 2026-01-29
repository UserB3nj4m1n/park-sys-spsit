const request = require('supertest');
const app = require('../server');
const db = require('../database');
const path = require('path');
const { openBarrier } = require('../services/esp32Service');

// Mock the external services to isolate the API for testing
jest.mock('../services/emailService', () => ({
    sendBookingConfirmation: jest.fn().mockResolvedValue(),
}));
jest.mock('../services/esp32Service', () => ({
    openBarrier: jest.fn().mockResolvedValue(),
}));

describe('ESP32 Entry Check API', () => {
    const testLicensePlate = '7C25025';
    const imagePath = path.join(__dirname, 'test_spz.png');

    // Utility function to add a booking for the test
    const addTestBooking = (licensePlate, date) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO bookings (slot_id, license_plate, booking_date, status) VALUES (?, ?, ?, ?)`;
            // Using slot_id 1 as a placeholder
            db.run(query, [1, licensePlate, date, 'confirmed'], function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    };

    // Clean up mocks and database before each test
    beforeEach(async () => {
        jest.clearAllMocks();
        await new Promise((resolve) => db.run("DELETE FROM bookings", resolve));
    });

    it('should grant entry if a valid booking exists for today', async () => {
        // 1. Create a booking for today for our test license plate
        const today = new Date().toISOString().slice(0, 10);
        await addTestBooking(testLicensePlate, today);

        // 2. Simulate ESP32 sending the image
        const response = await request(app)
            .post('/api/check-reservation')
            .attach('image', imagePath);

        // 3. Assert the response is correct and the barrier was opened
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Rezervácia nájdená. Rampa sa otvára.');
        expect(openBarrier).toHaveBeenCalledTimes(1);
    });

    it('should deny entry if no booking exists for the license plate', async () => {
        // 1. Ensure no booking exists for this license plate (done by beforeEach)
        
        // 2. Simulate ESP32 sending the image
        const response = await request(app)
            .post('/api/check-reservation')
            .attach('image', imagePath);

        // 3. Assert the response is correct and the barrier was NOT opened
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Žiadna rezervácia pre túto ŠPZ na dnes nebola nájdená.');
        expect(openBarrier).not.toHaveBeenCalled();
    });

    it('should deny entry if a booking exists but for a different day', async () => {
        // 1. Create a booking for YESTERDAY
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        await addTestBooking(testLicensePlate, yesterdayStr);

        // 2. Simulate ESP32 sending the image
        const response = await request(app)
            .post('/api/check-reservation')
            .attach('image', imagePath);

        // 3. Assert the response is correct and the barrier was NOT opened
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Žiadna rezervácia pre túto ŠPZ na dnes nebola nájdená.');
        expect(openBarrier).not.toHaveBeenCalled();
    });
});
