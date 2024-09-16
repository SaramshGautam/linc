import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  IconButton,
  useTheme,
} from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import MicIcon from "@mui/icons-material/Mic";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"; // Import recording dot

import { tokens } from "../../theme";

const Speak = ({
  pushToSpeakLanguage,
  handlePushToSpeakLanguageChange,
  selectedSpeakLanguage,
  startPushToSpeakRecording,
  stopPushToSpeakRecording,
  toggleComponent,
  pushToSpeakTranscript,
  pushToSpeakRef,
  handleScroll,
  isPushToSpeakActive,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
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
              {isPushToSpeakActive
                ? "Push to Speak (Listening...)"
                : "Push to Speak"}
              {/* Show "Listening..." when active */}
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
              Push to talk in any language
            </h5>
          </div>
        </div>

        {/* Button and recording state logic */}
        <div
          className="push-to-speak-button"
          onClick={(e) => {
            if (pushToSpeakLanguage === "") {
              e.stopPropagation();
              alert(
                "Please select a language before starting the push to speak!"
              );
            } else if (selectedSpeakLanguage === "") {
              e.stopPropagation();
              alert(
                "Please select the translation language before starting the push to speak!"
              );
            }
          }}
        >
          <Button
            variant="contained"
            sx={{
              background: "#FFC300",
              color: "#000814",
              fontSize: "12px",
              fontWeight: "bold",
              height: "100%",
              mr: 2,
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "#FFC300",
                color: "#000814",
                boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
                transform: "translateY(-2px)",
              },
            }}
            onMouseDown={startPushToSpeakRecording}
            onMouseUp={stopPushToSpeakRecording}
            disabled={
              pushToSpeakLanguage === "" || selectedSpeakLanguage === ""
            }
            startIcon={
              isPushToSpeakActive ? (
                <FiberManualRecordIcon sx={{ color: "red" }} /> // Red dot when recording
              ) : (
                <MicIcon />
              )
            }
          >
            Push to Talk
          </Button>
        </div>

        <Select
          value={pushToSpeakLanguage}
          onChange={handlePushToSpeakLanguageChange}
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
          <MenuItem value="English">English</MenuItem>
          <MenuItem value="Spanish">Spanish</MenuItem>
          <MenuItem value="Mandarin">Mandarin</MenuItem>
          <MenuItem value="Arabic">Arabic</MenuItem>
          <MenuItem value="Hindi">Hindi</MenuItem>
          <MenuItem value="Bengali">Bengali</MenuItem>
          <MenuItem value="French">French</MenuItem>
          <MenuItem value="Nepali">Nepali</MenuItem>
          <MenuItem value="Portuguese">Portuguese</MenuItem>
          <MenuItem value="Persian">Persian</MenuItem>
        </Select>

        <IconButton
          onClick={() => toggleComponent("speak")}
          style={{ position: "relative", zIndex: 1000 }}
        >
          <HighlightOffIcon />
        </IconButton>
      </div>

      <Box
        ref={pushToSpeakRef}
        onScroll={() => handleScroll("pushToSpeak")}
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
          {pushToSpeakTranscript.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </Typography>
      </Box>
    </Paper>
  );
};

export default Speak;
