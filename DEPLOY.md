# Deployment Guide 🚀

## Option 1: Deploy to Vercel (Recommended - Free)

### Prerequisites
- Vercel account (free at vercel.com)
- GitHub repository connected

### Steps:

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Set Environment Variables in Vercel Dashboard**
- Go to your project settings on vercel.com
- Add these environment variables:
  - `JWT_SECRET`: A secure random string
  - `NODE_ENV`: production

5. **Your app will be live at**: `https://your-project.vercel.app`

## Option 2: Deploy to Netlify + Railway

### Frontend (Netlify)
1. Connect your GitHub repo to Netlify
2. Build command: `cd client && npm install && npm run build`
3. Publish directory: `client/build`

### Backend (Railway)
1. Create new project on railway.app
2. Connect GitHub repo
3. Set start command: `npm start`
4. Add environment variables

## Option 3: Deploy to Heroku

### Prerequisites
- Heroku account
- Heroku CLI installed

### Steps:

1. **Create Heroku app**
```bash
heroku create your-app-name
```

2. **Set buildpacks**
```bash
heroku buildpacks:add heroku/nodejs
```

3. **Set environment variables**
```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git push heroku main
```

## Option 4: Self-Host on VPS

### Requirements
- VPS (DigitalOcean, Linode, etc.)
- Node.js 14+
- PM2 for process management
- Nginx for reverse proxy

### Steps:

1. **Clone repository**
```bash
git clone https://github.com/ajellvik/FinanceDashboard.git
cd FinanceDashboard
```

2. **Install dependencies**
```bash
npm install
cd client && npm install && npm run build
cd ..
```

3. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Start with PM2**
```bash
npm install -g pm2
pm2 start server/index.js --name investment-dashboard
pm2 save
pm2 startup
```

5. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Important Notes

### Database
- SQLite database (`portfolio.db`) is created automatically
- For production, consider migrating to PostgreSQL or MySQL
- Make sure to backup your database regularly

### Security
- Always use HTTPS in production
- Change the default JWT_SECRET
- Keep your dependencies updated
- Consider adding rate limiting

### Performance
- Enable caching for static assets
- Use CDN for better global performance
- Optimize images and assets

## Environment Variables

Create a `.env` file with:
```
JWT_SECRET=your-very-secure-random-string
NODE_ENV=production
PORT=5001
```

## Troubleshooting

### Port already in use
- Change PORT in .env file
- Or kill the process: `lsof -i :5001` then `kill -9 PID`

### Database errors
- Delete `portfolio.db` and restart to create fresh database
- Check file permissions

### Authentication issues
- Clear browser cookies and localStorage
- Verify JWT_SECRET is set correctly

## Support

For issues, please check:
- GitHub Issues: https://github.com/ajellvik/FinanceDashboard/issues
- Documentation: README.md
