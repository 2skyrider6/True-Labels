import { NextRequest, NextResponse } from "next/server";

interface ExtractedIngredient {
  name: string;
  amount?: string;
  unit?: string;
}

interface ExtractResponse {
  ingredients: ExtractedIngredient[];
  confidence: number;
  language_detected: string;
  error?: string;
}

// Mock ingredient database for demonstration
const MOCK_INGREDIENTS: Record<string, ExtractedIngredient[]> = {
  default: [
    { name: "Water", amount: "200", unit: "ml" },
    { name: "Wheat Flour", amount: "250", unit: "g" },
    { name: "Sugar", amount: "50", unit: "g" },
    { name: "Salt", amount: "5", unit: "g" },
    { name: "Yeast", amount: "7", unit: "g" },
    { name: "Vegetable Oil", amount: "30", unit: "ml" },
  ],
  cereal: [
    { name: "Corn Meal" },
    { name: "Sugar" },
    { name: "Salt" },
    { name: "Vitamin Mix" },
    { name: "Iron" },
  ],
  snack: [
    { name: "Potatoes" },
    { name: "Vegetable Oil" },
    { name: "Salt" },
    { name: "Sodium Benzoate" },
  ],
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { imageBase64, imageMediaType } = await request.json();

    if (!imageBase64 || !imageMediaType) {
      return NextResponse.json(
        { error: "Missing imageBase64 or imageMediaType" },
        { status: 400 }
      );
    }

    console.log("Processing image for ingredient extraction...");

    // Determine which mock data to return based on image
    // In production, this would use real OCR/Vision API
    const imageHash = imageBase64.substring(0, 20);
    let ingredients: ExtractedIngredient[] = MOCK_INGREDIENTS.default;

    if (imageHash.includes("a")) {
      ingredients = MOCK_INGREDIENTS.cereal;
    } else if (imageHash.includes("b")) {
      ingredients = MOCK_INGREDIENTS.snack;
    }

    const response: ExtractResponse = {
      ingredients,
      confidence: 0.85,
      language_detected: "en",
    };

    console.log(`✓ Returned ${ingredients.length} mock ingredients for testing`);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error extracting ingredients:", error);
    return NextResponse.json(
      {
        ingredients: [],
        confidence: 0,
        language_detected: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    );
  }
}
