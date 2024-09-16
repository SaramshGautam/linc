import React from "react";
import { Radar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSmile,
  faSurprise,
  faAngry,
  faSadTear,
  faFaceTired,
} from "@fortawesome/free-solid-svg-icons";

Chart.register(...registerables);

const RadarChart = ({ emotionData, actualCounts, onEmotionClick }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Define the labels with their corresponding Font Awesome Unicode
  const labels = [
    { label: "\uf118", icon: faSmile, text: "Joy", color: "#ffd700" }, // faSmile
    {
      label: "\uf5c2",
      icon: faSurprise,
      text: "Surprise",
      color: "#1aa82b",
    }, // faSurprise
    { label: "\uf556", icon: faAngry, text: "Anger", color: "red" }, // faAngry
    {
      label: "\uf5b4",
      icon: faSadTear,
      text: "Sadness",
      color: "#2a5298",
    }, // faSadTear
    {
      label: "\uf5c8",
      icon: faFaceTired,
      text: "Anxious",
      color: "orange",
    }, // faFaceTired
  ];
  const maxIndex = emotionData.indexOf(Math.max(...emotionData));
  const highestLabelColor = labels[maxIndex].color;

  const data = {
    labels: labels.map((label) => label.label),
    datasets: [
      {
        label: "Emotion Levels",
        data: emotionData,
        borderColor: colors.grey[200],
        borderWidth: 1,
        // backgroundColor: "rgba(100, 100, 100, 0.5)",
        backgroundColor: highestLabelColor + "90",
      },
    ],
  };

  const options = {
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: colors.grey[100],
        },
        grid: {
          color: colors.grey[100],
        },
        ticks: {
          display: false,
          stepSize: 1,
          maxTicksLimit: 5,
        },
        suggestedMin: 0,
        suggestedMax: 5,
        pointLabels: {
          font: {
            family: '"Font Awesome 5 Free"',
            size: 14,
            weight: "900",
          },
          callback: function (label, index) {
            return labels[index].label + " " + labels[index].text;
          },
          color: function (context) {
            return labels[context.index].color;
          },
        },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: `${colors.grey[700]}`,
        borderColor: "#ccc",
        borderWidth: 1,
        padding: 5,
        borderRadius: 3,
        titleFont: {
          size: 16,
          family: '"Font Awesome 5 Free"',
        },
        bodyFont: {
          size: 12,
          family: '"Font Awesome 5 Free"',
        },
        callbacks: {
          title: function (context) {
            return ""; // Return an empty string for the title as we'll manually add the icon in the custom tooltip.
          },
          label: function (context) {
            const index = context.dataIndex;
            const label = labels[index].label;
            const text = labels[index].text;
            const actualCount = actualCounts[label];

            return `${text}: ${actualCount}`;
          },
        },
        custom: function (tooltipModel) {
          // Tooltip Element
          let tooltipEl = document.getElementById("chartjs-tooltip");

          // Create element on first render
          if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.id = "chartjs-tooltip";
            tooltipEl.innerHTML = "<table></table>";
            document.body.appendChild(tooltipEl);
          }

          // Hide if no tooltip
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = "0";
            return;
          }

          // Set caret Position
          tooltipEl.classList.remove("above", "below", "no-transform");
          if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
          } else {
            tooltipEl.classList.add("no-transform");
          }

          function getBody(bodyItem) {
            return bodyItem.lines;
          }

          // Set Text
          if (tooltipModel.body) {
            const titleLines = tooltipModel.title || [];
            const bodyLines = tooltipModel.body.map(getBody);

            let innerHtml = "<thead>";

            titleLines.forEach(function (title, i) {
              const index = labels.findIndex((label) => label.text === title);
              const icon = labels[index].icon.iconName; // Get the icon's name
              const color = labels[index].color;
              const unicode = labels[index].label;

              innerHtml += `
                <tr>
                  <th style="color:${color}; font-family:'Font Awesome 5 Free'; font-weight: 900;">${unicode}</th>
                </tr>`;
            });

            innerHtml += "</thead><tbody>";

            bodyLines.forEach(function (body, i) {
              const colors = tooltipModel.labelColors[i];
              const style = `background:${colors.backgroundColor}`;
              const span = `<span style="${style}; border-color:${colors.borderColor}; border-width:2px;"></span>`;
              innerHtml += `<tr><td>${span} ${body}</td></tr>`;
            });

            innerHtml += "</tbody>";

            const tableRoot = tooltipEl.querySelector("table");
            tableRoot.innerHTML = innerHtml;
          }

          // Display, position, and set styles for font
          tooltipEl.style.opacity = "1";
          tooltipEl.style.position = "absolute";
          tooltipEl.style.left = tooltipModel.caretX + "px";
          tooltipEl.style.top = tooltipModel.caretY + "px";
          tooltipEl.style.fontFamily = tooltipModel.options.bodyFont.family;
          tooltipEl.style.fontSize = tooltipModel.options.bodyFont.size + "px";
          tooltipEl.style.fontStyle = tooltipModel.options.bodyFont.style;
          tooltipEl.style.padding =
            tooltipModel.options.padding +
            "px " +
            tooltipModel.options.padding +
            "px";
          tooltipEl.style.pointerEvents = "none";
          tooltipEl.style.backgroundColor =
            tooltipModel.options.backgroundColor;
          tooltipEl.style.borderRadius =
            tooltipModel.options.borderRadius + "px";
          tooltipEl.style.borderColor = tooltipModel.options.borderColor;
          tooltipEl.style.borderWidth = tooltipModel.options.borderWidth + "px";
        },
      },
      legend: {
        display: false,
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const emotion = data.labels[elements[0].index];
        onEmotionClick(emotion);
      }
    },
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "10px",
          width: "100%",
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            color: colors.grey[100],
            backgroundColor: "transparent", // Make the background transparent
            border: `1px solid ${colors.grey[300]}`, // Add a border around the legend
            padding: "5px", // Add padding inside the legend
            borderRadius: "8px", // Add rounded corners
          }}
        >
          <thead>
            <tr>
              {labels.map((label, index) => (
                <th
                  key={index}
                  style={{
                    padding: "10px 5px",
                    textAlign: "center",
                    fontSize: "14px",
                    borderRight:
                      index < labels.length - 1
                        ? `1px solid ${colors.grey[300]}`
                        : "none", // Add a border between items
                  }}
                >
                  <FontAwesomeIcon
                    icon={label.icon}
                    style={{ color: label.color, fontSize: "16px" }}
                  />
                  <span style={{ marginLeft: "8px" }}>
                    {actualCounts[label.label]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
      <Radar data={data} options={options} />
    </div>
  );
};

export default RadarChart;
