import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './App.css';

function App() {
  const svgRef = useRef();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the temperature data
    fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const margin = { top: 100, right: 100, bottom: 100, left: 100 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create main SVG
    const mainSvg = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = mainSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data
    const baseTemperature = data.baseTemperature;
    const monthlyData = data.monthlyVariance;

    // Create scales
    const years = monthlyData.map(d => d.year);
    const months = ["January", "February", "March", "April", "May", "June", 
                   "July", "August", "September", "October", "November", "December"];
    
    const xScale = d3.scaleBand()
      .domain(years)
      .range([0, width])
      .padding(0);

    const yScale = d3.scaleBand()
      .domain(months)
      .range([0, height])
      .padding(0);

    // Color scale
    const temperatures = monthlyData.map(d => baseTemperature + d.variance);
    const minTemp = d3.min(temperatures);
    const maxTemp = d3.max(temperatures);

    const colorScale = d3.scaleThreshold()
      .domain([minTemp, (minTemp + maxTemp) / 4, (minTemp + maxTemp) / 2, (minTemp + maxTemp) * 3/4, maxTemp])
      .range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

    // Create title
    mainSvg.append("text")
      .attr("id", "title")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text("Monthly Global Land-Surface Temperature");

    // Create description
    mainSvg.append("text")
      .attr("id", "description")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", 70)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(`Temperatures are in Celsius and reported as anomalies relative to the 1951-1980 average temperature. Base temperature: ${baseTemperature}°C`);

    // Create X axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format("d"))
      .ticks(d3.timeYear.every(10));

    g.append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    // Create Y axis
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("id", "y-axis")
      .call(yAxis);

    // Create cells
    g.selectAll(".cell")
      .data(monthlyData)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("data-month", d => d.month - 1)
      .attr("data-year", d => d.year)
      .attr("data-temp", d => baseTemperature + d.variance)
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(months[d.month - 1]))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(baseTemperature + d.variance))
      .on("mouseover", function(event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip.style("opacity", 0.9);
        tooltip.html(`
          <strong>${d.year} - ${months[d.month - 1]}</strong><br/>
          Temperature: ${(baseTemperature + d.variance).toFixed(2)}°C<br/>
          Variance: ${d.variance > 0 ? '+' : ''}${d.variance.toFixed(2)}°C
        `)
          .attr("data-year", d.year)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select("#tooltip").style("opacity", 0);
      });

    // Create legend
    const legendWidth = 400;
    const legendHeight = 20;
    const legendX = (width - legendWidth) / 2;
    const legendY = height + 50;

    const legend = g.append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    const legendColors = colorScale.range();
    const legendValues = [];
    for (let i = 0; i < legendColors.length; i++) {
      legendValues.push(minTemp + (maxTemp - minTemp) * i / (legendColors.length - 1));
    }

    legend.selectAll(".legend-cell")
      .data(legendValues)
      .enter()
      .append("rect")
      .attr("class", "legend-cell")
      .attr("x", (d, i) => i * (legendWidth / legendValues.length))
      .attr("y", 0)
      .attr("width", legendWidth / legendValues.length)
      .attr("height", legendHeight)
      .attr("fill", d => colorScale(d));

    // Add legend labels
    legend.selectAll(".legend-label")
      .data(legendValues)
      .enter()
      .append("text")
      .attr("class", "legend-label")
      .attr("x", (d, i) => i * (legendWidth / legendValues.length) + (legendWidth / legendValues.length) / 2)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d => d.toFixed(1));

  }, [data, loading]);

  return (
    <div className="App">
      <div id="tooltip" className="tooltip"></div>
      <svg ref={svgRef}></svg>
      {loading && <div className="loading">Loading data...</div>}
    </div>
  );
}

export default App;
