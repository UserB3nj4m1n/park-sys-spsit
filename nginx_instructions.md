### 2. Configure Nginx

You'll need to create a configuration file for your site in Nginx (e.g., in `/etc/nginx/sites-available/park-sys`). This file will tell Nginx how to handle requests.

Here is a sample configuration. **You will need to change** `your_domain.com` to your server's domain or IP address, and `/path/to/your/project` to the actual path where you've placed the project files on the server.

```nginx
server {
    listen 80;
    server_name your_domain.com;

    # Path to your frontend files
    root /path/to/your/project/docs;
    index index.html;

    # Location for all API requests
    # All requests starting with /api/ will be forwarded to the Node.js backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Location for serving static frontend files
    # This tries to find the file directly, and if it can't,
    # it serves index.html (useful for single-page applications)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

After creating and saving this file, you need to enable it by creating a symbolic link and then reload Nginx:

```bash
#
# On your server
#

# Link the config to the sites-enabled directory
sudo ln -s /etc/nginx/sites-available/park-sys /etc/nginx/sites-enabled/

# Test the Nginx configuration for syntax errors
sudo nginx -t

# Reload Nginx to apply the changes
sudo systemctl reload nginx
```

### 3. Run the Backend with a Process Manager

On a server, you should not run your backend directly with `npm start` because it will stop as soon as you close your terminal. You should use a process manager like **PM2**. It will keep your application running in the background and even restart it automatically if it crashes.

**Installation and Usage:**

```bash
#
# On your server
#

# Install PM2 globally
sudo npm install -g pm2

# Navigate to your backend directory
cd /path/to/your/project/backend

# Install backend dependencies
npm install

# Start the server with PM2
pm2 start server.js --name park-sys-backend
```

Your backend is now running. You can check its status with `pm2 list` or view logs with `pm2 logs park-sys-backend`.

### Summary of Deployment Steps:

1.  **Code Change:** Update the `fetch` URLs in `docs/js/main.js` to be relative (which I have already done for you).
2.  **Server Setup:**
    *   Copy your entire project folder to your server (e.g., to `/var/www/park-sys`).
    *   Install Node.js, npm, and Nginx.
3.  **Backend:**
    *   Install PM2 (`sudo npm install -g pm2`).
    *   In the `backend` directory, run `npm install`.
    *   Start the server using `pm2 start server.js --name park-sys-backend`.
4.  **Nginx:**
    *   Create the Nginx config file (`/etc/nginx/sites-available/park-sys`) as shown above.
    *   Enable the site and reload Nginx.

Your application should now be accessible at `http://your_domain.com`.
