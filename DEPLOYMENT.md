# ✅ Deployment Checklist

Copy this checklist and check off items as you complete them!

## Phase 1: GitHub (5 minutes)

- [ ] Go to https://github.com/new
- [ ] Create repo named: `keepersofx`
- [ ] Make it public
- [ ] Click "uploading an existing file"
- [ ] Drag ALL files from keepersofx-site folder
- [ ] Click "Commit changes"

**Your code is now on GitHub! ✓**

---

## Phase 2: Cloudflare Domain (5 minutes)

- [ ] Login to Cloudflare: https://dash.cloudflare.com
- [ ] Click "Add Site"
- [ ] Enter: `keepersofx.com`
- [ ] Choose Free plan
- [ ] Copy the 2 nameservers Cloudflare gives you
- [ ] Go to your domain registrar (where you bought the domain)
- [ ] Update nameservers to Cloudflare's nameservers
- [ ] Wait 5-30 minutes for DNS to update

**Domain is now on Cloudflare! ✓**

---

## Phase 3: Cloudflare Pages (5 minutes)

- [ ] In Cloudflare, go to "Workers & Pages"
- [ ] Click "Create" → "Pages" → "Connect to Git"
- [ ] Authorize GitHub
- [ ] Select repository: `keepersofx`
- [ ] Build settings:
  - Framework preset: **None**
  - Build command: **(leave empty)**
  - Build output directory: **/**
- [ ] Click "Save and Deploy"
- [ ] Wait 1-2 minutes for deployment
- [ ] Go to "Custom Domains" tab
- [ ] Click "Set up a custom domain"
- [ ] Add: `keepersofx.com`
- [ ] Add: `www.keepersofx.com`

**Website is live! ✓**

---

## Phase 4: Database Setup (5 minutes)

**Install Wrangler CLI:**

Open Terminal/Command Prompt and run:

```bash
npm install -g wrangler
```

**Login to Cloudflare:**

```bash
wrangler login
```
(This will open a browser - click "Allow")

**Create database:**

```bash
wrangler d1 create keepersofx-db
```

- [ ] Copy the `database_id` from the output (looks like: abc123-def456-ghi789)

**Update wrangler.toml:**

- [ ] Open `wrangler.toml` file
- [ ] Replace `your-database-id-here` with your actual database_id
- [ ] Save the file

**Create database tables:**

```bash
cd keepersofx-site
wrangler d1 execute keepersofx-db --file=./schema.sql
```

**Database is ready! ✓**

---

## Phase 5: Connect Database to Website (3 minutes)

- [ ] Go back to Cloudflare Dashboard
- [ ] Open your Pages project (keepersofx)
- [ ] Click "Settings" → "Functions"
- [ ] Scroll to "D1 database bindings"
- [ ] Click "Add binding"
- [ ] Variable name: `DB`
- [ ] D1 database: Select `keepersofx-db`
- [ ] Click "Save"

**Trigger redeployment:**

- [ ] Go to your GitHub repo
- [ ] Click on `README.md`
- [ ] Click the pencil icon (edit)
- [ ] Add a space anywhere
- [ ] Click "Commit changes"

Wait 1-2 minutes for Cloudflare to redeploy.

**Everything is connected! ✓**

---

## Phase 6: Test It! (2 minutes)

- [ ] Visit https://keepersofx.com
- [ ] Try submitting a handle: `jack`
- [ ] Wait 10-20 seconds
- [ ] Profile should appear!

**🎉 YOU'RE LIVE! 🎉**

---

## 🆘 If Something Goes Wrong

### Website loads but submission doesn't work:
1. Check Cloudflare Pages logs (Settings → Functions → View logs)
2. Make sure D1 binding is saved
3. Try redeploying (edit README on GitHub again)

### "Database not found" error:
1. Double-check database_id in wrangler.toml
2. Make sure you ran the schema.sql command
3. Verify D1 binding in Cloudflare Pages settings

### Profile scraping fails:
- X might be rate limiting
- Wait a few minutes and try again
- Try a different handle

---

## 📧 Email Setup (Optional - 10 minutes)

1. **In Proton Mail:**
   - Go to Settings → Domains
   - Add domain: `keepersofx.com`
   - Follow their instructions to get MX, SPF, and DKIM records

2. **In Cloudflare DNS:**
   - Go to DNS → Records
   - Add all the records Proton provides
   - Wait 10-30 minutes

3. **Test:**
   - Send email to hello@keepersofx.com
   - Should arrive in your Proton inbox!

---

## 🎨 Next Steps

Now that you're live, you can:

- Submit more profiles to build your archive
- Customize the design (edit styles.css)
- Add features (search, pagination, etc.)
- Share on X/Twitter!

---

**Need help?** 
- Email: hello@keepersofx.com
- Reread the README.md for detailed explanations