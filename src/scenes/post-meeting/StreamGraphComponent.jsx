import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import {
  Paper,
  Typography,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { tokens } from "../../theme";
import { useTheme } from "@mui/material";

const StreamGraphComponent = ({
  selectedItem,
  setSelectedItem,
  dataType,
  handleItemsLoaded,
  topics,
  isSpeakerSelected,
  handleSpeakerChange,
  handleTopicChange,
  toggleComponent,
  component,
  speakerNames,
  meeting_id,
  transcript,
  bertTranscript,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const ref = useRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Meeting ID from the stream graph", meeting_id);
      const formData = new FormData();
      formData.append("meeting_id", meeting_id);
      formData.append("dataType", dataType);

      try {
        const response = await axios.post(
          `http://127.0.0.1:5080/get-csv`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        const csvData = response.data;
        const parsedData = d3.csvParse(csvData);
        setData(parsedData);
      } catch (error) {
        console.error("Error fetching CSV data:", error);
      }
    };

    fetchData();
  }, [dataType, meeting_id]);

  useEffect(() => {
    if (data.length === 0) return;

    d3.select(ref.current).selectAll("*").remove();

    const margin = { top: 0, right: 270, bottom: 40, left: 30 };
    const width = 800;
    const height = 200;

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right + 100} ${
          height + margin.top + margin.bottom
        }`
      )
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const scalingFactor = 1;

    data.forEach((d, index) => {
      const minutes = index * 5;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      d.time_frame = `${hours}h${remainingMinutes}m`;

      d.originalValues = {};
      Object.keys(d).forEach((key) => {
        if (key !== "time_frame" && key !== "originalValues") {
          d.originalValues[key] = +d[key];
          d[key] = +d[key] * scalingFactor;
        }
      });
    });

    const keys = data.columns.slice(1);

    if (handleItemsLoaded) {
      handleItemsLoaded(keys);
    }

    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.time_frame))
      .range([0, width])
      .padding(0);

    svg
      .append("g")
      .attr("transform", `translate(0,${height + 30})`)
      .call(d3.axisBottom(x).tickSize(-height * 0.05))
      .selectAll(".tick text")
      .style("font-size", "14px")
      .style("fill", colors.grey[300]);

    svg.selectAll(".tick line").attr("stroke", colors.grey[300]);
    svg.selectAll(".domain").attr("stroke", colors.grey[300]);

    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", width - 50)
      .attr("y", height + 50)
      .style("font-size", "16px")
      .style("fill", colors.grey[300])
      .text("Time");

    const k = 9;

    const color = d3.scaleOrdinal().domain(keys).range(d3.schemeSpectral[k]);
    const stackedData = d3.stack().offset(d3.stackOffsetSilhouette).keys(keys)(
      data
    );
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(stackedData, (layer) => d3.min(layer, (d) => d[0])),
        d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1])),
      ])
      .range([height, 0]);

    const legendHeight = (keys.length * 50) / 2;
    // const yPosition = height / 2 - legendHeight / 2;
    const yPosition = height - 220;

    const sanitizeKey = (key) => {
      return key.replace(/[^a-zA-Z0-9]/g, "_");
    };

    const legendTable = svg
      .append("foreignObject")
      .attr("x", width + 60)
      .attr("y", yPosition)
      .attr("width", 270)
      .attr("height", keys.length * 50)
      .append("xhtml:div")
      .style("font-family", "Roboto, sans-serif")
      .style("color", colors.grey[100])
      .style("overflow-y", "auto") // Enable scrolling if content overflows
      .html(() => {
        let tableHTML = `<table style="width:100%; border-collapse: collapse; table-layout: fixed;">`;
        keys.forEach((key, i) => {
          const displayKey = speakerNames[key] || key; // Use speaker name if available
          const sanitizedKey = sanitizeKey(displayKey);
          tableHTML += `
        <tr id="legend-${sanitizedKey}" style="border-bottom: 1px solid ${
            colors.grey[700]
          };">
      <td style="width:18px; height:18px; background-color:${color(key)};"></td>
      <td style="padding-left: 10px; font-size: 14px; word-wrap: break-word; color:${
        colors.grey[400]
      };">${displayKey}</td>
      </tr>`;
        });
        tableHTML += `</table>`;
        return tableHTML;
      });

    const Tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", `${colors.grey[700]}`)
      // .style("color", colors.grey[700])
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("font-size", "14px")
      .style("transform", "translate(-50%, -100%)")
      .style("white-space", "nowrap")
      .style("text-align", "center")
      .style("z-index", 10);

    Tooltip.append("div")
      .attr("class", "tooltip-arrow")
      .style("width", "0")
      .style("height", "0")
      .style("border-left", "6px solid transparent")
      .style("border-right", "6px solid transparent")
      .style("border-top", "6px solid #6a5acd")
      .style("position", "absolute")
      .style("left", "50%")
      .style("top", "100%")
      .style("transform", "translateX(-50%)");

    const focusLine = svg
      .append("line")
      .attr("class", "focusLine")
      .style("stroke", colors.grey[300])
      .style("stroke-width", 1.5)
      .style("opacity", 0);

    const focusText = svg
      .append("text")
      .attr("class", "focusText")
      .style("fill", colors.grey[300])
      .style("font-size", "10px")
      .style("opacity", 0);

    const focusCount = svg
      .append("text")
      .attr("class", "focusCount")
      .style("fill", colors.grey[300])
      .style("font-size", "10px")
      .style("opacity", 0);

    const mouseover = function (event, d) {
      const key = d.key;
      const sanitizedKey = sanitizeKey(key);
      Tooltip.style("opacity", 1);
      focusLine.style("opacity", 1);
      focusText.style("opacity", 1);
      d3.selectAll(".myArea").style("opacity", 0.2);
      d3.select(this).style("stroke", "black").style("opacity", 1);

      d3.select(`#legend-${sanitizedKey}`)
        .style("font-weight", "bold")
        .style("color", colors.grey[100]);
    };

    const mousemove = function (event, d) {
      const grp = d.key;
      const sanitizedGrp = sanitizeKey(grp);

      const mouseX = d3.pointer(event, this)[0];

      // Get the exact timestamp based on the mouseX position
      const scaleX = d3
        .scaleLinear()
        .domain([0, width])
        .range([0, (data.length - 1) * 5]); // Range in minutes assuming 5-minute intervals

      const exactMinutes = scaleX(mouseX);
      const exactHours = Math.floor(exactMinutes / 60);
      const remainingMinutes = Math.round(exactMinutes % 60);
      const exactTimeFrame = `${exactHours}h${remainingMinutes}m`;

      const closestIndex = Math.round(mouseX / (width / (data.length - 1)));
      const closestData = data[closestIndex];
      const closestValue = closestData ? closestData.originalValues[grp] : null;

      const closestX = x(closestData.time_frame);

      const threshold = 10; // You can adjust this value

      // Show the tooltip with the group name
      let tooltipContent = `${speakerNames[grp] || grp}`;
      let count;
      if (Math.abs(mouseX - closestX) <= threshold && closestValue !== null) {
        // Add the value to the tooltip content if within the threshold
        tooltipContent += `: ${closestValue}`;
        count = `${closestValue}`;
      }

      // Display the tooltip with the updated content
      Tooltip.html(tooltipContent)
        .style("left", `${event.pageX + 150}px`)
        .style("top", `${event.pageY + 50}px`)
        .style("opacity", 1);

      focusLine
        .attr("x1", mouseX)
        .attr("y1", 5)
        .attr("x2", mouseX)
        .attr("y2", height + 30)
        .style("opacity", 1);

      focusText
        .attr("x", mouseX + 5)
        .attr("y", height + 25)
        .text(exactTimeFrame);

      focusCount
        .attr("x", mouseX)
        .attr("y", 0)
        .text(closestValue !== null ? count : "")
        .style("opacity", 1)
        .style("font-size", "12px") // Set the font size
        .style("font-weight", "bold") // Make the text bold
        .style("fill", colors.grey[100]) // Set the text color
        .style("text-anchor", "middle") // Center the text horizontally
        .style("dominant-baseline", "middle") // Center the text vertically
        .style("font-family", "'Roboto', sans-serif"); // Set the font family

      // Update legend item with the count
      d3.select(`#legend-${sanitizedGrp}`).html(
        `<td style="width:18px; height:18px; background-color:${color(
          grp
        )};"></td>
        <td style="padding-left: 10px; font-size: 14px; word-wrap: break-word; color:${
          colors.grey[400]
        };">${grp}: ${closestValue !== null ? closestValue : ""}</td>`
      );
    };

    const mouseleave = function (event, d) {
      const key = d.key;
      const sanitizedKey = sanitizeKey(key);
      Tooltip.style("opacity", 0);
      focusLine.style("opacity", 0);
      focusText.style("opacity", 0);
      d3.selectAll(".myArea").style("opacity", 1).style("stroke", "black");

      // Restore legend item to original state
      d3.select(`#legend-${sanitizedKey}`)
        .style("font-weight", "normal")
        .style("color", colors.grey[400])
        .html(
          `<td style="width:18px; height:18px; background-color:${color(
            key
          )};"></td>
          <td style="padding-left: 10px; font-size: 14px; word-wrap: break-word; color:${
            colors.grey[400]
          };">${key}</td>`
        );
    };

    const area = d3
      .area()
      .x((d) => x(d.data.time_frame))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));

    svg
      .selectAll("mylayers")
      .data(stackedData)
      .enter()
      .append("path")
      .attr("class", "myArea")
      .style("fill", (d) => color(d.key))
      .attr("d", area)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

    svg.selectAll("path").each(function (d) {
      if (d) {
        d3.select(this).style("opacity", d.key === selectedItem ? 1 : 0.2);
      }
    });

    return () => {
      d3.select(ref.current).selectAll("*").remove();
      d3.select("body").select("div.tooltip").remove();
    };
  }, [selectedItem, data, speakerNames, dataType]);

  return (
    <Paper
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        borderRadius: "8px",
        boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
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
        }}
      >
        <div
          className="drag-handle"
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            cursor: "grab",
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
              Stream graph
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
              Visualize topics and speaker data flows over time
            </h5>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ paddingRight: "10px" }}>
            <FormControl variant="outlined" style={{ minWidth: 120 }}>
              <InputLabel
                style={{
                  display: "flex",
                  alignItems: "center", // Ensure text is centered vertically
                  justifyContent: "center", // Ensure text is centered horizontally
                  color: colors.grey[100],
                }}
              >
                {isSpeakerSelected ? "Speaker" : "Topic"}
              </InputLabel>

              <Select
                value={selectedItem}
                onChange={(event) => setSelectedItem(event.target.value)}
                label={isSpeakerSelected ? "Speakers" : "Topics"}
                sx={{
                  ml: 1,
                  minWidth: 120,
                  color: colors.grey[100],
                  "& .MuiSelect-select": {
                    color: colors.grey[100],
                    display: "flex",
                    alignItems: "center", // Center the selected text vertically
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.grey[100],
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.grey[100],
                  },
                  "& .MuiSvgIcon-root": {
                    color: colors.grey[100],
                  },
                }}
                size="small"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      "& .MuiMenuItem-root": {
                        color: colors.grey[100],
                      },
                    },
                  },
                }}
              >
                {topics.map((topic) => (
                  <MenuItem key={topic} value={topic}>
                    {topic}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSpeakerChange}
            sx={{
              marginRight: "10px",
              color: isSpeakerSelected ? "black" : "white",
              backgroundColor: isSpeakerSelected ? "#FFC300" : colors.grey[800],
              "&:hover": {
                backgroundColor: isSpeakerSelected
                  ? "#FFC300"
                  : colors.grey[800],
                transform: "translateY(-2px)",
              },
            }}
          >
            Speakers
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleTopicChange}
            sx={{
              color: !isSpeakerSelected ? "black" : "white",
              backgroundColor: !isSpeakerSelected
                ? "#FFC300"
                : colors.grey[800],
              "&:hover": {
                backgroundColor: !isSpeakerSelected
                  ? "#FFC300"
                  : colors.grey[800],
                transform: "translateY(-2px)",
              },
            }}
          >
            Topics
          </Button>
        </div>

        <IconButton
          onClick={() => toggleComponent("streamgraph", "post-meeting")}
          style={{ position: "relative", zIndex: 1000 }}
        >
          <HighlightOffIcon />
        </IconButton>
      </div>

      <div
        ref={ref}
        id="my_dataviz"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      ></div>
    </Paper>
  );
};

export default StreamGraphComponent;
