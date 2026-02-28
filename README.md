# Bishwash Portfolio Website

A modern portfolio website with admin dashboard for managing all content dynamically.

## Features

- **Frontend**: Responsive portfolio with particles animation, theme toggle, smooth scroll
- **Admin Dashboard**: Add, edit, hide, and remove all website sections
- **Database**: SQLite for storing website content and contact messages
- **Contact Form**: Messages stored in admin panel + email notifications via Gmail
- **Dynamic Content**: Home, About, Experience, Education, Projects, Blog sections all editable

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Email**: Nodemailer with Gmail SMTP

## Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone/Download the project**
   ```bash
   cd "Bishwash portfolio website_x1.0"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Admin credentials (change these!)
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password
   
   # Gmail SMTP for contact form
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password
   
   # Session secret (generate a random string)
   SESSION_SECRET=your_random_secret_key_here
   
   # Port (optional, defaults to 3000)
   PORT=3000
   ```

   **How to get Gmail App Password:**
   - Go to Google Account → Security → 2-Step Verification
   - At the bottom, click "App passwords"
   - Select "Mail" and your device, then click "Generate"
   - Copy the 16-character password

4. **Start the server**
   ```bash
   # Development mode (auto-restart on changes)
   npm run dev
   
   # OR Production mode
   npm start
   ```

5. **Open the website**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## Deployment Guide

### Deploy to Render (Recommended - Free)

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create account on Render.com**
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: bishwash-portfolio
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Add Environment Variables (same as .env above)
   - Click "Create Web Service"

4. **Done!** Render will provide a URL like `https://bishwash-portfolio.onrender.com`

### Deploy to Railway (Alternative)

Similar process to Render - connect GitHub repo and deploy.

### Deploy to VPS (DigitalOcean, AWS, etc.)

1. **Upload files to server**
   ```bash
   scp -r . root@your-server-ip:/var/www/portfolio
   ```

2. **Install Node.js and PM2**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Start with PM2**
   ```bash
   cd /var/www/portfolio
   npm install
   pm2 start server.js --name "portfolio"
   pm2 save
   pm2 startup
   ```

4. **Set up Nginx** (reverse proxy)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Project Structure

```
├── admin/                  # Admin dashboard files
│   ├── login.html         # Admin login page
│   └── dashboard.html     # Admin dashboard
├── api/                   # API routes
│   ├── auth.js           # Authentication endpoints
│   ├── content.js        # Content CRUD endpoints
│   └── contact.js        # Contact form endpoints
├── css/                  # Stylesheets
├── js/                   # Frontend JavaScript
├── database/             # SQLite database
│   └── db.js            # Database setup
├── node_modules/         # Dependencies
├── .env                  # Environment variables
├── .env.example          # Example environment file
├── package.json          # Node.js dependencies
├── README.md             # This file
├── server.js             # Main server file
└── index.html            # Main website
```

## Admin Panel Usage

1. **Login**: Go to `/admin` and enter credentials from `.env`
2. **Dashboard**: Manage all sections from the sidebar
3. **Content Sections**:
   - **Home**: Hero text, typing animation strings
   - **About**: Bio, stats, skills
   - **Experience**: Work history with badges
   - **Education**: Academic history with badges
   - **Projects**: Portfolio items with tags
   - **Blog**: Blog posts
4. **Messages**: View contact form submissions
5. **Hide/Show**: Toggle visibility of any section

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/check` - Check auth status

### Content Management
- `GET /api/content/:section` - Get section content
- `POST /api/content/:section` - Add item
- `PUT /api/content/:section/:id` - Update item
- `DELETE /api/content/:section/:id` - Delete item
- `PATCH /api/content/:section/:id/toggle` - Hide/show item

### Contact Form
- `POST /api/contact` - Submit contact form
- `GET /api/contact/messages` - Get all messages (admin only)
- `DELETE /api/contact/messages/:id` - Delete message

## Troubleshooting

### Port already in use
```bash
# Find and kill process
npx kill-port 3000
# Or change port in .env
PORT=3001
```

### Database locked
```bash
# Delete database and restart (data will be lost!)
rm database/portfolio.db
npm start
```

### Gmail not working
- Enable 2-Factor Authentication
- Generate App Password (not your regular password)
- Use the 16-character app password in .env

## License

MIT License - feel free to use this for your own portfolio!

## Support

For issues or questions, check the console logs or contact the developer.
