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
3.  **Install dependencies:**
    ```bash
    npm install
    ```

### Frontend

The frontend is located in the `docs` directory and requires no special installation.

## Usage

1.  **Start the backend server:**
    ```bash
    node server.js
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

The main functions and classes are located in the `server.js` file for the backend and in the `docs/js` directory for the frontend.

## Services

This project uses the following services:

- **GitHub:** For version control and code hosting.
- **Tailwind CSS:** For UI styling.
