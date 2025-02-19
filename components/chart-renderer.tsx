import * as d3 from "d3";
import { useRef, useEffect } from "react";

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

export const ChartRenderer = ({ type, data, options = {} }: ChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    const containerWidth = chartRef.current.clientWidth;
    const containerHeight =
      options.height || Math.min(containerWidth * 0.6, 400);

    const margin = options.margin || {
      top: 40,
      right: 30,
      bottom: 60,
      left: 60,
    };

    const width =
      (options.width || containerWidth) - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create SVG with responsive viewBox
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add gradient definitions
    const defs = svg.append("defs");

    // Add shadow filter
    const filter = defs
      .append("filter")
      .attr("id", "shadow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");

    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3);

    filter.append("feOffset").attr("dx", 2).attr("dy", 2);

    filter
      .append("feComponentTransfer")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.2);

    filter
      .append("feMerge")
      .selectAll("feMergeNode")
      .data(["SourceGraphic", "offsetBlur"])
      .enter()
      .append("feMergeNode")
      .attr("in", (d) => d);

    const colors = options.colors || [
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

    // Add title if provided
    if (options.title) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .attr("fill", "currentColor")
        .text(options.title);
    }

    switch (type) {
      case "pie":
      case "donut": {
        const radius = Math.min(width, height) / 2;
        svg.attr(
          "transform",
          `translate(${margin.left + width / 2},${margin.top + height / 2})`
        );

        const pie = d3
          .pie<ChartData>()
          .value((d) => d.value)
          .sort((a, b) => b.value - a.value);

        const arc = d3
          .arc<d3.PieArcDatum<ChartData>>()
          .innerRadius(type === "donut" ? radius * 0.6 : 0)
          .outerRadius(radius)
          .cornerRadius(4)
          .padAngle(0.02);

        const arcs = svg
          .selectAll("arc")
          .data(pie(data))
          .enter()
          .append("g")
          .attr("class", "arc");

        // Add slices with transitions
        arcs
          .append("path")
          .attr("d", arc)
          .attr("fill", (_, i) => colors[i % colors.length])
          .attr("filter", "url(#shadow)")
          .style("opacity", 0.9)
          .style("stroke", "white")
          .style("stroke-width", "2px")
          .on("mouseover", function (event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style("opacity", 1)
              .attr("transform", () => {
                const centroid = arc.centroid(d);
                return `translate(${centroid[0] * 0.05},${centroid[1] * 0.05})`;
              });
          })
          .on("mouseout", function () {
            d3.select(this)
              .transition()
              .duration(200)
              .style("opacity", 0.9)
              .attr("transform", "translate(0,0)");
          });

        // Add percentage labels
        const total = d3.sum(data, (d) => d.value);
        arcs
          .append("text")
          .attr("transform", (d) => `translate(${arc.centroid(d)})`)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "12px")
          .text((d) => `${((d.data.value / total) * 100).toFixed(1)}%`);

        // Add labels with lines
        const labelArc = d3
          .arc<d3.PieArcDatum<ChartData>>()
          .innerRadius(radius * 1.1)
          .outerRadius(radius * 1.1);

        const labels = arcs.append("g").attr("class", "label-group");

        labels
          .append("text")
          .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
          .attr("dy", "0.35em")
          .attr("text-anchor", (d) => {
            const [x] = labelArc.centroid(d);
            return x > 0 ? "start" : "end";
          })
          .attr("fill", "currentColor")
          .attr("font-size", "12px")
          .text((d) => `${d.data.label} ($${d.data.value.toFixed(2)})`);

        break;
      }
      case "bar": {
        const x = d3
          .scaleBand()
          .range([0, width])
          .domain(data.map((d) => d.label))
          .padding(0.2);

        const y = d3
          .scaleLinear()
          .range([height, 0])
          .domain([0, d3.max(data, (d) => d.value * 1.1) || 0]);

        // Add gridlines
        svg
          .append("g")
          .attr("class", "grid")
          .call(
            d3
              .axisLeft(y)
              .tickSize(-width)
              .tickFormat(() => "")
          )
          .style("stroke-dasharray", "3,3")
          .style("stroke-opacity", 0.2)
          .style("color", "currentColor");

        // Add axes
        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .attr("dx", "-0.8em")
          .attr("dy", "0.15em")
          .style("color", "currentColor");

        svg
          .append("g")
          .call(
            d3
              .axisLeft(y)
              .ticks(5)
              .tickFormat((d) => `$${d}`)
          )
          .style("color", "currentColor");

        // Add bars with transitions and interactions
        svg
          .selectAll("rect")
          .data(data)
          .enter()
          .append("rect")
          .attr("x", (d) => x(d.label) || 0)
          .attr("y", height)
          .attr("width", x.bandwidth())
          .attr("height", 0)
          .attr("fill", (_, i) => colors[i % colors.length])
          .attr("rx", 4)
          .attr("filter", "url(#shadow)")
          .style("opacity", 0.9)
          .transition()
          .duration(800)
          .delay((_, i) => i * 100)
          .attr("y", (d) => y(d.value))
          .attr("height", (d) => height - y(d.value));

        // Add value labels
        svg
          .selectAll(".value-label")
          .data(data)
          .enter()
          .append("text")
          .attr("class", "value-label")
          .attr("x", (d) => (x(d.label) || 0) + x.bandwidth() / 2)
          .attr("y", (d) => y(d.value) - 5)
          .attr("text-anchor", "middle")
          .attr("fill", "currentColor")
          .attr("font-size", "12px")
          .text((d) => `$${d.value.toFixed(2)}`);

        // Add axis labels if provided
        if (options.xAxis) {
          svg
            .append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .attr("text-anchor", "middle")
            .attr("fill", "currentColor")
            .text(options.xAxis);
        }

        if (options.yAxis) {
          svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 15)
            .attr("text-anchor", "middle")
            .attr("fill", "currentColor")
            .text(options.yAxis);
        }

        break;
      }
      case "line":
      case "area": {
        const parseDate = (dateStr: string) => new Date(dateStr);
        const x = d3
          .scaleTime()
          .range([0, width])
          .domain(
            d3.extent(data, (d) => parseDate(d.date || "")) as [Date, Date]
          );

        const y = d3
          .scaleLinear()
          .range([height, 0])
          .domain([0, d3.max(data, (d) => d.value) || 0]);

        if (type === "area") {
          const area = d3
            .area<ChartData>()
            .x((d) => x(parseDate(d.date || "")))
            .y0(height)
            .y1((d) => y(d.value))
            .curve(d3.curveMonotoneX);

          svg
            .append("path")
            .datum(data)
            .attr("fill", "url(#chart-gradient)")
            .attr("d", area);
        }

        const line = d3
          .line<ChartData>()
          .x((d) => x(parseDate(d.date || "")))
          .y((d) => y(d.value))
          .curve(d3.curveMonotoneX);

        svg
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", colors[0])
          .attr("stroke-width", 2)
          .attr("d", line);

        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x));

        svg.append("g").call(d3.axisLeft(y));

        svg
          .selectAll(".dot")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", "dot")
          .attr("cx", (d) => x(parseDate(d.date || "")))
          .attr("cy", (d) => y(d.value))
          .attr("r", 4)
          .attr("fill", "white")
          .attr("stroke", colors[0])
          .attr("stroke-width", 2);

        break;
      }
      case "scatter": {
        const x = d3
          .scaleLinear()
          .range([0, width])
          .domain([0, d3.max(data, (d) => d.value) || 0]);

        const y = d3
          .scaleLinear()
          .range([height, 0])
          .domain([0, d3.max(data, (d) => d.value) || 0]);

        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x));

        svg.append("g").call(d3.axisLeft(y));

        svg
          .selectAll(".dot")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", "dot")
          .attr("cx", (d) => x(d.value))
          .attr("cy", (d) => y(d.value))
          .attr("r", 5)
          .style("fill", (_, i) => colors[i % colors.length]);

        break;
      }
    }
  }, [data, type, options]);

  return (
    <div
      ref={chartRef}
      className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 my-2 min-h-[300px]"
    />
  );
};
