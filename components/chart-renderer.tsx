import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "next-themes";
import { ChartContainer, ChartTooltip } from "./ui/chart";

export interface ChartData {
  label: string;
  value: number;
  category?: string;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface ChartOptions {
  title?: string;
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
  height?: number;
  width?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export interface ChartProps {
  type: "pie" | "bar" | "line" | "scatter" | "area" | "donut";
  data: ChartData[];
  options?: ChartOptions;
}

const DEFAULT_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
  "#f59e0b",
  "#84cc16",
  "#06b6d4",
  "#a855f7",
];

const ChartTitle = ({ title }: { title: string }) => (
  <div className="absolute top-2 left-0 w-full text-center">
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
  </div>
);

export const ChartRenderer = ({ type, data, options = {} }: ChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = options.colors || DEFAULT_COLORS;
  const margin = options.margin || {
    top: 40,
    right: 30,
    bottom: 60,
    left: 60,
  };

  const config = {
    value: {
      theme: {
        light: colors[0],
        dark: colors[0],
      },
    },
  };

  const renderChart = () => {
    switch (type) {
      case "pie":
      case "donut":
        return (
          <>
            {options.title && <ChartTitle title={options.title} />}
            <ResponsiveContainer width="100%" height={400}>
              <PieChart
                margin={{
                  ...margin,
                  top: options.title ? margin.top + 20 : margin.top,
                }}
              >
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={type === "donut" ? "60%" : 0}
                  outerRadius="80%"
                  paddingAngle={2}
                  cornerRadius={4}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.label}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                ${data.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        );

      case "bar":
        return (
          <>
            {options.title && <ChartTitle title={options.title} />}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data}
                margin={{
                  ...margin,
                  top: options.title ? margin.top + 20 : margin.top,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fill: isDark ? "#fff" : "#000" }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fill: isDark ? "#fff" : "#000" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.label}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                ${data.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        );

      case "line":
        return (
          <>
            {options.title && <ChartTitle title={options.title} />}
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={data}
                margin={{
                  ...margin,
                  top: options.title ? margin.top + 20 : margin.top,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: isDark ? "#fff" : "#000" }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fill: isDark ? "#fff" : "#000" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.date}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                ${data.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors[0]}
                  strokeWidth={2}
                  dot={{ fill: colors[0], strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        );

      case "area":
        return (
          <>
            {options.title && <ChartTitle title={options.title} />}
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={data}
                margin={{
                  ...margin,
                  top: options.title ? margin.top + 20 : margin.top,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: isDark ? "#fff" : "#000" }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fill: isDark ? "#fff" : "#000" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.date}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                ${data.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors[0]}
                  fill={colors[0]}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        );

      case "scatter":
        return (
          <>
            {options.title && <ChartTitle title={options.title} />}
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{
                  ...margin,
                  top: options.title ? margin.top + 20 : margin.top,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  type="number"
                  dataKey="value"
                  name="value"
                  tick={{ fill: isDark ? "#fff" : "#000" }}
                />
                <YAxis
                  type="number"
                  dataKey="value"
                  name="value"
                  tick={{ fill: isDark ? "#fff" : "#000" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.label}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                ${data.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={data} fill={colors[0]} />
              </ScatterChart>
            </ResponsiveContainer>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ChartContainer
      config={config}
      className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 my-2 min-h-[300px] relative"
    >
      {renderChart() || <div>No chart data</div>}
    </ChartContainer>
  );
};
