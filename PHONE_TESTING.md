# 🚀 FoodSafe Scanner — Deploy to Vercel (Phone Testing)

## Quick Deploy Instructions

### Step 1: Create GitHub Repo
1. Go to https://github.com/new
2. Repo name: `foodsafe-scanner`
3. Make it **Public**
4. Click "Create repository"

### Step 2: Get Your GitHub Username & Personal Access Token

**GitHub Username:**
- Go to https://github.com/settings/profile
- Copy your username from the URL or profile page

**Personal Access Token (for authentication):**
1. Go to https://github.com/settings/tokens/new
2. Select scopes: `repo` (full control of private repositories)
3. Click "Generate token"
4. Copy the token (you'll only see it once!)

### Step 3: Push Code to GitHub

Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
cd C:\Users\ACER\foodsafe-scanner

# Configure Git with your credentials
git config user.name "Your Name"
git config user.email "your.email@gmail.com"

# Set remote (replace YOUR_USERNAME)
git remote set-url origin https://YOUR_USERNAME:YOUR_GITHUB_TOKEN@github.com/YOUR_USERNAME/foodsafe-scanner.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Deploy on Vercel

1. Go to https://vercel.com
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub"
4. Authorize Vercel
5. Click "New Project"
6. Select your `foodsafe-scanner` repository
7. Click "Import"

**Add Environment Variables:**
- Click "Environment Variables"
- Add `ANTHROPIC_API_KEY` = `sk_live_YOUR_KEY_FROM_ANTHROPIC`
- Add `TAVILY_API_KEY` = `tvly_YOUR_KEY_FROM_TAVILY`
- Click "Deploy"

### Step 5: Wait for Deployment

Vercel will build and deploy automatically. Takes ~2-3 minutes.

Once complete, you'll see:
```
✅ Deployment successful!
🔗 Production: https://foodsafe-scanner-YOUR_USERNAME.vercel.app
```

### Step 6: Test on Your Phone

Copy the production URL and:

**On iPhone:**
1. Open the URL in Safari
2. Tap Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Name it "FoodSafe"
5. Tap "Add"

**On Android:**
1. Open the URL in Chrome
2. Tap Menu (3 dots)
3. Tap "Install app"
4. Tap "Install"

---

## Troubleshooting

**"Authentication failed"**
- Check your GitHub token is correct
- Make sure it hasn't expired
- Regenerate token at https://github.com/settings/tokens

**"Build failed on Vercel"**
- Check environment variables are set correctly
- Vercel shows build logs - look for specific errors
- Common: Missing API keys

**"App works locally but not on phone"**
- Camera requires HTTPS (Vercel provides this)
- Make sure you're using the Vercel URL, not localhost

**"Results are blank or errors"**
- Check browser console (F12) for error messages
- Verify API keys are valid
- Check Vercel logs at https://vercel.com/dashboard

---

## Getting API Keys

### Anthropic (Claude)
1. Go to https://console.anthropic.com
2. Click "Create API Key"
3. Copy the key (starts with `sk_live_`)
4. Add to Vercel environment variables as `ANTHROPIC_API_KEY`

### Tavily (Web Search)
1. Go to https://tavily.com
2. Sign up
3. Go to API settings
4. Copy your API key (starts with `tvly_`)
5. Add to Vercel environment variables as `TAVILY_API_KEY`

---

## Once Live

Your app will be available at:
```
https://foodsafe-scanner-YOUR_USERNAME.vercel.app
```

Share this link directly with anyone to test on their phone!

---

## Support

If stuck:
1. Check [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed steps
2. Check Vercel logs at https://vercel.com/dashboard
3. Check browser console (F12) for errors
4. Verify API keys are correct and active

Good luck! 🚀
