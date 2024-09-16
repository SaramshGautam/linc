import React, { useEffect, useRef } from "react";
import { Box, Typography, Paper, IconButton, useTheme } from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { tokens } from "../../theme";

const Transcript = ({
  displayedTranscript,
  toggleComponent,
  transcriptRef,
  handleScroll,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const autoScroll = useRef(true);

  useEffect(() => {
    if (autoScroll.current) {
      autoScrollToBottom(transcriptRef);
    }
  }, [displayedTranscript]);

  const autoScrollToBottom = (ref) => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  return (
    // <div
    //   key="transcript"
    //   data-grid={{
    //     x: 0,
    //     y: 0,
    //     w: 6,
    //     h: 9,
    //     isResizable: true,
    //     resizeHandles: ["se"],
    //   }}
    // >
    <Paper
      style={{
        height: "100%",
        overflow: "hidden",
        borderRadius: "8px",
        transition: "height 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "grab",
          borderBottom: `1px solid ${colors.grey[700]}`,
          borderRadius: "8px 8px 0 0",
          padding: "10px 20px",
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
              Meeting Transcript
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
              Transcript of the meeting as spoken
            </h5>
          </div>
        </div>
        <IconButton
          onClick={() => toggleComponent("transcript")}
          style={{ position: "relative", zIndex: 1000 }}
        >
          <HighlightOffIcon />
        </IconButton>
      </div>
      <Box
        ref={transcriptRef}
        onScroll={() => handleScroll("transcript")}
        style={{
          maxHeight: "85%",
          overflowY: "auto",
          padding: "10px",
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            whiteSpace: "pre-line",
            color: colors.grey[100],
          }}
        >
          {displayedTranscript.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </Typography>
      </Box>
    </Paper>
    // </div>
  );
};

export default Transcript;
