# Render Deployment Guide

## Quick Setup (5 minutes)

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select `portfolio-bishwash` repository
   - **Name**: `portfolio-bishwash` (or any name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or paid for no sleep)

3. **Environment Variables** (Required)
   Go to "Environment" tab and add:
   ```
   NODE_ENV=production
   SESSION_SECRET=your_random_secret_here
   ADMIN_PASSWORD=your_secure_admin_password
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_16_char_app_password
   ALLOWED_ORIGIN=https://your-service-name.onrender.com
   ```

4. **Persistent Disk** (For database & uploads)
   - Go to "Disks" tab
   - Click "Add Disk"
   - **Name**: `data`
   - **Mount Path**: `/app/database`
   - **Size**: 1GB (free tier)
   - This keeps your SQLite database and uploads safe

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your site will be live at: `https://your-service-name.onrender.com`

## Post-Deployment Steps

1. **Access Admin Panel**
   - Go to `https://your-service-name.onrender.com/admin`
   - Login with the credentials you set in `ADMIN_PASSWORD`

2. **Configure Email**
   - In Admin → Settings, set your Gmail SMTP and recovery email
   - Test email functionality

3. **Set Custom Domain** (Optional)
   - In Render dashboard, go to "Custom Domains"
   - Add your domain (e.g., `yourdomain.com`)
   - Update DNS records as instructed

## Important Notes

- **Free tier sleeps** after 15 minutes of inactivity (takes ~30s to wake up)
- **Database persists** due to the mounted disk
- **File uploads work** and persist on the disk
- **HTTPS is automatic** on Render
- **Auto-deploys** when you push to GitHub

## Troubleshooting

If deployment fails:
1. Check the build logs in Render dashboard
2. Ensure all environment variables are set
3. Verify the disk mount path is `/app/database`
4. Make sure your repository is public or Render has access

## Production Checklist

- [ ] Set a strong `SESSION_SECRET`
- [ ] Set a strong `ADMIN_PASSWORD`
- [ ] Configure Gmail SMTP with App Password
- [ ] Set `ALLOWED_ORIGIN` to your Render URL
- [ ] Test admin login and password reset
- [ ] Test contact form email sending
- [ ] Verify file uploads work
- [ ] Consider upgrading to paid tier to avoid sleep
