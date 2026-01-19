### Part 1: Backend Tasks (Your `backend/` Folder)

Your backend will be the brain of the operation. It needs to listen for the camera, process the image, update the database, command the barrier, and serve data to your frontend.

#### **Task 1: Set Up Project and Middleware**

1.  **Install Necessary Packages:** Open a terminal in your `backend` directory and run:
    ```bash
    npm install multer axios
    ```
    *   `multer`: A middleware for handling `multipart/form-data`, which is used for uploading files (our license plate image).
    *   `axios`: A popular and easy-to-use HTTP client to send commands to the barrier ESP32.

2.  **Configure Middleware in `server.js`:** You need to tell Express how to handle file uploads and where to store them.

    ```javascript
    // At the top of backend/server.js
    const multer = require('multer');
    const path = require('path');

    // ... (after app.use(cors()) and app.use(bodyParser.json()))

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
    ```

#### **Task 2: Create the Service Modules**

These modules will contain your business logic, keeping your `server.js` clean.

1.  **Create `services/esp32Service.js`:** This service will be responsible for telling the barrier to open.

    ```javascript
    // In backend/services/esp32Service.js
    const axios = require('axios');

    // IMPORTANT: Replace with the actual IP of the barrier ESP32
    const BARRIER_ESP32_IP = '192.168.1.101'; 

    async function openBarrier() {
      try {
        console.log(`Sending 'open' command to barrier at ${BARRIER_ESP32_IP}...`);
        const response = await axios.get(`http://${BARRIER_ESP32_IP}/open`);
        console.log('Barrier ESP32 responded:', response.data);
        return { success: true, message: response.data };
      } catch (error) {
        console.error('Failed to send command to barrier ESP32:', error.message);
        return { success: false, message: 'Barrier is offline or did not respond.' };
      }
    }

    module.exports = { openBarrier };
    ```

2.  **Create `services/ocrService.js`:** This will be a simple wrapper for your existing OCR functions.

    ```javascript
    // In backend/services/ocrService.js
    // This assumes your OCR functions are in ocr/main.js or similar
    // const { performOcr } = require('../ocr/your-ocr-file'); 

    async function recognizeLicensePlate(imagePath) {
      try {
        console.log(`Performing OCR on image: ${imagePath}`);
        // This is a placeholder for your actual OCR function call
        // const licensePlate = await performOcr(imagePath);
        const licensePlate = "FAKE-PLATE-123"; // Replace with your real function
        
        if (!licensePlate) {
          throw new Error('OCR did not detect a license plate.');
        }

        console.log(`OCR Result: ${licensePlate}`);
        return licensePlate;
      } catch (error) {
        console.error('OCR Service Error:', error.message);
        // Return null or throw the error to be handled by the controller
        return null; 
      }
    }

    module.exports = { recognizeLicensePlate };
    ```

#### **Task 3: Create the Main API Endpoint**

This is the core endpoint that the ESP32-CAM will call.

1.  **Create `database.js`**
     In `database.js`, create a new table called `parking_entries` for the incoming cars.

    ```javascript
    // In backend/database.js

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
    });
    
    module.exports = db;
    ```
2.  **Update the endpoint in `server.js`:**
    
    ```javascript
    // In backend/server.js
    
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
    ```

---

### Part 2: Frontend Tasks (Your `docs/` Folder)

Your frontend needs to display the data that the backend is now collecting.

#### **Task 1: Display Currently Parked Cars (`index.html`)**

1.  **Add a Container in `index.html`:** Add a placeholder in your `index.html` where the list of cars will go.

    ```html
    <!-- In docs/index.html, inside the main content area -->
    <h2 class="text-2xl font-bold mb-4">Currently Parked Vehicles</h2>
    <div id="currently-parked-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Car cards will be inserted here by JavaScript -->
    </div>
    ```

2.  **Create Fetch Logic in `js/main.js`:** Write a function to get the data from the backend and display it.

    ```javascript
    // In docs/js/main.js

    document.addEventListener('DOMContentLoaded', () => {
        // Fetch data when the page loads
        fetchCurrentlyParked();

        // And then fetch it again every 15 seconds
        setInterval(fetchCurrentlyParked, 15000);
    });

    async function fetchCurrentlyParked() {
        const container = document.getElementById('currently-parked-container');
        try {
            const response = await fetch('http://localhost:3000/api/parking/current');
            const result = await response.json();

            if (result.message !== 'success') {
                throw new Error('Failed to fetch data.');
            }

            // Clear previous entries
            container.innerHTML = '';

            if (result.data.length === 0) {
                container.innerHTML = '<p class="text-gray-500">No vehicles are currently parked.</p>';
                return;
            }

            // Create a card for each vehicle
            result.data.forEach(car => {
                const entryTime = new Date(car.entry_time).toLocaleString();
                const carCard = `
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <img src="http://localhost:3000/${car.image_path}" alt="License Plate" class="rounded-md mb-2 w-full h-32 object-cover"/>
                        <h3 class="font-bold text-lg">${car.license_plate}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Entered: ${entryTime}</p>
                    </div>
                `;
                container.innerHTML += carCard;
            });

        } catch (error) {
            console.error('Error fetching parked cars:', error);
            container.innerHTML = '<p class="text-red-500">Could not load data from the server.</p>';
        }
    }
    ```

This detailed plan provides a complete roadmap for the software side of the project. Completing these tasks will result in a fully functional system that integrates with the hardware your partner is building.