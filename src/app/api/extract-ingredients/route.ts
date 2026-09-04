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

    // Call Google Gemini API with fallback models
    const models = ["gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
    let response = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
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

        if (response.ok) {
          console.log(`Successfully using model: ${modelName}`);
          break;
        } else {
          const error = await response.json();
          lastError = error;
          console.log(`Model ${modelName} failed, trying next...`, error.error?.message);
        }
      } catch (err) {
        console.error(`Error trying model ${modelName}:`, err);
        lastError = err;
      }
    }

    if (!response?.ok) {
      console.error("All Gemini models failed. Last error:", lastError);
      return NextResponse.json(
        { error: "Failed to call Gemini API. Please ensure your API key is valid and has vision capabilities enabled." },
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

      // Fix incomplete JSON by finding the last complete object/array
      // If JSON is incomplete, try to complete it
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        try {
          parsedResponse = JSON.parse(cleanedText);
          break; // Success
        } catch (err) {
          // If it ends with incomplete data, try closing it
          if (cleanedText.endsWith(",")) {
            cleanedText = cleanedText.slice(0, -1);
          } else if (!cleanedText.endsWith("}") && !cleanedText.endsWith("]")) {
            // Try to complete the JSON by adding missing closing brackets
            const openBraces = (cleanedText.match(/{/g) || []).length;
            const closeBraces = (cleanedText.match(/}/g) || []).length;
            const openBrackets = (cleanedText.match(/\[/g) || []).length;
            const closeBrackets = (cleanedText.match(/\]/g) || []).length;

            // Add missing closing brackets
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
              cleanedText += "]";
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
              cleanedText += "}";
            }
          } else {
            throw err;
          }
          attempts++;
        }
      }
      
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
      
      // Try to extract ingredients manually from the text as a last resort
      const ingredientMatches = textContent.match(/"name":\s*"([^"]+)"/g) || [];
      const ingredients = ingredientMatches.map((match) => ({
        name: match.replace(/"name":\s*"/, "").replace(/"$/, ""),
      }));

      // Return fallback response with any extracted ingredients
      return NextResponse.json({
        ingredients: ingredients.length > 0 ? ingredients : [],
        confidence: ingredients.length > 0 ? 0.3 : 0,
        language_detected: "unknown",
        error: ingredients.length > 0 
          ? undefined 
          : "Failed to extract ingredients from image. Please ensure the image clearly shows an ingredient label.",
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
