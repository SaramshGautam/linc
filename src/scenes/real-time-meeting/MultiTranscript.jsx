import React, { useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  IconButton,
  useTheme,
} from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { tokens } from "../../theme";

const MultiTranscript = ({
  translatedText,
  selectedTranscriptLanguage,
  handleTranscriptLanguageChange,
  toggleComponent,
  multiTranscriptRef,
  handleScroll,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const autoScroll = useRef(true);

  useEffect(() => {
    if (autoScroll.current) {
      autoScrollToBottom(multiTranscriptRef);
    }
  }, [translatedText]);

  const autoScrollToBottom = (ref) => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  return (
    // <div
    //   key="multi-transcript"
    //   data-grid={{
    //     x: 6,
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
            color: theme.palette.text.primary,
          }}
        >
          {/* <Typography variant="h6" style={{ color: colors.grey[100] }}>
            Multilingual Transcript of the Meeting
          </Typography> */}

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
              Multilingual Transcript of the Meeting
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
              Transcript of the meeting in any language, choose a language
            </h5>
          </div>
        </div>

        <Select
          value={selectedTranscriptLanguage}
          onChange={handleTranscriptLanguageChange}
          displayEmpty
          sx={{
            ml: 1,
            minWidth: 120,
            color: colors.grey[100],
            "& .MuiSelect-select": {
              color: colors.grey[100],
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
          <MenuItem value="">
            <em>Select Language</em>
          </MenuItem>
          <MenuItem value="english">English</MenuItem>
          <MenuItem value="spanish">Spanish</MenuItem>
          <MenuItem value="mandarin">Mandarin</MenuItem>
          <MenuItem value="arabic">Arabic</MenuItem>
          <MenuItem value="hindi">Hindi</MenuItem>
          <MenuItem value="bengali">Bengali</MenuItem>
          <MenuItem value="french">French</MenuItem>
          <MenuItem value="Nepali">Nepali</MenuItem>
          <MenuItem value="Portuguese">Portuguese</MenuItem>
        </Select>

        <IconButton
          onClick={() => toggleComponent("multi-transcript")}
          style={{ position: "relative", zIndex: 1000 }}
        >
          <HighlightOffIcon />
        </IconButton>
      </div>
      <Box
        ref={multiTranscriptRef}
        onScroll={() => handleScroll("multiTranscript")}
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
          {translatedText.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </Typography>
      </Box>
    </Paper>
    // </div>
  );
};

export default MultiTranscript;
