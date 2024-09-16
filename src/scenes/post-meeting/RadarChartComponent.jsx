import React from "react";
import { Paper, Box, Typography, IconButton } from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import RadarChart from "./RadarChart";
import { tokens } from "../../theme";

const RadarChartComponent = ({
  emojiPredictions,
  theme,
  colors,
  toggleComponent,
  handleEmotionClick,
}) => {
  // const emojiToLabelMap = {
  //   "😁": "Joy 😁",
  //   "😱": "Surprise 😱",
  //   "😡": "Anger 😡",
  //   "😰": "Sadness 😰",
  //   "👿": "Anxious 👿",
  // };
  // const emotionCounts = {
  //   "Joy 😁": 0,
  //   "Surprise 😱": 0,
  //   "Anger 😡": 0,
  //   "Sadness 😰": 0,
  //   "Anxious 👿": 0,
  // };
  const emojiToLabelMap = {
    "😁": "\uf118", // faSmile
    "😱": "\uf5c2", // faSurprise
    "😡": "\uf556", // faAngry
    "😰": "\uf5b4", // faSadTear
    "👿": "\uf5c8", // faFaceTired
  };

  const emotionCounts = {
    "\uf118": 0, // faSmile
    "\uf5c2": 0, // faSurprise
    "\uf556": 0, // faAngry
    "\uf5b4": 0, // faSadTear
    "\uf5c8": 0,
  };

  emojiPredictions.forEach((pred) => {
    if (pred.emoji && emojiToLabelMap[pred.emoji]) {
      const label = emojiToLabelMap[pred.emoji];
      emotionCounts[label]++;
    }
  });

  const maxCount = Math.max(...Object.values(emotionCounts));
  const normalize = (count) => (maxCount ? (count / maxCount) * 5 : 0);
  const normalizedEmotionData = Object.values(emotionCounts).map(normalize);

  console.log("Rendering RadarChart with the following props:");
  console.log("normalizedEmotionData:", normalizedEmotionData);
  console.log("emotionCounts:", emotionCounts);
  console.log("handleEmotionClick:", handleEmotionClick);

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
              Radar Chart
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
              Analyze emotions and sentiments in the transcript
            </h5>
          </div>
        </div>
        <IconButton
          onClick={() => toggleComponent("radar")}
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
          padding: "0px 10px",
        }}
      >
        <RadarChart
          emotionData={normalizedEmotionData}
          actualCounts={emotionCounts}
          onEmotionClick={handleEmotionClick}
        />
      </Box>
    </Paper>
  );
};

export default RadarChartComponent;
