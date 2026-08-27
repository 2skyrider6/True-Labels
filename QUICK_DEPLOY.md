# 📱 FoodSafe Scanner — Phone Testing Guide

## Your App is Ready! Here's How to Test

The **FoodSafe Scanner MVP** is complete and ready to deploy to Vercel for phone testing.

**Project location:** `C:\Users\ACER\foodsafe-scanner`
**Status:** ✅ Built, tested, and committed to Git

---

## 🚀 5-Minute Deployment

### 1️⃣ Create GitHub Repository
Go to **https://github.com/new**
- Repo name: `foodsafe-scanner`
- Visibility: **Public**
- Click **Create repository**

### 2️⃣ Get Your Credentials

**Your GitHub Username:**
- Visit https://github.com/settings/profile
- Copy your username from the URL

**GitHub Personal Access Token:**
1. Go to https://github.com/settings/tokens/new
2. Select scope: **repo** (full control)
3. Click **Generate token**
4. Copy the token immediately (only shown once!)

### 3️⃣ Push Code to GitHub

Copy and run these commands in terminal:

```bash
cd C:\Users\ACER\foodsafe-scanner

git config user.name "Your Name"
git config user.email "your.email@gmail.com"

git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/foodsafe-scanner.git

git branch -M main
git push -u origin main
```

Replace:
- `YOUR_USERNAME` = your GitHub username
- `YOUR_TOKEN` = the token you just generated
- `Your Name` and `your.email@gmail.com` = your actual info

### 4️⃣ Deploy on Vercel

1. Go to **https://vercel.com**
2. Sign up with GitHub (or sign in)
3. Click **New Project**
4. Select your `foodsafe-scanner` repo
5. Click **Import**

**Add Environment Variables:**
- `ANTHROPIC_API_KEY` = Get from https://console.anthropic.com
- `TAVILY_API_KEY` = Get from https://tavily.com
- Click **Deploy**

Wait 2-3 minutes for deployment...

### 5️⃣ Get Your Live URL

Once deployment completes, you'll see:
```
✅ Production: https://foodsafe-scanner-YOUR_USERNAME.vercel.app
```

**This is your phone testing link!** 📱

---

## 📱 Testing on Your Phone

### iPhone (Safari)
1. Open the Vercel URL in Safari
2. Tap the Share button (⬆️ in bottom toolbar)
3. Tap **Add to Home Screen**
4. Name it "FoodSafe"
5. Tap **Add**
6. App now appears on home screen as full-screen app

### Android (Chrome)
1. Open the Vercel URL in Chrome
2. Tap Menu (⋮ three dots)
3. Tap **Install app**
4. Tap **Install**
5. App now appears on home screen as full-screen app

---

## ✅ Test Checklist

Once installed on your phone, test:

- [ ] **Upload Image** — Take a photo of a food label or select from gallery
- [ ] **Image Preview** — Photo shows before analysis
- [ ] **Analyze Button** — Clicking triggers analysis
- [ ] **Loading State** — Shows "Processing..." during analysis
- [ ] **Results Display** — Results appear with badges
- [ ] **Color Badges** — Green (Safe), Yellow (Caution), Red (Avoid)
- [ ] **Risk Score** — Shows Low/Medium/High
- [ ] **Top Concerns** — Highlights top 3 problematic ingredients
- [ ] **Source Links** — Clicking source links opens in browser
- [ ] **Save Scan** — Saves scan to history
- [ ] **View History** — Can see all past scans
- [ ] **Set Allergies** — Can update profile with allergies
- [ ] **Share Report** — Can share via messaging/email
- [ ] **Multiple Scans** — Can scan multiple products

---

## 🔧 Getting API Keys

### Anthropic (Claude Vision)
1. Go to **https://console.anthropic.com**
2. Sign in or create account
3. Click **Create API Key**
4. Copy the key (starts with `sk_live_`)
5. Add to Vercel as `ANTHROPIC_API_KEY`

### Tavily (Web Search)
1. Go to **https://tavily.com**
2. Sign up for free account
3. Navigate to API settings
4. Copy API key (starts with `tvly_`)
5. Add to Vercel as `TAVILY_API_KEY`

---

## 🎯 What Each Feature Does

### 📸 Camera Scanner
- Upload a food label image
- Preview before analysis
- Supports camera capture (mobile) or gallery (desktop)

### 🧠 AI Analysis
- Claude reads the ingredient list automatically
- Extracts individual ingredients
- Searches each ingredient for safety info
- Classifies as Safe/Caution/Avoid

### 🎨 Color-Coded Results
- 🟢 **Green** — Safe, GRAS approved, no concerns
- 🟡 **Yellow** — Caution, some evidence of concerns
- 🔴 **Red** — Avoid, banned, harmful, or allergen

### 📊 Risk Scoring
- **Low Risk** — All ingredients safe
- **Medium Risk** — Some caution-level ingredients
- **High Risk** — Contains avoid-level ingredients

### 👤 User Profile
- Set your allergies (9 common ones)
- Set dietary restrictions (8 common ones)
- Alerts when allergies found in ingredients

### 💾 Scan History
- All scans saved locally on your phone
- View with thumbnails
- Can share saved scans

---

## 🆘 Troubleshooting

### "API Key Invalid" Error
- Verify key is correct from Anthropic/Tavily console
- Check it's added to Vercel environment variables
- Wait 1 minute for Vercel to re-deploy after adding keys

### Build Failed on Vercel
- Check Vercel build logs for error details
- Ensure `.env.local` is NOT committed to git (it's in .gitignore)
- Environment variables must be added in Vercel dashboard

### Camera Not Working on iOS
- Must use HTTPS (Vercel provides this automatically)
- Safari may ask for permission first time
- Grant camera permission when prompted

### Results Showing Blank
- Open browser console (F12 on desktop)
- Look for error messages
- Check API keys are valid and active

### App Too Slow
- First load may take 10 seconds (Cold start)
- Subsequent loads are instant
- Image upload large files may take time

---

## 📊 Key Features Included

✅ Vision/OCR with Claude 3.5 Sonnet
✅ Real-time web search (Tavily)
✅ Safety classification (Safe/Caution/Avoid)
✅ Color-coded visual results
✅ Overall product risk scoring
✅ Top 3 concerns highlighted
✅ Source attribution for every ingredient
✅ User allergy tracking
✅ Dietary restrictions support
✅ Scan history with persistence
✅ Share functionality
✅ Mobile-first responsive design
✅ PWA app install (iOS/Android)
✅ Graceful error handling
✅ Offline asset caching

---

## 🚀 Next Steps After Testing

1. **Gather Feedback** — Ask friends/family to test
2. **Document Issues** — Note any bugs or suggestions
3. **Plan V1.1** — Consider features like:
   - Barcode scanning
   - Expanded ingredient database
   - Dark mode
   - Multi-language support
   - Community ratings

4. **Share Widely** — Link works forever on Vercel!

---

## 📞 Support Resources

| Issue | Resource |
|-------|----------|
| Claude API problems | https://docs.anthropic.com |
| Vercel deployment help | https://vercel.com/docs |
| Next.js questions | https://nextjs.org/docs |
| GitHub issues | https://github.com/support |

---

## 💡 Pro Tips

1. **Test with Real Labels** — Try various food products for best results
2. **Take Clear Photos** — Well-lit, readable text = better results
3. **Check Slow Networks** — App includes mock data fallback if APIs are slow
4. **Share Your Link** — Anyone can test at the Vercel URL, no installation needed
5. **Check Browser Console** — F12 → Console tab shows detailed error messages

---

## 🎉 You're All Set!

Your FoodSafe Scanner is production-ready. Deploy to Vercel and start testing on your phone!

**Deployment time: ~5 minutes**
**Your app will be live at: https://foodsafe-scanner-YOUR_USERNAME.vercel.app**

Good luck! 🚀
