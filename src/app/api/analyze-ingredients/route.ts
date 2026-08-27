import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

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

// Mock web search function (using Tavily API)
async function searchIngredient(ingredient: string): Promise<string> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    // Fallback: return empty results for demo
    console.warn("TAVILY_API_KEY not set, using mock data");
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

    const results: AnalyzedIngredient[] = [];
    const avoidCount = { count: 0 };
    const cautionCount = { count: 0 };

    // Analyze each ingredient
    for (const ingredient of ingredients) {
      const searchResults = await searchIngredient(ingredient.name);

      const systemPrompt = `You are a food safety and nutrition expert. Analyze this ingredient based on scientific evidence and regulatory status.
      
Return a JSON object with these fields (STRICT JSON ONLY):
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

Be evidence-based and cite real sources when possible.`;

      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Ingredient: ${ingredient.name}
Amount: ${ingredient.amount || "Not specified"}
Search results: ${searchResults}
User allergies: ${userAllergies?.join(", ") || "None specified"}

${systemPrompt}`,
          },
        ],
      });

      const textContent = response.content.find((block) => block.type === "text");
      if (!textContent || textContent.type !== "text") {
        continue;
      }

      try {
        const analyzed = JSON.parse(textContent.text) as AnalyzedIngredient;
        results.push(analyzed);

        if (analyzed.safety === "Avoid") avoidCount.count++;
        if (analyzed.safety === "Caution") cautionCount.count++;
      } catch {
        // Skip malformed responses
        console.error("Failed to parse ingredient analysis:", textContent.text);
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

    const response: AnalysisResponse = {
      results,
      product_risk_score: productRiskScore,
      top_concerns: topConcerns,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error analyzing ingredients:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
