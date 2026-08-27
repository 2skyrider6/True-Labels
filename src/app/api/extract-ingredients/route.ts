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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { imageBase64, imageMediaType } = await request.json();

    if (!imageBase64 || !imageMediaType) {
      return NextResponse.json(
        { error: "Missing imageBase64 or imageMediaType" },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert at reading food product ingredient labels.
Your task is to extract ALL ingredients from a food label image and return them as a structured JSON list.

IMPORTANT RULES:
1. Extract EVERY ingredient listed, even minor ones
2. For each ingredient, try to capture: name, amount (if visible), unit (g, mg, ml, etc.)
3. Handle common variations: E-numbers (E102), technical names, brand names
4. If text is blurry or unclear, do your best to interpret it
5. Return ONLY valid JSON, no markdown or extra text
6. Detect the language of the label
7. Be strict about accuracy - if unsure about a word, use your best judgment
8. Include allergens and additives (colors, preservatives, etc.)
9. If no ingredients are found, still return valid JSON with empty ingredients array

Return format (STRICT JSON - no markdown, no extra text):
{
  "ingredients": [
    {"name": "Wheat Starch", "amount": "30", "unit": "g"},
    {"name": "Soy Lecithin"},
    {"name": "Yellow 5"}
  ],
  "confidence": 0.95,
  "language_detected": "en"
}

RESPOND WITH ONLY THE JSON OBJECT. NO EXPLANATIONS.`;

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt,
                },
                {
                  inline_data: {
                    mime_type: imageMediaType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            max_output_tokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Gemini API error:", error);
      return NextResponse.json(
        { error: "Failed to call Gemini API" },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Extract text from Gemini response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json(
        { error: "No text response from Gemini" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let parsedResponse: ExtractResponse;
    try {
      // Clean up markdown code blocks and extra whitespace
      let cleanedText = textContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      // Handle potential trailing commas or other JSON issues
      cleanedText = cleanedText
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]");
      
      parsedResponse = JSON.parse(cleanedText);
      
      // Validate response structure
      if (!parsedResponse.ingredients || !Array.isArray(parsedResponse.ingredients)) {
        parsedResponse.ingredients = [];
      }
      if (!parsedResponse.confidence) {
        parsedResponse.confidence = 0.5;
      }
      if (!parsedResponse.language_detected) {
        parsedResponse.language_detected = "unknown";
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", {
        error: parseError,
        textContent: textContent.substring(0, 500),
      });
      
      // Return a fallback response instead of failing
      return NextResponse.json({
        ingredients: [],
        confidence: 0,
        language_detected: "unknown",
        error: "Failed to extract ingredients from image. Please ensure the image clearly shows an ingredient label.",
      });
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error extracting ingredients:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
