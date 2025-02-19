import { useRef, useEffect } from "react";
import * as d3 from "d3";

interface ChartData {
  label: string;
  value: number;
  category?: string;
  date?: string;
  [key: string]: string | number | undefined;
}

interface ChartOptions {
  title?: string;
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
  height?: number;
  width?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

interface ChartProps {
  type: "pie" | "bar" | "line" | "scatter" | "area" | "donut";
  data: ChartData[];
  options?: ChartOptions;
}

export const D3Chart = ({ data, type, options = {} }: ChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    const containerWidth = chartRef.current.clientWidth;
    const containerHeight = Math.min(containerWidth * 0.75, 400); // Responsive height

    const margin = options.margin || {
      top: 40,
      right: 30,
      bottom: 50,
      left: 60,
    };

    const width =
      (options.width || containerWidth) - margin.left - margin.right;
    const height =
      (options.height || containerHeight) - margin.top - margin.bottom;

    // Create SVG with responsive viewBox
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add a subtle gradient background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#chart-gradient)")
      .attr("opacity", 0.1);

    // Define gradient
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "chart-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("style", "stop-color: #6366f1; stop-opacity: 0.2");
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("style", "stop-color: #818cf8; stop-opacity: 0.1");

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

    switch (type) {
      case "pie":
      case "donut": {
        const radius = Math.min(width, height) / 2;
        const centerX = width / 2;
        const centerY = height / 2;

        svg.attr(
          "transform",
          `translate(${margin.left + centerX},${margin.top + centerY})`
        );

        const pie = d3
          .pie<ChartData>()
          .value((d) => d.value)
          .sort((a, b) => b.value - a.value); // Sort by value descending

        const arc = d3
          .arc<d3.PieArcDatum<ChartData>>()
          .innerRadius(type === "donut" ? radius * 0.6 : 0)
          .outerRadius(radius)
          .cornerRadius(2)
          .padAngle(0.02);

        // Add subtle shadow
        defs
          .append("filter")
          .attr("id", "shadow")
          .append("feDropShadow")
          .attr("dx", "0")
          .attr("dy", "0")
          .attr("stdDeviation", "3")
          .attr("flood-opacity", "0.2");

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
          .style("stroke-width", "1px")
          .on("mouseover", function (event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style("opacity", 1)
              .attr("transform", function () {
                const centroid = arc.centroid(d as d3.PieArcDatum<ChartData>);
                const x = centroid[0] * 0.1;
                const y = centroid[1] * 0.1;
                return `translate(${x},${y})`;
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
          .attr("fill", "#374151")
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
          .domain([0, (d3.max(data, (d) => d.value) || 0) * 1.1]);

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
          .style("stroke-opacity", 0.2);

        // Add axes
        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em");

        svg.append("g").call(
          d3
            .axisLeft(y)
            .ticks(5)
            .tickFormat((d) => `$${d}`)
        );

        // Add bars with transitions and interactions
        svg
          .selectAll("rect")
          .data(data)
          .enter()
          .append("rect")
          .attr("x", (d) => {
            const xPos = x(d.label);
            return xPos === undefined ? 0 : xPos;
          })
          .attr("y", height)
          .attr("width", x.bandwidth())
          .attr("height", 0)
          .attr("fill", (_, i) => colors[i % colors.length])
          .attr("rx", 4)
          .style("filter", "url(#shadow)")
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
          .attr("fill", "#374151")
          .attr("font-size", "12px")
          .text((d) => `$${d.value.toFixed(2)}`);

        break;
      }
      case "line": {
        const x = d3
          .scaleTime()
          .range([0, width])
          .domain(
            d3.extent(data, (d) => new Date(d.date as string)) as [Date, Date]
          );

        const y = d3
          .scaleLinear()
          .range([height, 0])
          .domain([0, (d3.max(data, (d) => d.value) || 0) * 1.1]);

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
          .style("stroke-opacity", 0.2);

        // Add axes
        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x));

        svg.append("g").call(
          d3
            .axisLeft(y)
            .ticks(5)
            .tickFormat((d) => `$${d}`)
        );

        // Create gradient for area
        const areaGradient = defs
          .append("linearGradient")
          .attr("id", "area-gradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");

        areaGradient
          .append("stop")
          .attr("offset", "0%")
          .attr("style", `stop-color: ${colors[0]}; stop-opacity: 0.3`);

        areaGradient
          .append("stop")
          .attr("offset", "100%")
          .attr("style", "stop-color: #fff; stop-opacity: 0.1");

        // Add area
        const area = d3
          .area<ChartData>()
          .x((d) => x(new Date(d.date as string)))
          .y0(height)
          .y1((d) => y(d.value))
          .curve(d3.curveMonotoneX);

        svg
          .append("path")
          .datum(data)
          .attr("fill", "url(#area-gradient)")
          .attr("d", area);

        // Add line
        const line = d3
          .line<ChartData>()
          .x((d) => x(new Date(d.date as string)))
          .y((d) => y(d.value))
          .curve(d3.curveMonotoneX);

        svg
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", colors[0])
          .attr("stroke-width", 3)
          .attr("d", line)
          .style("filter", "url(#shadow)");

        // Add dots
        svg
          .selectAll(".dot")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", "dot")
          .attr("cx", (d) => {
            const xPos = x(new Date(d.date as string));
            return xPos === undefined ? 0 : xPos;
          })
          .attr("cy", (d) => y(d.value))
          .attr("r", 4)
          .attr("fill", "white")
          .attr("stroke", colors[0])
          .attr("stroke-width", 2)
          .style("filter", "url(#shadow)")
          .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(200).attr("r", 6);

            // Add tooltip
            const tooltip = svg
              .append("g")
              .attr("class", "tooltip")
              .attr(
                "transform",
                `translate(${x(new Date(d.date as string))},${y(d.value) - 20})`
              );

            tooltip
              .append("text")
              .attr("text-anchor", "middle")
              .attr("fill", "#374151")
              .attr("font-size", "12px")
              .text(`$${d.value.toFixed(2)}`);
          })
          .on("mouseout", function () {
            d3.select(this).transition().duration(200).attr("r", 4);

            svg.selectAll(".tooltip").remove();
          });

        break;
      }
    }

    // Add title if provided
    if (options.title) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#374151")
        .attr("font-size", "16px")
        .attr("font-weight", "600")
        .text(options.title);
    }

    // Add axis labels if provided
    if (options.xAxis) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#374151")
        .attr("font-size", "14px")
        .text(options.xAxis);
    }

    if (options.yAxis) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .attr("fill", "#374151")
        .attr("font-size", "14px")
        .text(options.yAxis);
    }
  }, [data, type, options]);

  return (
    <div
      ref={chartRef}
      className="w-full h-[300px] overflow-x-auto bg-white dark:bg-gray-800 rounded-lg p-4 my-2"
      style={{ minHeight: "300px" }}
    />
  );
};
