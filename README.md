# FoodSafe Scanner MVP

A mobile-first web app that scans food ingredient labels using AI vision and provides real-time analysis of ingredient safety, allergens, and health concerns.

## Features

✅ **Core MVP**
- 📸 Camera/image upload with preview
- 🔍 Claude 3.5 Sonnet vision model for OCR
- 🧪 Ingredient extraction to structured JSON
- 🔎 Real-time web search integration (Tavily API)
- 🏷️ AI-powered ingredient classification (Safe/Caution/Avoid)
- 🎨 Color-coded safety badges & risk scoring
- 💾 Local storage for scan history
- 👤 User profile for allergies/dietary restrictions
- 📤 Share scan reports
- 📱 Mobile-first, responsive design

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Vision/OCR**: Claude 3.5 Sonnet (Anthropic API)
- **Web Search**: Tavily API
- **State Management**: Zustand (with localStorage persistence)
- **Deployment**: Vercel
- **Storage**: localStorage (MVP) + optional Supabase for future

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys:
  - [Anthropic API Key](https://console.anthropic.com)
  - [Tavily API Key](https://tavily.com)

### Installation

1. **Clone or download the project**
   ```bash
   cd foodsafe-scanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_key_here
   TAVILY_API_KEY=your_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Mobile Testing

- **iOS**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → Menu → Install app

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── extract-ingredients/route.ts  # Claude vision API
│   │   └── analyze-ingredients/route.ts  # Analysis + search pipeline
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Main app page
│   └── globals.css                       # Tailwind styles
├── components/
│   ├── CameraScanner.tsx                # Camera/upload UI
│   ├── ResultsDisplay.tsx               # Results with badges
│   ├── UserProfile.tsx                  # Profile modal
│   └── ScanHistory.tsx                  # Scan history list
├── lib/
│   ├── store.ts                         # Zustand state management
│   └── utils.ts                         # Utility functions
└── public/
    └── manifest.json                    # PWA manifest
```

## API Routes

### POST `/api/extract-ingredients`
Extracts ingredients from an image using Claude's vision model.

**Request:**
```json
{
  "imageBase64": "...",
  "imageMediaType": "image/jpeg"
}
```

**Response:**
```json
{
  "ingredients": [
    {"name": "Wheat Starch", "amount": "30", "unit": "g"},
    {"name": "Soy Lecithin"}
  ],
  "confidence": 0.95,
  "language_detected": "en"
}
```

### POST `/api/analyze-ingredients`
Analyzes ingredients for safety using web search + Claude reasoning.

**Request:**
```json
{
  "ingredients": [
    {"name": "Yellow 5"}
  ],
  "userAllergies": ["Peanuts"]
}
```

**Response:**
```json
{
  "results": [
    {
      "name": "Yellow 5",
      "safety": "Caution",
      "reasoning": "FDA approved but linked to hyperactivity...",
      "sources": [{"title": "...", "url": "..."}],
      "allergen": true,
      "concerns": ["Hyperactivity", "EU banned"]
    }
  ],
  "product_risk_score": "Medium",
  "top_concerns": ["Yellow 5"]
}
```

## Data Models

### Scan
```typescript
{
  id: string;
  timestamp: number;
  imageUrl: string;
  ingredients: Array<{name, amount?, unit?}>;
  analysis: {
    results: AnalyzedIngredient[];
    product_risk_score: "Low" | "Medium" | "High";
    top_concerns: string[];
  };
}
```

### UserProfile
```typescript
{
  allergies: string[];
  dietary_restrictions: string[];
}
```

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial FoodSafe MVP"
   git remote add origin https://github.com/YOUR_USERNAME/foodsafe-scanner
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import the GitHub repository
   - Add environment variables:
     - `ANTHROPIC_API_KEY`
     - `TAVILY_API_KEY`
   - Deploy!

3. **Access your app**
   - Your app will be live at `https://your-project.vercel.app`
   - Share the link for mobile testing

## Building for Production

```bash
npm run build
npm run start
```

## Important Notes

⚠️ **Disclaimer**: FoodSafe Scanner is for informational purposes only. It is not a substitute for professional medical advice. Always consult with a healthcare provider for dietary concerns or allergies.

### Limitations & Future Work

- **v1 Out of Scope**: Full nutrition analysis, barcode lookup, social features, offline mode
- **Future Features**: 
  - Barcode scanning with product database lookup
  - Community ratings & reports
  - Advanced allergy filtering
  - Offline mode with cached data
  - Multi-language support
  - Integration with major allergen databases (FDA, EFSA)

### Best Practices for Accuracy

1. **Good Photo Quality**
   - Well-lit, clear, readable text
   - Avoid glare and shadows
   - Include complete ingredient list

2. **Incomplete Labels**
   - App will gracefully handle unclear text
   - User can manually edit ingredient list
   - Fallback to mock data for demo purposes

3. **Source Verification**
   - All analyses include cited sources
   - Links to FDA, EFSA, PubMed, EWG databases
   - Evidence-based reasoning

## Development Tips

### Adding New Ingredients to Mock Database
Edit `src/app/api/analyze-ingredients/route.ts` → `getMockSearchResults()` to add common ingredients.

### Testing Without API Keys
Mock data is built-in and will be used if API keys are missing. Perfect for local testing!

### Customizing Allergies & Restrictions
Edit the lists in `src/components/UserProfile.tsx`:
- `COMMON_ALLERGIES`
- `COMMON_RESTRICTIONS`

## Troubleshooting

**"Missing API key" error**
- Set `ANTHROPIC_API_KEY` in `.env.local`
- Restart dev server: `npm run dev`

**"Image processing failed"**
- Try a clearer photo with better lighting
- Ensure image is <5MB
- Check Claude API quota

**Camera not working on iOS**
- Requires HTTPS (works on Vercel, not localhost)
- Use `http://localhost:3000` with a QR code on Android
- Or test on deployed Vercel URL

**History not persisting**
- Check browser's localStorage is enabled
- Clear cache if needed
- Works in private/incognito mode on Vercel only

## License

MIT - Feel free to use, modify, and deploy!

---

**Made with 🛡️ for safer eating**
