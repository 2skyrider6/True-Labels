export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

export function getMediaType(
  file: File
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const type = file.type as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";
  if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(type)) {
    return type;
  }
  return "image/jpeg"; // default fallback
}

export function formatAnalysisDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function generateShareText(scan: {
  ingredients: Array<{ name: string }>;
  analysis: { product_risk_score: string; top_concerns: string[] };
}): string {
  const ingredientsList = scan.ingredients
    .map((i) => i.name)
    .join(", ");
  const topConcerns = scan.analysis.top_concerns.join(", ") || "None";

  return `FoodSafe Scan Report:
Risk Level: ${scan.analysis.product_risk_score}
Top Concerns: ${topConcerns}
Ingredients: ${ingredientsList}

Scan this product with FoodSafe Scanner to learn more about what's in your food!`;
}
