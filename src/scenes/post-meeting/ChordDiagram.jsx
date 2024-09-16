// ///////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////
// // Shows the legend, and the speaker tooltip is simpler
// ///////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////

import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Paper, Typography, IconButton, Box } from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { tokens } from "../../theme";

const ChordDiagram = ({
  data,
  colors,
  theme,
  toggleComponent,
  speakerNames,
}) => {
  const themeColors = tokens(theme.palette.mode);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const ref = useRef(null);
  const svgRef = useRef(null);

  const groupTicks = (d, step) => {
    const k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, step).map((value) => ({
      value: value,
      angle: value * k + d.startAngle,
    }));
  };

  const updateDimensions = () => {
    if (svgRef.current) {
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      setDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions); // Update size on window resize
    return () => window.removeEventListener("resize", updateDimensions); // Cleanup event listener
  }, []);

  useEffect(() => {
    if (data && data.matrix) {
      // const width = 600;
      // const height = width;
      const { width, height } = dimensions;
      const outerRadius = Math.min(width, height) * 0.5 - 60;
      const innerRadius = outerRadius - 30;
      const { names, colors } = data.meta;
      const matrix = data.matrix;
      const flatMatrix = matrix.flat();
      const sum = d3.sum(flatMatrix);
      const tickStep = d3.tickStep(0, sum, 100);
      const tickStepMajor = d3.tickStep(0, sum, 20);
      const formatValue = d3.formatPrefix(",.0", tickStep);

      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();
      svg
        // .attr("width", width) // Set a fixed width
        // .attr("height", height) // Set a fixed height
        .attr("viewBox", [-width / 2, -height / 2 - 10, width, height + 10])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

      const chord = d3
        .chord()
        .padAngle(20 / innerRadius)
        .sortSubgroups(d3.descending)(matrix);

      const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

      const ribbon = d3.ribbon().radius(innerRadius);

      const groups = svg
        .append("g")
        .selectAll("g")
        .data(chord.groups)
        .join("g");

      groups
        .append("path")
        .attr("fill", (d) => colors[d.index])
        .attr("d", arc)
        .on("mouseover", function (event, d) {
          // Show tooltip immediately
          d3.select("body")
            .append("div")
            .attr("class", "tooltip-chord")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "visible")
            .style("background", `${themeColors.grey[700]}`)
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "3px")
            .style("pointer-events", "none")
            .html(
              `${
                speakerNames[names[d.index]] || names[d.index]
              } contibuted to <u>${d.value.toLocaleString(
                "en-US"
              )} interactions </u>`
            )
            .style("top", `${event.pageY + 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mousemove", function (event) {
          d3.select(".tooltip-chord")
            .style("top", `${event.pageY + 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
          d3.select(".tooltip-chord").remove();
        });

      const tickColor =
        theme.palette.mode === "dark"
          ? "rgba(255, 255, 255, 0.87)"
          : "rgba(0, 0, 0, 0.87)";
      const groupTicksComponent = groups
        .append("g")
        .selectAll("g")
        .data((d) => groupTicks(d, tickStep))
        .join("g")
        .attr(
          "transform",
          (d) =>
            `rotate(${
              (d.angle * 180) / Math.PI - 90
            }) translate(${outerRadius},0)`
        );

      groupTicksComponent
        .append("line")
        .attr("stroke", tickColor)
        .attr("x2", 6);

      groupTicksComponent
        .filter((d) => d.value % tickStepMajor === 0)
        .append("text")
        .attr("x", 8)
        .attr("dy", ".35em")
        .attr("transform", (d) =>
          d.angle > Math.PI ? "rotate(180) translate(-16)" : null
        )
        .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : null))
        .attr("fill", tickColor)
        .text((d) => formatValue(d.value));

      svg
        .append("g")
        .attr("fill-opacity", 0.7)
        .selectAll("path")
        .data(chord)
        .join("path")
        .attr("d", ribbon)
        .attr("fill", (d) => colors[d.target.index])
        .attr("stroke", `${themeColors.grey[300]}`)
        .on("mouseover", function (event, d) {
          d3.select(this).attr("stroke-width", 2).attr("stroke-opacity", 1);

          // Show tooltip immediately
          d3.select("body")
            .append("div")
            .attr("class", "tooltip-chord")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "visible")
            .style("background", `${themeColors.grey[700]}`)
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "3px")
            .style("pointer-events", "none")
            .html(
              `${
                speakerNames[names[d.source.index]] || names[d.source.index]
              } contributed <u>${d.source.value.toLocaleString(
                "en-US"
              )} interaction</u> points  to ${
                speakerNames[names[d.target.index]] || names[d.target.index]
              }${
                d.source.index !== d.target.index
                  ? `<br> And ${
                      speakerNames[names[d.target.index]] ||
                      names[d.target.index]
                    } returned with <u>${d.target.value.toLocaleString(
                      "en-US"
                    )} interaction</u> points`
                  : ``
              }`
            )
            .style("top", `${event.pageY + 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mousemove", function (event) {
          d3.select(".tooltip-chord")
            .style("top", `${event.pageY + 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke-width", 1).attr("stroke-opacity", 0.7);
          d3.select(".tooltip-chord").remove();
        });

      // Render the legend table wrapped inside a table
      const legendTable = svg
        .append("foreignObject")
        .attr("x", -outerRadius)
        .attr("y", -outerRadius - 60) // Move the legend higher above the chord diagram
        .attr("width", 2 * outerRadius)
        .attr("height", 50) // Adjust height for table layout
        .append("xhtml:div")
        .style("font-family", "Roboto, sans-serif")
        .style("color", theme.palette.text.secondary)
        .style("font-size", "16px")
        .style("display", "flex") // Use flexbox to align items horizontally
        .style("justify-content", "center") // Center the legend horizontally
        .style("align-items", "center")
        .style("gap", "20px") // Add space between each legend item
        .html(() => {
          let tableHTML = `<table style="width: 100%; border-collapse: collapse; border: 1px solid ${
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.87)"
              : "rgba(0, 0, 0, 0.87)"
          };">`;
          tableHTML += `<tr style="text-align: center;">`; // Center align the row
          names.forEach((name, i) => {
            const displayName = speakerNames[name] || name; // Use speaker name if available
            const textColor =
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.87)"
                : "rgba(0, 0, 0, 0.87)";

            // Add each legend item as a table cell
            tableHTML += `
      <td style="padding: 8px; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center;">
          <div style="width: 18px; height: 18px; background-color: ${colors[i]};"></div>
          <span style="padding-left: 8px; color: ${textColor};">${displayName}</span>
        </div>
      </td>`;
          });
          tableHTML += `</tr>`;
          tableHTML += `</table>`;
          return tableHTML;
        });
    }
  }, [data, theme.palette.mode, dimensions, speakerNames]);

  // return <svg ref={ref} />;

  return (
    <Paper
      style={{
        overflow: "hidden",
        height: "100%",
        borderRadius: "8px",
        boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
        color: theme.palette.text.primary,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "grab",
          borderBottom: `1px solid ${colors.grey[700]}`,
          padding: "10px 20px",
          borderRadius: "8px 8px 0 0",
          color: theme.palette.text.primary,
        }}
      >
        <div
          className="drag-handle"
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            cursor: "grab",
            color: theme.palette.text.primary,
          }}
        >
          <div
            className="title"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 0,
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h5"
              style={{
                color: colors.grey[100],
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "bold",
              }}
            >
              Chord Diagram
            </Typography>
            <h5
              style={{
                margin: 0,
                padding: "0",
                lineHeight: "1.2",
                color: colors.grey[700],
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              Visualize relationships and influence between speakers
            </h5>
          </div>
        </div>
        <IconButton
          onClick={() => toggleComponent("chord")}
          style={{ position: "relative", zIndex: 1000 }}
        >
          <HighlightOffIcon />
        </IconButton>
      </div>
      <Box
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "5px",
        }}
      >
        <svg ref={ref} />
      </Box>
    </Paper>
  );
};

export default ChordDiagram;
