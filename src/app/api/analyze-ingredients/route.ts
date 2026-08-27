import { NextRequest, NextResponse } from "next/server";

interface IngredientInput {
  name: string;
  amount?: string;
  unit?: string;
}

interface Source {
  title: string;
  url: string;
}

interface AnalyzedIngredient {
  name: string;
  safety: "Safe" | "Caution" | "Avoid";
  reasoning: string;
  sources: Source[];
  allergen: boolean;
  concerns?: string[];
}

interface AnalysisResponse {
  results: AnalyzedIngredient[];
  product_risk_score: "Low" | "Medium" | "High";
  top_concerns: string[];
}

// Mock web search function (using Tavily API if available)
async function searchIngredient(ingredient: string): Promise<string> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    // Fallback: return mock data
    return getMockSearchResults(ingredient);
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: `${ingredient} food safety health effects allergen`,
        max_results: 5,
        include_images: false,
      }),
    });

    if (!response.ok) {
      return getMockSearchResults(ingredient);
    }

    const data = await response.json();
    return JSON.stringify(data.results);
  } catch (error) {
    console.error("Tavily search error:", error);
    return getMockSearchResults(ingredient);
  }
}

function getMockSearchResults(ingredient: string): string {
  // Mock data for common ingredients
  const mockDatabase: Record<string, string> = {
    "wheat starch":
      '[{"title":"Wheat Starch Safety","snippet":"Generally recognized as safe (GRAS) by FDA. Common thickening agent.","url":"https://fda.gov"}]',
    "soy lecithin":
      '[{"title":"Soy Lecithin","snippet":"Common emulsifier derived from soy. Generally safe but may contain allergens for soy-sensitive individuals.","url":"https://efsa.europa.eu"}]',
    "yellow 5":
      '[{"title":"Tartrazine Safety","snippet":"FDA approved but linked to hyperactivity in sensitive children. Banned in some EU countries.","url":"https://pubmed.ncbi.nlm.nih.gov"}]',
    "high fructose corn syrup":
      '[{"title":"HFCS Health Effects","snippet":"Associated with metabolic syndrome and increased calorie intake. Some studies link to obesity.","url":"https://americanheart.org"}]',
  };

  return mockDatabase[ingredient.toLowerCase()] || "[]";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { ingredients, userAllergies } = await request.json();

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Invalid ingredients array" },
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

    const results: AnalyzedIngredient[] = [];
    const avoidCount = { count: 0 };
    const cautionCount = { count: 0 };

    // Analyze each ingredient using Gemini
    for (const ingredient of ingredients) {
      const searchResults = await searchIngredient(ingredient.name);

      const analysisPrompt = `You are a food safety and nutrition expert. Analyze this ingredient based on scientific evidence and regulatory status.

Ingredient: ${ingredient.name}
Amount: ${ingredient.amount || "Not specified"}
Search results: ${searchResults}
User allergies: ${userAllergies?.join(", ") || "None specified"}

Return a JSON object with these fields (STRICT JSON ONLY, no markdown):
{
  "name": "ingredient name",
  "safety": "Safe" or "Caution" or "Avoid",
  "reasoning": "brief 1-2 sentence explanation",
  "sources": [{"title": "source title", "url": "source url"}],
  "allergen": true/false,
  "concerns": ["concern 1", "concern 2"]
}

Classification guide:
- Safe: GRAS status, widely used, no major concerns
- Caution: Some concerns, limited evidence, may affect sensitive groups
- Avoid: Banned in countries, strong evidence of harm, major allergen, known carcinogen

Be evidence-based and concise.`;

      try {
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
                      text: analysisPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                max_output_tokens: 512,
              },
            }),
          }
        );

        if (!response.ok) {
          console.error("Gemini analysis failed for:", ingredient.name);
          continue;
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
          console.error("No response from Gemini for:", ingredient.name);
          continue;
        }

        try {
          // Clean up markdown code blocks if present
          const cleanedText = textContent
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          const analyzed = JSON.parse(cleanedText) as AnalyzedIngredient;
          results.push(analyzed);

          if (analyzed.safety === "Avoid") avoidCount.count++;
          if (analyzed.safety === "Caution") cautionCount.count++;
        } catch (parseError) {
          console.error(
            "Failed to parse Gemini response:",
            textContent,
            parseError
          );
        }
      } catch (error) {
        console.error("Error analyzing ingredient:", ingredient.name, error);
      }
    }

    // Calculate product risk score
    let productRiskScore: "Low" | "Medium" | "High" = "Low";
    if (avoidCount.count > 0) {
      productRiskScore = "High";
    } else if (cautionCount.count >= 2) {
      productRiskScore = "High";
    } else if (cautionCount.count === 1) {
      productRiskScore = "Medium";
    }

    // Get top 3 concerns
    const topConcerns = results
      .filter((r) => r.safety !== "Safe")
      .sort((a, b) => {
        const aScore = a.safety === "Avoid" ? 2 : 1;
        const bScore = b.safety === "Avoid" ? 2 : 1;
        return bScore - aScore;
      })
      .slice(0, 3)
      .map((r) => r.name);

    const analysisResponse: AnalysisResponse = {
      results,
      product_risk_score: productRiskScore,
      top_concerns: topConcerns,
    };

    return NextResponse.json(analysisResponse);
  } catch (error) {
    console.error("Error analyzing ingredients:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
