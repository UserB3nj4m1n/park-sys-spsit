# Project Overview

This is a full-stack JavaScript application for a parking management system. It consists of a Node.js backend and a frontend built with HTML, CSS, and vanilla JavaScript.

## Backend

The backend is a Node.js application using Express.js.

- **API:** The server exposes a REST API for managing parking slots, bookings, and handling entry/exit requests.
- **Database:** It uses SQLite for its database, with the database file being `database.db`. The schema is defined in `database.js`.
- **OCR:** The system uses `tesseract.js` for Optical Character Recognition to read license plates from images uploaded by an ESP32 camera. This logic is in `backend/ocr/ocr.js` and `backend/services/ocrService.js`.
- **Hardware Integration:** A key feature is the integration with an ESP32 microcontroller to control a physical parking barrier. The `backend/services/esp32Service.js` is responsible for sending commands to the ESP32.
- **Image Uploads:** It uses `multer` to handle image uploads, saving them to the `backend/uploads` directory.

## Frontend

The frontend is a static website located in the `docs` directory.

- **Technology:** It's built with HTML, vanilla JavaScript, and styled with Tailwind CSS.
- **Functionality:** The frontend allows users to view available parking spots and make reservations. It communicates with the backend's API.

# Building and Running

## Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    The server will run on `http://localhost:3000`.

## Frontend

Open the `docs/index.html` file in a web browser. No build step is required.

# Development Conventions

- **Backend:** The backend code is structured into services, with a main `server.js` file for API routes. It follows the CommonJS module system (`require`/`module.exports`).
- **Frontend:** The frontend JavaScript in `docs/js/main.js` is written in a functional style with a focus on DOM manipulation.
- **API:** The API is RESTful, with endpoints like `GET /api/slots` and `POST /api/bookings`.
- **Styling:** The project uses Tailwind CSS for styling the frontend.
