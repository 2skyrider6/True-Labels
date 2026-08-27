# 🚀 FoodSafe Scanner - Quick Start Guide

## What You Have

A fully functional **MVP web app** that scans food labels and analyzes ingredient safety in real-time. Built with Next.js 14, Claude AI, and Tavily search.

## 5-Minute Setup

### 1. Get Your API Keys
- **Anthropic** (Claude): https://console.anthropic.com → Create API key
- **Tavily** (Web Search): https://tavily.com → Sign up, get API key

### 2. Update `.env.local`
```
ANTHROPIC_API_KEY=sk_live_...
TAVILY_API_KEY=tvly_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Locally
```bash
npm run dev
```
Open http://localhost:3000

### 4. Test the Flow
1. Click "Take Photo or Upload"
2. Select any food product image (or use a test image)
3. Click "Analyze Ingredients"
4. See results with safety badges, concerns, and sources

## Core Features Implemented

| Feature | Status | Details |
|---------|--------|---------|
| Camera/Upload | ✅ | HTML5 file input, preview before analysis |
| OCR | ✅ | Claude 3.5 Sonnet vision model |
| Ingredient Extraction | ✅ | Structured JSON output |
| Web Search | ✅ | Tavily API integration (with mock fallback) |
| Safety Classification | ✅ | Safe/Caution/Avoid with reasoning |
| Color-Coded UI | ✅ | Green/Yellow/Red badges |
| Risk Scoring | ✅ | Low/Medium/High product scores |
| History | ✅ | localStorage-backed scan history |
| Allergies | ✅ | User profile with 9 common allergies |
| Dietary Restrictions | ✅ | 8 common dietary preferences |
| Share Report | ✅ | Native share or clipboard fallback |
| Mobile-First | ✅ | Responsive design, PWA manifest |

## File Structure

```
foodsafe-scanner/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── extract-ingredients/route.ts
│   │   │   └── analyze-ingredients/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── CameraScanner.tsx
│   │   ├── ResultsDisplay.tsx
│   │   ├── UserProfile.tsx
│   │   └── ScanHistory.tsx
│   └── lib/
│       ├── store.ts (Zustand state)
│       └── utils.ts (helpers)
├── public/
│   └── manifest.json (PWA)
├── .env.local
├── package.json
└── README.md
```

## How It Works

### Flow
```
User takes photo
    ↓
[POST /api/extract-ingredients] → Claude vision extracts ingredients
    ↓
[POST /api/analyze-ingredients] → Tavily searches each ingredient
    ↓
Claude classifies as Safe/Caution/Avoid with sources
    ↓
Results displayed with badges, risk score, top 3 concerns
    ↓
User can save to history or share
```

### Key Technologies

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state + localStorage)

**Backend**
- Vercel Edge Functions (serverless)
- Claude 3.5 Sonnet (vision + reasoning)
- Tavily API (web search)

**Deployment**
- Vercel (5-click deploy from GitHub)

## Customization Ideas

### Easy Wins
1. **Add more allergies** → Edit `UserProfile.tsx` `COMMON_ALLERGIES`
2. **Change colors** → Edit Tailwind classes in components
3. **Add new mock ingredients** → Edit `analyze-ingredients/route.ts` `getMockSearchResults()`
4. **Custom messaging** → Edit disclaimers, tips, instructions

### Medium Effort
1. **Add Barcode Scanning** → Install `react-qr-reader`, add barcode lookup API
2. **Save to Database** → Replace localStorage with Supabase
3. **Dark Mode** → Add Tailwind dark: prefix classes
4. **Multi-Language** → Add i18n library (next-intl)

### Advanced
1. **Mobile App** → Wrap with Expo/React Native
2. **Community Ratings** → Add backend, DB, user auth
3. **Offline Mode** → Service worker + IndexedDB
4. **PDF Export** → Use jsPDF library

## Deploying to Vercel

### Option 1: Via GitHub (Recommended)
```bash
# Initialize Git
git init
git add .
git commit -m "FoodSafe Scanner MVP"

# Push to GitHub
git remote add origin https://github.com/USERNAME/foodsafe-scanner
git push -u origin main
```

Then:
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repo
4. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `TAVILY_API_KEY`
5. Click Deploy ✅

Your app is now live at `https://your-project.vercel.app`

### Option 2: Direct Vercel CLI
```bash
npm i -g vercel
vercel
```

## Testing Checklist

- [ ] Can upload/select image
- [ ] Image preview shows correctly
- [ ] "Analyze Ingredients" button works
- [ ] API calls complete without errors
- [ ] Results display with badges
- [ ] Can save scan to history
- [ ] Can view saved scans
- [ ] Can set allergies in profile
- [ ] Can share scan report
- [ ] Works on mobile (iOS Safari, Android Chrome)
- [ ] Camera capture works on mobile

## Troubleshooting

**"Cannot find module '@anthropic-ai/sdk'"**
```bash
npm install @anthropic-ai/sdk zustand
```

**"ANTHROPIC_API_KEY is undefined"**
- Restart dev server after updating `.env.local`
- Verify key is correct in console.anthropic.com

**Image processing fails**
- Ensure photo is clear and well-lit
- File size < 5MB
- Try JPEG or PNG format
- Check Claude API quota

**History not saving**
- Open DevTools → Application → Cookies → Check localStorage
- Try in a regular (non-private) browser window
- Clear cache if needed

**Camera doesn't work on iOS**
- Requires HTTPS (won't work on localhost)
- Deploy to Vercel first
- Or use QR code on Android to test localhost

## Next Steps After MVP

1. ✅ **V1.0**: Current MVP working locally
2. 🚀 **Deploy**: Push to Vercel (2 minutes)
3. 📱 **Mobile Test**: Use deployed URL on phone
4. 🔄 **Iterate**: Gather user feedback
5. 🎯 **V1.1 Enhancements**:
   - Barcode scanning
   - More ingredient database
   - Improved OCR accuracy
   - User authentication
   - Scan sharing & social features

## Key Files to Know

| File | Purpose |
|------|---------|
| [`page.tsx`](src/app/page.tsx) | Main app logic & views |
| [`CameraScanner.tsx`](src/components/CameraScanner.tsx) | Camera/upload UI |
| [`ResultsDisplay.tsx`](src/components/ResultsDisplay.tsx) | Results rendering |
| [`extract-ingredients/route.ts`](src/app/api/extract-ingredients/route.ts) | Claude vision API |
| [`analyze-ingredients/route.ts`](src/app/api/analyze-ingredients/route.ts) | Analysis pipeline |
| [`store.ts`](src/lib/store.ts) | State management (Zustand) |

## Support & Resources

- **Claude Docs**: https://docs.anthropic.com
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Tavily API**: https://tavily.com/docs

---

**You're ready to ship! 🚀**

Questions? Check README.md for detailed docs or start modifying the code. The codebase is straightforward and well-commented.
