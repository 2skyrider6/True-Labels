# 🚀 FoodSafe Scanner — 100% Free Deployment Guide

Your app now uses **Google Gemini 2.0 Flash (completely free)** instead of Claude!

**Updated GitHub repo:** https://github.com/2skyrider6/True-Labels

---

## ✅ What's Free

| Service | Cost | Details |
|---------|------|---------|
| **Google Gemini 2.0 Flash** | FREE | 15 requests/min, unlimited monthly |
| **Tavily Web Search** | FREE | 120 requests/month free tier |
| **Vercel Hosting** | FREE | Up to 100GB bandwidth/month |
| **Next.js** | FREE | Open source |
| **Tailwind CSS** | FREE | Open source |
| **Total** | **$0/month** | Fully functional MVP |

---

## 🚀 Deploy in 3 Steps

### Step 1: Get Your Free API Key

**Google Gemini:**
1. Go to https://ai.google.dev
2. Click **"Get API Key"**
3. Create new project (or use existing)
4. Copy your API key (looks like: `AIzaSy...`)
5. **Free tier: 15 requests/min, unlimited**

**Optional - Tavily (for better search results):**
1. Go to https://tavily.com
2. Sign up
3. Copy API key
4. **Free tier: 120 requests/month**

### Step 2: Deploy on Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Enter: `https://github.com/2skyrider6/True-Labels`
4. Click **"Import"**
5. Add Environment Variables:
   - `GEMINI_API_KEY` = your Google AI key
   - `TAVILY_API_KEY` = your Tavily key (optional, works without it)
6. Click **"Deploy"**

### Step 3: Test on Phone

Once deployed (~2-3 minutes):
- **iPhone:** Open URL → Share → Add to Home Screen
- **Android:** Open URL → Menu → Install app

**Your live URL:** `https://true-labels-2skyrider6.vercel.app`

---

## 📊 Free Tier Limits

### Google Gemini (Plenty)
- **15 requests/minute** (enough for personal use)
- **Unlimited calls per month**
- **No credit card required** (can use with free Google account)
- Perfect for: OCR + ingredient analysis

### Tavily (Optional)
- **120 requests/month** (if you run 4 scans/day, that's ~30 days)
- Falls back to mock data if limit reached
- Great for: Better web search results

### Vercel (Generous)
- **100GB bandwidth/month** (way more than needed)
- **Unlimited deployments**
- **Free SSL/HTTPS**
- **No credit card required** for hobby tier

---

## 🎯 How to Use

1. **Upload food label photo**
2. **Gemini reads the ingredients** (using vision)
3. **Gemini classifies each ingredient** (Safe/Caution/Avoid)
4. **See results with color badges**
5. **Save to history, set allergies, share**

**Everything runs free!**

---

## 💡 Pro Tips

### To Stay Within Free Limits

1. **Batch your scans** — Use the app a few times per day
2. **Reuse results** — Scan once, view history many times
3. **Mock data fallback** — App works without API calls (limited functionality)
4. **Cache aggressively** — Vercel caches static assets

### Monitor Your Usage

**Google AI Studio:**
- https://ai.google.dev/dashboard
- Check quota usage in real-time
- Increase limits with billing (if needed later)

**Tavily:**
- https://tavily.com/dashboard
- Check monthly request count
- 120 free requests/month

**Vercel:**
- https://vercel.com/dashboard
- Check bandwidth usage
- Analytics dashboard

---

## 🔄 What Changed From Original

| What | Original | Updated |
|------|----------|---------|
| Vision Model | Claude 3.5 Sonnet ($0.075/image) | Gemini 2.0 Flash (FREE) |
| Cost Per Scan | ~$0.15-0.25 | $0 |
| API Key | Anthropic | Google AI |
| Monthly Cost | $20-50+ | $0 |

---

## ❓ FAQs

**Q: Will it really be free?**
A: Yes! Gemini free tier gives 15 req/min + unlimited monthly. Vercel free tier includes 100GB bandwidth. You won't hit limits with normal usage.

**Q: What if I exceed the free limit?**
A: Gemini will throttle at 15 req/min. Tavily falls back to mock data after 120/month. Just wait or upgrade anytime.

**Q: How do I add billing later?**
A: In Google AI Dashboard or Vercel dashboard, add credit card to upgrade. Costs scale with usage.

**Q: Can I use this for a business?**
A: Yes! Free tier works great for MVP. When traffic grows, add paid tiers for better performance.

**Q: Does it work without internet?**
A: No, but the UI caches locally. You can view saved scans offline.

---

## 🚀 Ready to Deploy?

Your updated code is at: **https://github.com/2skyrider6/True-Labels**

### Quick Checklist
- [ ] Got Google Gemini API key
- [ ] (Optional) Got Tavily API key
- [ ] Went to Vercel.com/new
- [ ] Imported True-Labels repo
- [ ] Added environment variables
- [ ] Clicked Deploy
- [ ] Waited 2-3 minutes
- [ ] Got live URL
- [ ] Tested on phone

**That's it! Your app is live and 100% free.** 🎉

---

## 📞 Support

- **Google Gemini Help:** https://ai.google.dev/docs
- **Vercel Docs:** https://vercel.com/docs
- **Your Code:** https://github.com/2skyrider6/True-Labels

Good luck! 🚀
