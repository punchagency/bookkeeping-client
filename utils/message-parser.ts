import {
  ChartData,
  ChartOptions,
  ChartProps,
} from "@/components/chart-renderer";

export interface ParsedMessage {
  text: string;
  chartData?: ChartProps;
}

export const parseMessageContent = (content: string): ParsedMessage => {
  try {
    // Remove all code blocks and JSON-like content first
    let cleanContent = content
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/\{[\s\S]*?\}/g, "") // Remove JSON-like content
      .trim();

    // Try to extract chart data
    const jsonMatch = content.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        const cleanJson = cleanupJsonString(jsonMatch[1]);
        const chartData = JSON.parse(cleanJson);
        if (isValidChartData(chartData)) {
          // Filter out any remaining text that might be related to the chart
          let text = cleanContent
            .split("\n")
            .filter((line) => {
              const lower = line.toLowerCase();
              return !(
                (
                  lower.includes("here") ||
                  lower.includes("chart") ||
                  lower.includes("json") ||
                  lower.includes("data") ||
                  lower.includes("visual") ||
                  lower.includes("graph") ||
                  lower.includes("represent") ||
                  lower.includes("show") ||
                  lower.includes("display") ||
                  lower.includes("expense") ||
                  lower.includes("breakdown") ||
                  /^[\s{}\[\]"',\d:]+$/.test(line)
                ) // Remove lines that look like JSON fragments
              );
            })
            .join("\n")
            .trim();

          // Remove any remaining JSON-like fragments
          text = text.replace(/[{}\[\]"',\d:]+/g, "").trim();

          // If what's left is just common chart-related phrases, remove them too
          if (
            text.match(
              /^(here'?s?\s+[az\s]*|would you like|this shows?|showing|displaying)/i
            )
          ) {
            text = "";
          }

          return { text, chartData };
        }
      } catch (e) {
        console.error("Failed to parse chart data:", e);
      }
    }

    // If no chart data found, return cleaned content
    return { text: cleanContent };
  } catch (e) {
    console.error("Error in parseMessageContent:", e);
    return { text: content };
  }
};

// Helper to check if content looks like chart data
const looksLikeChartData = (content: string): boolean => {
  const trimmed = content.trim().toLowerCase();

  // Check for direct chart requests or responses
  if (
    (trimmed.includes("give me a") ||
      trimmed.includes("create a") ||
      trimmed.includes("here's a")) &&
    (trimmed.includes("chart") ||
      trimmed.includes("graph") ||
      trimmed.includes("visualization"))
  ) {
    // Look for JSON structure
    return /\{[\s\S]*"type"[\s\S]*"data"[\s\S]*\}/.test(trimmed);
  }

  // Also check for direct JSON that looks like chart data
  return /\{\s*"type"\s*:\s*"(pie|bar|line|scatter|area|donut)"/.test(trimmed);
};

// Helper to clean up JSON strings
const cleanupJsonString = (jsonStr: string): string => {
  return jsonStr
    .replace(/[\n\r]/g, " ") // Replace newlines with spaces
    .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
    .replace(/([{[,:])\s+/g, "$1") // Remove extra spaces after structural characters
    .replace(/\s+([}\],:])/g, "$1") // Remove extra spaces before structural characters
    .replace(/\\"/g, '"') // Handle escaped quotes
    .replace(/"\s+"/g, '" "') // Fix spaces between strings
    .replace(/([^\\])\\([^"])/, "$1\\\\$2") // Fix escaped characters
    .trim();
};

const isValidChartData = (data: any): data is ChartProps => {
  try {
    if (!data || typeof data !== "object") return false;

    // Validate basic structure
    if (!("type" in data) || !("data" in data)) return false;
    if (!Array.isArray(data.data) || data.data.length === 0) return false;

    // Validate chart type
    if (
      !["pie", "bar", "line", "scatter", "area", "donut"].includes(data.type)
    ) {
      return false;
    }

    // Validate each data point
    return data.data.every(
      (item: any) =>
        item &&
        typeof item === "object" &&
        "label" in item &&
        typeof item.label === "string" &&
        "value" in item &&
        typeof item.value === "number" &&
        !isNaN(item.value)
    );
  } catch (e) {
    console.error("Error validating chart data:", e);
    return false;
  }
};
