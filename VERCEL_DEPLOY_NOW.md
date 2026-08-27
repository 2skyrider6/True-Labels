# 🚀 Deploy to Vercel — Get Your Phone Testing Link

Your code is now on GitHub: **https://github.com/2skyrider6/True-Labels**

Now deploy to Vercel in 3 steps:

---

## Step 1: Go to Vercel

Open: **https://vercel.com**

---

## Step 2: Import Your Repository

1. Click **"New Project"**
2. Click **"Import Git Repository"**
3. Paste: `https://github.com/2skyrider6/True-Labels`
4. Click **"Import"**

---

## Step 3: Add Environment Variables

Before clicking Deploy, add your API keys:

1. Look for **"Environment Variables"** section
2. Add two variables:

   **Variable 1:**
   - Name: `ANTHROPIC_API_KEY`
   - Value: Get from https://console.anthropic.com → Create API Key (starts with `sk_live_`)

   **Variable 2:**
   - Name: `TAVILY_API_KEY`
   - Value: Get from https://tavily.com → API Key (starts with `tvly_`)

3. Click **"Deploy"**

---

## Step 4: Wait for Deployment

Vercel will build and deploy automatically (~2-3 minutes).

Once complete, you'll see:
```
✅ Deployment successful!
🔗 Production: https://true-labels-2skyrider6.vercel.app
```

---

## Step 5: Test on Your Phone

Copy the production URL and:

**iPhone (Safari):**
1. Open URL in Safari
2. Tap Share (⬆️)
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android (Chrome):**
1. Open URL in Chrome
2. Tap Menu (⋮)
3. Tap "Install app"
4. Tap "Install"

---

## Getting Your API Keys

### Anthropic (Claude)
1. Go to https://console.anthropic.com
2. Sign in
3. Click **"Create API Key"**
4. Copy the key (starts with `sk_live_`)

### Tavily (Web Search)
1. Go to https://tavily.com
2. Sign up
3. Get your API key (starts with `tvly_`)

---

## Your Live Testing URL

Once deployed, your app will be at:
```
https://true-labels-2skyrider6.vercel.app
```

Share this link with anyone to test on their phone!

---

## Troubleshooting

**"Build failed"**
- Check API keys are correct in Vercel dashboard
- Check Vercel build logs for errors

**"Results showing blank"**
- Open browser console (F12)
- Check for error messages
- Verify API keys are active

**"Camera not working"**
- Must use HTTPS (Vercel provides this)
- Grant camera permission when prompted

---

**That's it! Your app will be live in ~5 minutes total.** 🚀
