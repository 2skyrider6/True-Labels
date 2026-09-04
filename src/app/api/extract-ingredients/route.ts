import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback to Gemini if Anthropic key is not available
      return NextResponse.json(
        {
          ingredients: [],
          confidence: 0,
          language_detected: "unknown",
          error: "No AI API configured. Please set ANTHROPIC_API_KEY or GEMINI_API_KEY environment variable.",
        }
      );
    }

    const client = new Anthropic({ apiKey });

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

    console.log("Using Claude API for vision-based ingredient extraction");

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Please extract all ingredients from this food label image and return as JSON.",
            },
          ],
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== "text") {
      return NextResponse.json({
        ingredients: [],
        confidence: 0,
        language_detected: "unknown",
        error: "Invalid response from Claude API",
      });
    }

    const textResponse = textContent.text;

    // Parse the JSON response
    let parsedResponse: ExtractResponse;
    try {
      // Clean up markdown code blocks and extra whitespace
      let cleanedText = textResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Handle potential trailing commas or other JSON issues
      cleanedText = cleanedText
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]");

      // Fix incomplete JSON by adding missing closing brackets
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
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

      // Validate response structure
      if (!parsedResponse.ingredients || !Array.isArray(parsedResponse.ingredients)) {
        parsedResponse.ingredients = [];
      }
      if (!parsedResponse.confidence) {
        parsedResponse.confidence = 0.8;
      }
      if (!parsedResponse.language_detected) {
        parsedResponse.language_detected = "en";
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);

      // Try to extract ingredients manually as fallback
      const ingredientMatches = textResponse.match(/"name":\s*"([^"]+)"/g) || [];
      const ingredients = ingredientMatches.map((match) => ({
        name: match.replace(/"name":\s*"/, "").replace(/"$/, ""),
      }));

      return NextResponse.json({
        ingredients: ingredients.length > 0 ? ingredients : [],
        confidence: ingredients.length > 0 ? 0.5 : 0,
        language_detected: "unknown",
      });
    }

    console.log(`✓ Successfully extracted ${parsedResponse.ingredients.length} ingredients`);
    return NextResponse.json(parsedResponse);
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
