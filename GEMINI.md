# Gemini Project Context: Smart Parking System

## Project Overview

This project is a web application for a "Smart Parking System". It provides a user-facing dashboard to view parking availability and book spots, and a comprehensive admin panel for managing the system.

The application is structured as a multi-page website built with vanilla HTML and styled with Tailwind CSS (loaded via a CDN). JavaScript files exist but are currently placeholders.

### Key Pages:

*   `src/index.html`: The main user dashboard displaying live parking availability.
*   `src/admin.html`: The main admin dashboard overview.
*   `src/admin_slots.html`: Admin page for managing individual parking slots.
*   `src/admin_users.html`: Admin page for managing user accounts.
*   `src/login.html`: A dedicated page for user login and registration.
*   `src/book.html`: A page for users to book a specific parking slot.

## Building and Running

This project is a static website and does not require a build step.

### Running the Application

1.  **Directly in Browser**: Open any of the `.html` files from the `src` directory directly in your web browser.
2.  **Using a Local Server (Recommended)**: For a more realistic development environment (and to avoid potential issues with browser security policies), run a simple local web server from the project's root directory. For example, if you have Python installed:
    ```sh
    python -m http.server
    ```
    Then, navigate to `http://localhost:8000/src/` in your browser.

### Testing

There are currently no automated tests in this project.

## Development Conventions

*   **Styling**: The project uses **Tailwind CSS**, which is included via a CDN link in the `<head>` of each HTML file. Customizations are configured directly within a `<script>` tag.
*   **Structure**: The `src` directory is the main container for the application.
    *   `css/`: Contains stylesheets.
    *   `js/`: Contains JavaScript files, separated by page.
    *   `assets/`: Intended for images, icons, and other static assets.
*   **Source Files**: The original HTML component files (previously in `src/admin_*` and `src/user_*` directories) have been integrated into the main `.html` pages.

### TODO / Next Steps

The original `admin_*` and `user_*` directories that contained the initial HTML snippets and screenshots are now obsolete. It is recommended to **delete these directories** to finalize the project cleanup.
