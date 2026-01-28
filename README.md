# Project Overview

This is a web application for a parking management system. It allows users to view available parking spots, book them, and manage their accounts. The application consists of a Node.js backend using Express.js and a frontend built with HTML, Tailwind CSS, and vanilla JavaScript. The database is SQLite.

## Installation

### Prerequisites

- Node.js
- npm (Node Package Manager)

### Backend

To run the backend server, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/UserB3nj4m1n/park-sys-spsit.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd park-sys
    ```
3.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
4.  **Install dependencies:**
    ```bash
    npm install
    ```

### Frontend

The frontend is located in the `docs` directory and requires no special installation.

## Usage

1.  **Start the backend server:**
    From the `backend` directory, run:
    ```bash
    npm start
    ```
    The server will start on `http://localhost:3000`.

2.  **Open the frontend:**
    Open the `docs/index.html` file in your web browser.

## API Reference

The API is documented in the `server.js` file. Here are the main endpoints:

- `GET /api/slots`: Get all parking slots.
- `POST /api/bookings`: Create a new booking.
- `POST /register`: Register a new user.
- `POST /login`: Log in a user.

### Functions and Classes

The main functions and classes are located in the `backend/server.js` file for the backend and in the `docs/js` directory for the frontend.

## Services

This project uses the following services:

- **GitHub:** For version control and code hosting.
- **Tailwind CSS:** For UI styling.

## File Structure and Explanations

Here is a breakdown of the important files in this project:

### Root Directory

-   `ESP32_INSTRUCTIONS.md`: Provides detailed instructions for setting up the ESP32 camera and server to communicate with the backend, including API endpoints and sample code.
-   `README.md`: The main README file for the project, providing an overview, installation instructions, and other relevant information.

### `backend/`

-   `server.js`: The main entry point for the Node.js backend. It uses Express.js to create a web server, defines API endpoints for the parking system (e.g., for handling entry requests, fetching parking data, and managing bookings), and integrates with other services like OCR and the ESP32. It also uses `multer` for handling image uploads from the ESP32 camera.
-   `.gitignore`: Specifies files and directories that should be ignored by Git, such as `node_modules`, `.env` files, and the SQLite database file.
-   `database.js`: Sets up the SQLite database connection and initializes the database schema. It creates tables for `parking_entries`, `parking_slots`, and `bookings`, and it pre-populates the `parking_slots` table with sample data.
-   `package.json`: The standard npm manifest file that contains project metadata, a list of dependencies, and scripts for running the application (e.g., `npm start`).
-   `seed.js`: A utility script to populate the database with initial sample data. It clears existing data and inserts new records into the `parking_slots`, `bookings`, and `parking_entries` tables.

#### `backend/ocr/`

-   `ocr.js`: Contains the core OCR logic using the `tesseract.js` library. The `recognizeLicensePlate` function takes an image path and returns the recognized text after cleaning it to match a license plate format.

#### `backend/services/`

-   `esp32Service.js`: Provides a function to communicate with the ESP32 that controls the physical parking barrier. The `openBarrier` function sends an HTTP request to a predefined IP address on the ESP32 to trigger the barrier opening mechanism.
-   `ocrService.js`: Acts as a service layer for the OCR functionality. It calls the OCR recognition function and includes additional logic for logging and error handling, providing a cleaner interface for the main server to use.

### `docs/`

This directory contains all the frontend files.

-   `index.html`: The main HTML file for the user-facing application. It defines the structure of the parking reservation interface, including the parking map and the booking form.
-   `css/main.css`: Contains custom CSS styles that are used in addition to Tailwind CSS for specific design adjustments, such as styling for Google's Material Symbols.
-   `js/main.js`: The core JavaScript file for the frontend. It handles fetching parking slot data from the backend, rendering the parking map, managing user interactions (like selecting a slot and filling out the booking form), and sending the booking request back to the server.
-   `js/theme.js`: Manages the theme (light/dark mode) of the application. It saves the user's preference in `localStorage` and applies the correct theme on page load.
