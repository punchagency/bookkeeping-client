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
    // Try to find JSON in various formats
    const patterns = [
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/, // Code block with json
      /(\{[\s\S]*"type"\s*:\s*"(?:pie|bar|line|scatter|area|donut)"[\s\S]*\})/, // Any JSON with chart type
      /(\{[\s\S]*?\})/, // Raw JSON as fallback
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          const jsonStr = match[1].trim();
          // Clean up the JSON string - handle both pretty-printed and minified formats
          const cleanJson = jsonStr
            .replace(/[\n\r]/g, " ") // Replace newlines with spaces
            .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
            .replace(/([{[,:])\s+/g, "$1") // Remove extra spaces after structural characters
            .replace(/\s+([}\],:])/g, "$1"); // Remove extra spaces before structural characters

          const chartData = JSON.parse(cleanJson);

          if (isValidChartData(chartData)) {
            // Remove the JSON from the content and clean up any double spaces or empty lines
            const text = content
              .replace(match[0], "")
              .replace(/\n\s*\n/g, "\n")
              .trim();

            return { text, chartData };
          }
        } catch (e) {
          console.error(`Failed to parse JSON with pattern ${pattern}:`, e);
          continue; // Try next pattern
        }
      }
    }

    // If we get here, no valid chart data was found
    return { text: content };
  } catch (e) {
    console.error("Error in parseMessageContent:", e);
    return { text: content };
  }
};

const isValidChartData = (data: any): data is ChartProps => {
  return (
    data &&
    typeof data === "object" &&
    "type" in data &&
    ["pie", "bar", "line", "scatter", "area", "donut"].includes(data.type) &&
    "data" in data &&
    Array.isArray(data.data) &&
    data.data.every(
      (item: any) =>
        item &&
        typeof item === "object" &&
        "label" in item &&
        "value" in item &&
        typeof item.value === "number"
    )
  );
};
