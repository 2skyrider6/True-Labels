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
        {
          ingredients: [],
          confidence: 0,
          language_detected: "unknown",
          error: "GEMINI_API_KEY not configured",
        }
      );
    }

    // Use Gemini 2.0 Flash to process the image directly
    // The model CAN process images - we just need to use it correctly
    console.log("Using Gemini 2.0 Flash with vision support...");

    const systemPrompt = `You are an expert food safety analyst. Your task is to:
1. Extract ALL ingredients from this food label image
2. Return them as a JSON list with name, amount, and unit

Return ONLY this JSON format (no markdown, no extra text):
{
  "ingredients": [
    {"name": "ingredient name", "amount": "value", "unit": "unit"},
    {"name": "ingredient name"}
  ],
  "confidence": 0.85,
  "language_detected": "en"
}`;

    // Try calling Gemini 2.0 Flash with vision
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system: systemPrompt,
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: imageMediaType,
                    data: imageBase64,
                  },
                },
                {
                  text: "Extract all ingredients from this food label image.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            max_output_tokens: 1024,
            top_p: 1,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Gemini error:", error.error?.message);
      
      // If vision fails, return a message asking user to use the free tier properly
      return NextResponse.json({
        ingredients: [],
        confidence: 0,
        language_detected: "unknown",
        error: "Vision processing not available with current API key. Please ensure your Gemini API key has Vision API enabled.",
      });
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json({
        ingredients: [],
        confidence: 0,
        language_detected: "unknown",
        error: "No response from Gemini",
      });
    }

    // Parse the JSON response
    let parsedResponse: ExtractResponse;
    try {
      let cleanedText = textContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      cleanedText = cleanedText
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]");

      let attempts = 0;
      while (attempts < 5) {
        try {
          parsedResponse = JSON.parse(cleanedText);
          break;
        } catch (err) {
          if (cleanedText.endsWith(",")) {
            cleanedText = cleanedText.slice(0, -1);
          } else if (!cleanedText.endsWith("}") && !cleanedText.endsWith("]")) {
            const openBraces = (cleanedText.match(/{/g) || []).length;
            const closeBraces = (cleanedText.match(/}/g) || []).length;
            const openBrackets = (cleanedText.match(/\[/g) || []).length;
            const closeBrackets = (cleanedText.match(/\]/g) || []).length;

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

      if (!parsedResponse.ingredients || !Array.isArray(parsedResponse.ingredients)) {
        parsedResponse.ingredients = [];
      }
      if (!parsedResponse.confidence) {
        parsedResponse.confidence = 0.7;
      }
      if (!parsedResponse.language_detected) {
        parsedResponse.language_detected = "en";
      }

      console.log(`✓ Extracted ${parsedResponse.ingredients.length} ingredients`);
    } catch (parseError) {
      console.error("Parse error:", parseError);
      
      // Try manual extraction
      const ingredientMatches = textContent.match(/"name":\s*"([^"]+)"/g) || [];
      const ingredients = ingredientMatches.map((match) => ({
        name: match.replace(/"name":\s*"/, "").replace(/"$/, ""),
      }));

      return NextResponse.json({
        ingredients: ingredients.length > 0 ? ingredients : [],
        confidence: 0.5,
        language_detected: "en",
      });
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({
      ingredients: [],
      confidence: 0,
      language_detected: "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
