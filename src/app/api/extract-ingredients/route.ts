import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

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

Return format (STRICT JSON):
{
  "ingredients": [
    {"name": "Wheat Starch", "amount": "30", "unit": "g"},
    {"name": "Soy Lecithin"},
    {"name": "Yellow 5"}
  ],
  "confidence": 0.95,
  "language_detected": "en"
}`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageMediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: systemPrompt,
            },
          ],
        },
      ],
    });

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let parsedResponse: ExtractResponse;
    try {
      parsedResponse = JSON.parse(textContent.text);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse Claude response as JSON", raw: textContent.text },
        { status: 500 }
      );
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
