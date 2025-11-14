# Keepers of X - Deployment Guide

A vintage manuscript-style archive documenting when people joined X/Twitter.

## 📁 Project Structure

```
keepersofx-site/
├── index.html          # Main page
├── styles.css          # Vintage manuscript styling
├── app.js              # Frontend JavaScript
├── worker.js           # Cloudflare Worker (backend API)
├── schema.sql          # Database schema
├── wrangler.toml       # Cloudflare configuration
├── favicon.svg         # Site icon
└── README.md           # This file
```

## 🚀 Deployment Steps

### 1. Prerequisites

- Domain: `keepersofx.com` (already purchased)
- GitHub account: `keepersofx`
- Cloudflare account (free tier works)

### 2. GitHub Setup

1. **Create a new repository:**
   - Go to https://github.com/new
   - Name: `keepersofx`
   - Make it public
   - Don't initialize with README (we have one)

2. **Upload your code:**
   
   **Option A - Using GitHub Web Interface (Easiest):**
   - Click "uploading an existing file"
   - Drag and drop all files from the `keepersofx-site` folder
   - Commit with message: "Initial commit"

   **Option B - Using Git Command Line:**
   ```bash
   cd keepersofx-site
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/keepersofx/keepersofx.git
   git push -u origin main
   ```

### 3. Cloudflare Pages Setup

1. **Login to Cloudflare:**
   - Go to https://dash.cloudflare.com
   - Login with your account

2. **Add your domain (if not already added):**
   - Click "Add Site"
   - Enter `keepersofx.com`
   - Follow the instructions to update nameservers at your domain registrar
   - Wait for DNS propagation (5-30 minutes)

3. **Create Cloudflare Pages:**
   - Go to Workers & Pages → Create → Pages
   - Click "Connect to Git"
   - Select your GitHub account and authorize Cloudflare
   - Select the `keepersofx` repository
   - **Build settings:**
     - Framework preset: None
     - Build command: (leave empty)
     - Build output directory: `/`
   - Click "Save and Deploy"

4. **Set custom domain:**
   - After deployment, go to Custom Domains
   - Add `keepersofx.com` and `www.keepersofx.com`
   - Cloudflare will automatically configure DNS

### 4. Database Setup (Cloudflare D1)

1. **Create D1 Database:**
   ```bash
   # Install Wrangler CLI (if not installed)
   npm install -g wrangler
   
   # Login to Cloudflare
   wrangler login
   
   # Create database
   wrangler d1 create keepersofx-db
   ```

2. **Note the database ID** from the output and update `wrangler.toml`:
   ```toml
   database_id = "paste-your-database-id-here"
   ```

3. **Run database migration:**
   ```bash
   wrangler d1 execute keepersofx-db --file=./schema.sql
   ```

4. **Verify table creation:**
   ```bash
   wrangler d1 execute keepersofx-db --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

### 5. Connect Worker to Pages

1. **In Cloudflare Dashboard:**
   - Go to your Pages project (keepersofx)
   - Click Settings → Functions
   - Scroll to "D1 database bindings"
   - Add binding:
     - Variable name: `DB`
     - D1 database: `keepersofx-db`
   - Save

2. **Deploy the Worker:**
   - Go back to your GitHub repo
   - Make a small change (or just re-commit)
   - Push to trigger automatic deployment

### 6. Testing

1. **Visit your site:**
   - Go to https://keepersofx.com
   - You should see the vintage Chronicles interface

2. **Test profile submission:**
   - Enter a Twitter handle (e.g., `jack`)
   - Click "Inscribe"
   - Wait for the scraping to complete
   - Profile should appear in the grid

3. **Check database:**
   ```bash
   wrangler d1 execute keepersofx-db --command="SELECT * FROM profiles;"
   ```

## 🔧 Local Development

To test locally before deploying:

```bash
# Install dependencies
npm install -g wrangler

# Run development server
wrangler pages dev . --d1 keepersofx-db

# Your site will be available at http://localhost:8788
```

## 📧 Email Setup (Proton Mail)

1. **In Proton Mail:**
   - Add custom domain: keepersofx.com
   - Note the MX records provided

2. **In Cloudflare DNS:**
   - Add the MX records from Proton
   - Add SPF and DKIM records as provided by Proton
   - This allows you to send/receive from hello@keepersofx.com

## 🎨 Customization

### Adding More Profiles Manually

```bash
wrangler d1 execute keepersofx-db --command="
  INSERT INTO profiles (handle, join_date, followers, location, profile_image, created_at)
  VALUES ('jack', '2006-03-21', 6900000, 'San Francisco, USA', 'https://...', datetime('now'));
"
```

### Updating Styles

- Edit `styles.css` for design changes
- Commit and push to GitHub
- Cloudflare Pages will auto-deploy

## ⚠️ Important Notes

### Rate Limits

- **X/Twitter scraping:** Currently uses public page scraping
- **Limitations:** 
  - May fail if X changes HTML structure
  - Rate limits from X's side
  - Consider adding delay between submissions

### Database Limits (Free Tier)

- 100,000 reads per day
- 1,000 writes per day
- 5GB storage
- Should be plenty for manual submissions

### Future Improvements

1. **Better scraping:** Consider using X API (requires approval)
2. **Caching:** Cache profile images on Cloudflare R2
3. **Pagination:** Add pagination for 1000+ profiles
4. **Search:** Add search functionality
5. **Admin panel:** Add authentication and admin interface

## 🐛 Troubleshooting

### "Profile not found" error
- X may have rate limited you
- Try again in a few minutes
- Check if the handle is correct

### Database connection error
- Verify D1 binding is correct in Cloudflare Pages settings
- Check database_id in wrangler.toml
- Ensure schema.sql was executed

### Scraping fails
- X changes their HTML structure frequently
- May need to update regex patterns in worker.js
- Consider switching to X API if scraping becomes unreliable

## 📞 Support

- Email: hello@keepersofx.com
- GitHub: https://github.com/keepersofx/keepersofx

---

Built with ❤️ using Cloudflare Pages, Workers, and D1.